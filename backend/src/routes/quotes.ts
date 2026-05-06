import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { buildNmdEmailTemplate, sendEmail } from "../services/email.js";

const router = Router();

function mapQuote(row: any) {
  return {
    id: row.id,
    quoteNumber: row.quote_number,
    clientId: row.client_id,
    clientName: row.client_name,
    serviceType: row.service_type,
    total: Number(row.total || 0),
    status: row.status,
    convertedInvoiceId: row.converted_invoice_id,
    acceptedAt: row.accepted_at,
    createdAt: row.created_at
  };
}

async function getClientEmail(clientId?: string | null, clientName?: string | null) {
  if (clientId) {
    const result = await pool.query(
      `SELECT email FROM clients WHERE id = $1 LIMIT 1`,
      [clientId]
    );

    if (result.rows[0]?.email) return result.rows[0].email;
  }

  if (clientName) {
    const result = await pool.query(
      `SELECT email FROM clients WHERE LOWER(CONCAT(first_name, ' ', last_name)) = LOWER($1) LIMIT 1`,
      [clientName]
    );

    if (result.rows[0]?.email) return result.rows[0].email;
  }

  return null;
}

router.get("/", requireAuth, async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        quote_number,
        client_id,
        client_name,
        service_type,
        total,
        status,
        converted_invoice_id,
        accepted_at,
        created_at
      FROM quotes
      ORDER BY created_at DESC
    `);

    return res.json({
      quotes: result.rows.map(mapQuote)
    });
  } catch (error) {
    console.error("quotes list error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { clientId, clientName, serviceType, total, status } = req.body as {
      clientId?: string | null;
      clientName?: string;
      serviceType?: string;
      total?: number;
      status?: "draft" | "sent" | "accepted" | "declined" | "expired";
    };

    if (!clientName || !serviceType) {
      return res.status(400).json({
        error: "Client name and service type are required"
      });
    }

    const result = await pool.query(
      `
      INSERT INTO quotes
        (client_id, client_name, service_type, total, status, accepted_at)
      VALUES
        ($1, $2, $3, $4, $5, CASE WHEN $5 = 'accepted' THEN NOW() ELSE NULL END)
      RETURNING
        id,
        quote_number,
        client_id,
        client_name,
        service_type,
        total,
        status,
        converted_invoice_id,
        accepted_at,
        created_at
      `,
      [
        clientId || null,
        clientName,
        serviceType,
        total || 0,
        status || "draft"
      ]
    );

    const quote = mapQuote(result.rows[0]);

    if (quote.status === "sent") {
      const email = await getClientEmail(quote.clientId, quote.clientName);

      if (email) {
        await sendEmail({
          to: email,
          subject: `NMD Quote #${quote.quoteNumber}`,
          html: buildNmdEmailTemplate({
            title: `Quote #${quote.quoteNumber}`,
            message: `
              <p>Hi ${quote.clientName},</p>
              <p>Your NMD quote is ready.</p>
              <p><strong>Service:</strong> ${quote.serviceType}</p>
              <p><strong>Total:</strong> $${quote.total.toFixed(2)}</p>
              <p>Please log into your client portal or contact NMD if you have questions.</p>
            `
          }),
          text: `Your NMD quote #${quote.quoteNumber} is ready. Total: $${quote.total.toFixed(2)}`
        });
      }
    }

    return res.status(201).json({ quote });
  } catch (error) {
    console.error("quote create error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.patch("/:quoteId", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { quoteId } = req.params;
    const { clientId, clientName, serviceType, total, status } = req.body as {
      clientId?: string | null;
      clientName?: string;
      serviceType?: string;
      total?: number;
      status?: "draft" | "sent" | "accepted" | "declined" | "expired";
    };

    const beforeResult = await pool.query(
      `SELECT * FROM quotes WHERE id = $1 LIMIT 1`,
      [quoteId]
    );

    if (beforeResult.rows.length === 0) {
      return res.status(404).json({ error: "Quote not found" });
    }

    const before = beforeResult.rows[0];

    const result = await pool.query(
      `
      UPDATE quotes
      SET
        client_id = $2,
        client_name = COALESCE($3, client_name),
        service_type = COALESCE($4, service_type),
        total = COALESCE($5, total),
        status = COALESCE($6, status),
        accepted_at = CASE
          WHEN $6 = 'accepted' AND accepted_at IS NULL THEN NOW()
          ELSE accepted_at
        END
      WHERE id = $1
      RETURNING
        id,
        quote_number,
        client_id,
        client_name,
        service_type,
        total,
        status,
        converted_invoice_id,
        accepted_at,
        created_at
      `,
      [
        quoteId,
        clientId || null,
        clientName ?? null,
        serviceType ?? null,
        total ?? null,
        status ?? null
      ]
    );

    const quote = mapQuote(result.rows[0]);

    if (before.status !== "sent" && quote.status === "sent") {
      const email = await getClientEmail(quote.clientId, quote.clientName);

      if (email) {
        await sendEmail({
          to: email,
          subject: `NMD Quote #${quote.quoteNumber}`,
          html: buildNmdEmailTemplate({
            title: `Quote #${quote.quoteNumber}`,
            message: `
              <p>Hi ${quote.clientName},</p>
              <p>Your NMD quote is ready.</p>
              <p><strong>Service:</strong> ${quote.serviceType}</p>
              <p><strong>Total:</strong> $${quote.total.toFixed(2)}</p>
              <p>Please log into your client portal or contact NMD if you have questions.</p>
            `
          }),
          text: `Your NMD quote #${quote.quoteNumber} is ready. Total: $${quote.total.toFixed(2)}`
        });
      }
    }

    if (before.status !== "accepted" && quote.status === "accepted") {
      const email = await getClientEmail(quote.clientId, quote.clientName);

      if (email) {
        await sendEmail({
          to: email,
          subject: `NMD Quote #${quote.quoteNumber} accepted`,
          html: buildNmdEmailTemplate({
            title: "Quote Accepted",
            message: `
              <p>Hi ${quote.clientName},</p>
              <p>Your quote has been marked as accepted.</p>
              <p><strong>Service:</strong> ${quote.serviceType}</p>
              <p><strong>Total:</strong> $${quote.total.toFixed(2)}</p>
              <p>NMD will follow up with scheduling or invoice details.</p>
            `
          }),
          text: `Your NMD quote #${quote.quoteNumber} has been accepted.`
        });
      }
    }

    return res.json({ quote });
  } catch (error) {
    console.error("quote update error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/:quoteId/accept", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { quoteId } = req.params;

    const result = await pool.query(
      `
      UPDATE quotes
      SET
        status = 'accepted',
        accepted_at = COALESCE(accepted_at, NOW())
      WHERE id = $1
      RETURNING
        id,
        quote_number,
        client_id,
        client_name,
        service_type,
        total,
        status,
        converted_invoice_id,
        accepted_at,
        created_at
      `,
      [quoteId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Quote not found" });
    }

    const quote = mapQuote(result.rows[0]);
    const email = await getClientEmail(quote.clientId, quote.clientName);

    if (email) {
      await sendEmail({
        to: email,
        subject: `NMD Quote #${quote.quoteNumber} accepted`,
        html: buildNmdEmailTemplate({
          title: "Quote Accepted",
          message: `
            <p>Hi ${quote.clientName},</p>
            <p>Your quote has been marked as accepted.</p>
            <p><strong>Service:</strong> ${quote.serviceType}</p>
            <p><strong>Total:</strong> $${quote.total.toFixed(2)}</p>
            <p>NMD will follow up with scheduling or invoice details.</p>
          `
        }),
        text: `Your NMD quote #${quote.quoteNumber} has been accepted.`
      });
    }

    return res.json({ quote });
  } catch (error) {
    console.error("quote accept error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/:quoteId/convert-to-invoice", requireAuth, requireRole("admin"), async (req, res) => {
  const client = await pool.connect();

  try {
    const { quoteId } = req.params;

    await client.query("BEGIN");

    const quoteResult = await client.query(
      `
      SELECT *
      FROM quotes
      WHERE id = $1
      LIMIT 1
      `,
      [quoteId]
    );

    if (quoteResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Quote not found" });
    }

    const quote = quoteResult.rows[0];

    if (quote.converted_invoice_id) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        error: "This quote has already been converted to an invoice."
      });
    }

    if (quote.status !== "accepted") {
      await client.query("ROLLBACK");
      return res.status(400).json({
        error: "Only accepted quotes can be converted to invoices."
      });
    }

    const invoiceResult = await client.query(
      `
      INSERT INTO invoices
        (client_id, client_name, job_name, total, status)
      VALUES
        ($1, $2, $3, $4, 'unpaid')
      RETURNING
        id,
        invoice_number,
        client_id,
        client_name,
        job_name,
        total,
        status,
        job_id,
        assigned_user_id,
        created_at,
        payment_provider,
        payment_link_id,
        payment_link_url,
        payment_status,
        payment_created_at,
        stripe_checkout_session_id
      `,
      [
        quote.client_id || null,
        quote.client_name,
        quote.service_type,
        quote.total || 0
      ]
    );

    const invoice = invoiceResult.rows[0];

    await client.query(
      `
      UPDATE quotes
      SET converted_invoice_id = $2
      WHERE id = $1
      `,
      [quoteId, invoice.id]
    );

    await client.query("COMMIT");

    const email = await getClientEmail(quote.client_id, quote.client_name);

    if (email) {
      await sendEmail({
        to: email,
        subject: `NMD Invoice #${invoice.invoice_number} created`,
        html: buildNmdEmailTemplate({
          title: `Invoice #${invoice.invoice_number}`,
          message: `
            <p>Hi ${quote.client_name},</p>
            <p>Your accepted quote has been converted into an invoice.</p>
            <p><strong>Service:</strong> ${invoice.job_name}</p>
            <p><strong>Total:</strong> $${Number(invoice.total || 0).toFixed(2)}</p>
            <p>NMD will send a payment link when ready.</p>
          `
        }),
        text: `Your NMD invoice #${invoice.invoice_number} has been created.`
      });
    }

    return res.status(201).json({
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoice_number,
        clientId: invoice.client_id,
        clientName: invoice.client_name,
        jobName: invoice.job_name,
        total: Number(invoice.total),
        status: invoice.status,
        jobId: invoice.job_id,
        assignedUserId: invoice.assigned_user_id,
        createdAt: invoice.created_at,
        paymentProvider: invoice.payment_provider,
        paymentLinkId: invoice.payment_link_id,
        paymentLinkUrl: invoice.payment_link_url,
        paymentStatus: invoice.payment_status,
        paymentCreatedAt: invoice.payment_created_at,
        stripeCheckoutSessionId: invoice.stripe_checkout_session_id
      }
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("quote convert invoice error", error);
    return res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
});

router.delete("/:quoteId", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { quoteId } = req.params;

    const result = await pool.query(
      `DELETE FROM quotes WHERE id = $1 RETURNING id`,
      [quoteId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Quote not found" });
    }

    return res.json({ deleted: true });
  } catch (error) {
    console.error("quote delete error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;

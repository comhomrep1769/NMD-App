import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

function money(value: unknown) {
  return Number(value || 0);
}

function calculateInvoiceTotals(input: {
  subtotal?: number;
  taxRate?: number;
  salesTaxAmount?: number;
  total?: number;
}) {
  const subtotal = Number(input.subtotal ?? 0);
  const taxRate = Number(input.taxRate ?? 0.065);

  const salesTaxAmount =
    input.salesTaxAmount !== undefined && input.salesTaxAmount !== null
      ? Number(input.salesTaxAmount)
      : Number((subtotal * taxRate).toFixed(2));

  const total =
    input.total !== undefined && input.total !== null
      ? Number(input.total)
      : Number((subtotal + salesTaxAmount).toFixed(2));

  return {
    subtotal,
    taxRate,
    salesTaxAmount,
    total
  };
}

function mapInvoice(row: any) {
  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    clientId: row.client_id,
    clientName: row.client_name,
    jobName: row.job_name,
    subtotal: money(row.subtotal),
    taxRate: money(row.tax_rate),
    salesTaxAmount: money(row.sales_tax_amount),
    total: money(row.total),
    status: row.status,
    jobId: row.job_id,
    jobTitle: row.job_title,
    assignedUserId: row.assigned_user_id,
    assignedEmployeeName: row.assigned_employee_name,
    createdAt: row.created_at,
    paymentProvider: row.payment_provider,
    paymentLinkId: row.payment_link_id,
    paymentLinkUrl: row.payment_link_url,
    paymentStatus: row.payment_status,
    paymentCreatedAt: row.payment_created_at,
    stripeCheckoutSessionId: row.stripe_checkout_session_id
  };
}

router.get("/", requireAuth, async (_req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        i.id,
        i.invoice_number,
        i.client_id,
        i.client_name,
        i.job_name,
        i.subtotal,
        i.tax_rate,
        i.sales_tax_amount,
        i.total,
        i.status,
        i.job_id,
        j.title AS job_title,
        i.assigned_user_id,
        u.display_name AS assigned_employee_name,
        i.created_at,
        i.payment_provider,
        i.payment_link_id,
        i.payment_link_url,
        i.payment_status,
        i.payment_created_at,
        i.stripe_checkout_session_id
      FROM invoices i
      LEFT JOIN jobs j ON j.id = i.job_id
      LEFT JOIN users u ON u.id = i.assigned_user_id
      ORDER BY i.created_at DESC
      `
    );

    return res.json({
      invoices: result.rows.map(mapInvoice)
    });
  } catch (error) {
    console.error("invoices list error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const {
      clientId,
      clientName,
      jobName,
      subtotal,
      taxRate,
      salesTaxAmount,
      total,
      status,
      jobId,
      assignedUserId
    } = req.body as {
      clientId?: string | null;
      clientName?: string;
      jobName?: string;
      subtotal?: number;
      taxRate?: number;
      salesTaxAmount?: number;
      total?: number;
      status?: "paid" | "unpaid";
      jobId?: string | null;
      assignedUserId?: string | null;
    };

    if (!clientName || !jobName) {
      return res.status(400).json({
        error: "Client name and job/service name are required"
      });
    }

    const totals = calculateInvoiceTotals({
      subtotal,
      taxRate,
      salesTaxAmount,
      total
    });

    const result = await pool.query(
      `
      INSERT INTO invoices
        (
          client_id,
          client_name,
          job_name,
          subtotal,
          tax_rate,
          sales_tax_amount,
          total,
          status,
          job_id,
          assigned_user_id,
          payment_status
        )
      VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING
        id,
        invoice_number,
        client_id,
        client_name,
        job_name,
        subtotal,
        tax_rate,
        sales_tax_amount,
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
        clientId || null,
        clientName.trim(),
        jobName.trim(),
        totals.subtotal,
        totals.taxRate,
        totals.salesTaxAmount,
        totals.total,
        status || "unpaid",
        jobId || null,
        assignedUserId || null,
        status === "paid" ? "paid" : "unpaid"
      ]
    );

    return res.status(201).json({
      invoice: mapInvoice(result.rows[0])
    });
  } catch (error) {
    console.error("invoice create error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.patch("/:invoiceId", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { invoiceId } = req.params;

    const existingResult = await pool.query(
      `
      SELECT *
      FROM invoices
      WHERE id = $1
      LIMIT 1
      `,
      [invoiceId]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    const existing = existingResult.rows[0];

    const {
      clientId,
      clientName,
      jobName,
      subtotal,
      taxRate,
      salesTaxAmount,
      total,
      status,
      jobId,
      assignedUserId
    } = req.body as {
      clientId?: string | null;
      clientName?: string;
      jobName?: string;
      subtotal?: number;
      taxRate?: number;
      salesTaxAmount?: number;
      total?: number;
      status?: "paid" | "unpaid";
      jobId?: string | null;
      assignedUserId?: string | null;
    };

    const totals = calculateInvoiceTotals({
      subtotal: subtotal ?? Number(existing.subtotal || existing.total || 0),
      taxRate: taxRate ?? Number(existing.tax_rate || 0.065),
      salesTaxAmount:
        salesTaxAmount !== undefined
          ? salesTaxAmount
          : Number(existing.sales_tax_amount || 0),
      total: total !== undefined ? total : undefined
    });

    const result = await pool.query(
      `
      UPDATE invoices
      SET
        client_id = $2,
        client_name = COALESCE($3, client_name),
        job_name = COALESCE($4, job_name),
        subtotal = $5,
        tax_rate = $6,
        sales_tax_amount = $7,
        total = $8,
        status = COALESCE($9, status),
        job_id = $10,
        assigned_user_id = $11,
        payment_status = CASE
          WHEN $9 = 'paid' THEN 'paid'
          WHEN $9 = 'unpaid' AND payment_status = 'paid' THEN 'unpaid'
          ELSE payment_status
        END
      WHERE id = $1
      RETURNING
        id,
        invoice_number,
        client_id,
        client_name,
        job_name,
        subtotal,
        tax_rate,
        sales_tax_amount,
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
        invoiceId,
        clientId || null,
        clientName ?? null,
        jobName ?? null,
        totals.subtotal,
        totals.taxRate,
        totals.salesTaxAmount,
        totals.total,
        status ?? null,
        jobId || null,
        assignedUserId || null
      ]
    );

    return res.json({
      invoice: mapInvoice(result.rows[0])
    });
  } catch (error) {
    console.error("invoice update error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:invoiceId", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { invoiceId } = req.params;

    const result = await pool.query(
      `
      DELETE FROM invoices
      WHERE id = $1
      RETURNING id
      `,
      [invoiceId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    return res.json({ deleted: true });
  } catch (error) {
    console.error("invoice delete error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;

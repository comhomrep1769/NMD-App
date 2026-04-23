import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, quote_number, client_id, client_name, service_type, total, status, created_at
      FROM quotes
      ORDER BY created_at DESC
    `);

    res.json({
      quotes: result.rows.map((r) => ({
        id: r.id,
        quoteNumber: r.quote_number,
        clientId: r.client_id,
        clientName: r.client_name,
        serviceType: r.service_type,
        total: Number(r.total),
        status: r.status,
        createdAt: r.created_at
      }))
    });
  } catch (error) {
    console.error("quotes list error", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { clientId, clientName, serviceType, total, status } = req.body;

    if (!clientName || !serviceType) {
      return res.status(400).json({ error: "Client name and service type are required" });
    }

    const result = await pool.query(
      `
      INSERT INTO quotes (client_id, client_name, service_type, total, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, quote_number, client_id, client_name, service_type, total, status, created_at
      `,
      [clientId || null, clientName, serviceType, total || 0, status || "draft"]
    );

    const r = result.rows[0];

    res.status(201).json({
      quote: {
        id: r.id,
        quoteNumber: r.quote_number,
        clientId: r.client_id,
        clientName: r.client_name,
        serviceType: r.service_type,
        total: Number(r.total),
        status: r.status,
        createdAt: r.created_at
      }
    });
  } catch (error) {
    console.error("quote create error", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/:quoteId", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { quoteId } = req.params;
    const { clientId, clientName, serviceType, total, status } = req.body;

    const result = await pool.query(
      `
      UPDATE quotes
      SET
        client_id = COALESCE($2, client_id),
        client_name = COALESCE($3, client_name),
        service_type = COALESCE($4, service_type),
        total = COALESCE($5, total),
        status = COALESCE($6, status)
      WHERE id = $1
      RETURNING id, quote_number, client_id, client_name, service_type, total, status, created_at
      `,
      [quoteId, clientId ?? null, clientName ?? null, serviceType ?? null, total ?? null, status ?? null]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Quote not found" });
    }

    const r = result.rows[0];

    res.json({
      quote: {
        id: r.id,
        quoteNumber: r.quote_number,
        clientId: r.client_id,
        clientName: r.client_name,
        serviceType: r.service_type,
        total: Number(r.total),
        status: r.status,
        createdAt: r.created_at
      }
    });
  } catch (error) {
    console.error("quote update error", error);
    res.status(500).json({ error: "Server error" });
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

    res.json({ deleted: true });
  } catch (error) {
    console.error("quote delete error", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/:quoteId/convert-to-invoice", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { quoteId } = req.params;

    const quoteResult = await pool.query(
      `
      SELECT id, client_id, client_name, service_type, total, status
      FROM quotes
      WHERE id = $1
      LIMIT 1
      `,
      [quoteId]
    );

    if (quoteResult.rows.length === 0) {
      return res.status(404).json({ error: "Quote not found" });
    }

    const quote = quoteResult.rows[0];

    if (quote.status !== "accepted") {
      return res.status(400).json({ error: "Only accepted quotes can be converted" });
    }

    const invoiceResult = await pool.query(
      `
      INSERT INTO invoices (client_id, client_name, job_name, total, status)
      VALUES ($1, $2, $3, $4, 'unpaid')
      RETURNING id, invoice_number, client_id, client_name, job_name, total, status, created_at
      `,
      [quote.client_id, quote.client_name, quote.service_type, quote.total]
    );

    const i = invoiceResult.rows[0];

    res.status(201).json({
      invoice: {
        id: i.id,
        invoiceNumber: i.invoice_number,
        clientId: i.client_id,
        clientName: i.client_name,
        jobName: i.job_name,
        total: Number(i.total),
        status: i.status,
        createdAt: i.created_at
      }
    });
  } catch (error) {
    console.error("quote convert error", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;

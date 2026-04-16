import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/my", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        i.id,
        i.invoice_number,
        i.client_name,
        i.job_name,
        i.total,
        i.status,
        i.created_at
      FROM invoices i
      WHERE i.assigned_user_id = $1
      ORDER BY i.created_at DESC
      `,
      [req.user!.id]
    );

    const invoices = result.rows.map((row) => ({
      id: row.id,
      invoiceNumber: row.invoice_number,
      clientName: row.client_name,
      jobName: row.job_name,
      total: Number(row.total),
      status: row.status,
      createdAt: row.created_at
    }));

    const paidTotal = invoices
      .filter((i) => i.status === "paid")
      .reduce((sum, i) => sum + i.total, 0);

    const unpaidTotal = invoices
      .filter((i) => i.status === "unpaid")
      .reduce((sum, i) => sum + i.total, 0);

    return res.json({
      invoices,
      summary: {
        paidTotal,
        unpaidTotal
      }
    });
  } catch (error) {
    console.error("ledger error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;

import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        i.id,
        i.invoice_number,
        i.client_id,
        i.client_name,
        i.job_name,
        i.total,
        i.status,
        i.job_id,
        i.assigned_user_id,
        i.created_at,
        u.display_name AS assigned_employee_name,
        j.title AS job_title
      FROM invoices i
      LEFT JOIN users u ON u.id = i.assigned_user_id
      LEFT JOIN jobs j ON j.id = i.job_id
      ORDER BY i.created_at DESC
    `);

    res.json({
      invoices: result.rows.map((r) => ({
        id: r.id,
        invoiceNumber: r.invoice_number,
        clientId: r.client_id,
        clientName: r.client_name,
        jobName: r.job_name,
        total: Number(r.total),
        status: r.status,
        jobId: r.job_id,
        jobTitle: r.job_title,
        assignedUserId: r.assigned_user_id,
        assignedEmployeeName: r.assigned_employee_name,
        createdAt: r.created_at
      }))
    });
  } catch (error) {
    console.error("invoices list error", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const {
      clientId,
      clientName,
      jobName,
      total,
      status,
      jobId,
      assignedUserId
    } = req.body;

    if (!clientName || !jobName) {
      return res.status(400).json({ error: "Client name and job name are required" });
    }

    const result = await pool.query(
      `
      INSERT INTO invoices
        (client_id, client_name, job_name, total, status, job_id, assigned_user_id)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7)
      RETURNING
        id, invoice_number, client_id, client_name, job_name, total, status,
        job_id, assigned_user_id, created_at
      `,
      [
        clientId || null,
        clientName,
        jobName,
        total || 0,
        status || "unpaid",
        jobId || null,
        assignedUserId || null
      ]
    );

    const r = result.rows[0];

    res.status(201).json({
      invoice: {
        id: r.id,
        invoiceNumber: r.invoice_number,
        clientId: r.client_id,
        clientName: r.client_name,
        jobName: r.job_name,
        total: Number(r.total),
        status: r.status,
        jobId: r.job_id,
        assignedUserId: r.assigned_user_id,
        createdAt: r.created_at
      }
    });
  } catch (error) {
    console.error("invoice create error", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/:invoiceId", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const {
      clientId,
      clientName,
      jobName,
      total,
      status,
      jobId,
      assignedUserId
    } = req.body;

    const result = await pool.query(
      `
      UPDATE invoices
      SET
        client_id = $2,
        client_name = COALESCE($3, client_name),
        job_name = COALESCE($4, job_name),
        total = COALESCE($5, total),
        status = COALESCE($6, status),
        job_id = $7,
        assigned_user_id = $8
      WHERE id = $1
      RETURNING
        id, invoice_number, client_id, client_name, job_name, total, status,
        job_id, assigned_user_id, created_at
      `,
      [
        invoiceId,
        clientId || null,
        clientName ?? null,
        jobName ?? null,
        total ?? null,
        status ?? null,
        jobId || null,
        assignedUserId || null
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    const r = result.rows[0];

    res.json({
      invoice: {
        id: r.id,
        invoiceNumber: r.invoice_number,
        clientId: r.client_id,
        clientName: r.client_name,
        jobName: r.job_name,
        total: Number(r.total),
        status: r.status,
        jobId: r.job_id,
        assignedUserId: r.assigned_user_id,
        createdAt: r.created_at
      }
    });
  } catch (error) {
    console.error("invoice update error", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:invoiceId", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { invoiceId } = req.params;

    const result = await pool.query(
      `DELETE FROM invoices WHERE id = $1 RETURNING id`,
      [invoiceId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    res.json({ deleted: true });
  } catch (error) {
    console.error("invoice delete error", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;

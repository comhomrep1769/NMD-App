import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
const router = Router();
function mapCommission(row) {
    return {
        id: row.id,
        salesRepId: row.sales_rep_id,
        salesRepName: row.sales_rep_name,
        invoiceId: row.invoice_id,
        invoiceNumber: row.invoice_number,
        clientName: row.client_name,
        commissionType: row.commission_type,
        rate: Number(row.rate),
        subtotal: Number(row.subtotal),
        amount: Number(row.amount),
        tier: Number(row.tier),
        status: row.status,
        notes: row.notes,
        createdAt: row.created_at,
    };
}
// ── Sales rep: get their own dashboard data ──────────────────────────────────
router.get("/me", requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const [commissionsResult, invoicesResult] = await Promise.all([
            pool.query(`SELECT sc.*, u.display_name AS sales_rep_name,
          i.invoice_number, i.client_name
         FROM sales_commissions sc
         JOIN users u ON u.id = sc.sales_rep_id
         JOIN invoices i ON i.id = sc.invoice_id
         WHERE sc.sales_rep_id = $1
         ORDER BY sc.created_at DESC`, [userId]),
            pool.query(`SELECT id, invoice_number, client_name, job_name, total, status, created_at
         FROM invoices WHERE sales_rep_id = $1 ORDER BY created_at DESC`, [userId])
        ]);
        const commissions = commissionsResult.rows.map(mapCommission);
        const totalEarned = commissions.filter(c => c.status === 'paid').reduce((s, c) => s + c.amount, 0);
        const totalPending = commissions.filter(c => c.status === 'pending').reduce((s, c) => s + c.amount, 0);
        const totalApproved = commissions.filter(c => c.status === 'approved').reduce((s, c) => s + c.amount, 0);
        return res.json({
            commissions,
            invoices: invoicesResult.rows,
            summary: { totalEarned, totalPending, totalApproved, totalCommissions: commissions.length }
        });
    }
    catch (error) {
        console.error("sales me error", error);
        return res.status(500).json({ error: "Server error" });
    }
});
// ── Admin: get all sales reps summary ────────────────────────────────────────
router.get("/reps", requireAuth, requireRole("admin"), async (_req, res) => {
    try {
        const result = await pool.query(`SELECT u.id, u.display_name, u.email,
         COUNT(sc.id) AS total_commissions,
         COALESCE(SUM(CASE WHEN sc.status = 'paid' THEN sc.amount ELSE 0 END), 0) AS total_paid,
         COALESCE(SUM(CASE WHEN sc.status = 'pending' THEN sc.amount ELSE 0 END), 0) AS total_pending,
         COALESCE(SUM(CASE WHEN sc.status = 'approved' THEN sc.amount ELSE 0 END), 0) AS total_approved
       FROM users u
       LEFT JOIN sales_commissions sc ON sc.sales_rep_id = u.id
       WHERE u.role = 'sales'
       GROUP BY u.id, u.display_name, u.email
       ORDER BY u.display_name ASC`);
        return res.json({ reps: result.rows });
    }
    catch (error) {
        console.error("sales reps error", error);
        return res.status(500).json({ error: "Server error" });
    }
});
// ── Admin: get all commissions ────────────────────────────────────────────────
router.get("/commissions", requireAuth, requireRole("admin"), async (_req, res) => {
    try {
        const result = await pool.query(`SELECT sc.*, u.display_name AS sales_rep_name, i.invoice_number, i.client_name
       FROM sales_commissions sc
       JOIN users u ON u.id = sc.sales_rep_id
       JOIN invoices i ON i.id = sc.invoice_id
       ORDER BY sc.created_at DESC`);
        return res.json({ commissions: result.rows.map(mapCommission) });
    }
    catch (error) {
        console.error("sales commissions error", error);
        return res.status(500).json({ error: "Server error" });
    }
});
// ── Admin: create a commission entry ─────────────────────────────────────────
router.post("/commissions", requireAuth, requireRole("admin"), async (req, res) => {
    try {
        const { salesRepId, invoiceId, commissionType, rate, subtotal, tier, notes } = req.body;
        if (!salesRepId || !invoiceId || !rate || !subtotal) {
            return res.status(400).json({ error: "salesRepId, invoiceId, rate, and subtotal are required." });
        }
        const amount = Number((Number(subtotal) * Number(rate)).toFixed(2));
        const result = await pool.query(`INSERT INTO sales_commissions (sales_rep_id, invoice_id, commission_type, rate, subtotal, amount, tier, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`, [salesRepId, invoiceId, commissionType || 'one_time', rate, subtotal, amount, tier || 1, notes || null]);
        // Link invoice to sales rep
        await pool.query(`UPDATE invoices SET sales_rep_id = $1 WHERE id = $2`, [salesRepId, invoiceId]);
        const full = await pool.query(`SELECT sc.*, u.display_name AS sales_rep_name, i.invoice_number, i.client_name
       FROM sales_commissions sc
       JOIN users u ON u.id = sc.sales_rep_id
       JOIN invoices i ON i.id = sc.invoice_id
       WHERE sc.id = $1`, [result.rows[0].id]);
        return res.status(201).json({ commission: mapCommission(full.rows[0]) });
    }
    catch (error) {
        console.error("create commission error", error);
        return res.status(500).json({ error: "Server error" });
    }
});
// ── Admin: update commission status ──────────────────────────────────────────
router.patch("/commissions/:id", requireAuth, requireRole("admin"), async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;
        const result = await pool.query(`UPDATE sales_commissions SET
         status = COALESCE($2, status),
         notes = COALESCE($3, notes)
       WHERE id = $1
       RETURNING *`, [id, status ?? null, notes ?? null]);
        if (result.rows.length === 0)
            return res.status(404).json({ error: "Commission not found" });
        const full = await pool.query(`SELECT sc.*, u.display_name AS sales_rep_name, i.invoice_number, i.client_name
       FROM sales_commissions sc
       JOIN users u ON u.id = sc.sales_rep_id
       JOIN invoices i ON i.id = sc.invoice_id
       WHERE sc.id = $1`, [id]);
        return res.json({ commission: mapCommission(full.rows[0]) });
    }
    catch (error) {
        console.error("update commission error", error);
        return res.status(500).json({ error: "Server error" });
    }
});
// ── Admin: delete commission ──────────────────────────────────────────────────
router.delete("/commissions/:id", requireAuth, requireRole("admin"), async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`DELETE FROM sales_commissions WHERE id = $1 RETURNING id`, [id]);
        if (result.rows.length === 0)
            return res.status(404).json({ error: "Commission not found" });
        return res.json({ deleted: true });
    }
    catch (error) {
        console.error("delete commission error", error);
        return res.status(500).json({ error: "Server error" });
    }
});
export default router;

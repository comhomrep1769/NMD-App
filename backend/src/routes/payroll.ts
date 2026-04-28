import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/runs", requireAuth, requireRole("admin"), async (_req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        pr.id,
        pr.period_start,
        pr.period_end,
        pr.status,
        pr.notes,
        pr.approved_at,
        pr.paid_at,
        pr.created_by,
        pr.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', pri.id,
              'userId', pri.user_id,
              'displayName', u.display_name,
              'email', u.email,
              'amount', pri.amount,
              'notes', pri.notes
            )
          ) FILTER (WHERE pri.id IS NOT NULL),
          '[]'
        ) AS items
      FROM pay_runs pr
      LEFT JOIN pay_run_items pri ON pri.pay_run_id = pr.id
      LEFT JOIN users u ON u.id = pri.user_id
      GROUP BY pr.id
      ORDER BY pr.period_end DESC, pr.created_at DESC
      `
    );

    return res.json({
      payRuns: result.rows.map((row) => ({
        id: row.id,
        periodStart: row.period_start,
        periodEnd: row.period_end,
        status: row.status,
        notes: row.notes,
        approvedAt: row.approved_at,
        paidAt: row.paid_at,
        createdBy: row.created_by,
        createdAt: row.created_at,
        items: row.items.map((item: any) => ({
          ...item,
          amount: Number(item.amount)
        }))
      }))
    });
  } catch (error) {
    console.error("payroll runs list error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/preview", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { periodStart, periodEnd } = req.query as {
      periodStart?: string;
      periodEnd?: string;
    };

    if (!periodStart || !periodEnd) {
      return res.status(400).json({ error: "periodStart and periodEnd are required" });
    }

    const result = await pool.query(
      `
      SELECT
        u.id AS user_id,
        u.display_name,
        u.email,
        u.pay_rate,

        COALESCE(SUM(s.paid_minutes), 0)::numeric AS paid_minutes,

        COALESCE(SUM(s.paid_minutes) / 60, 0)::numeric AS paid_hours,

        COALESCE((SUM(s.paid_minutes) / 60) * u.pay_rate, 0)::numeric AS wage_amount,

        COALESCE((
          SELECT SUM(i.total)
          FROM invoices i
          WHERE i.assigned_user_id = u.id
            AND i.status = 'paid'
            AND i.created_at::date >= $1::date
            AND i.created_at::date <= $2::date
        ), 0)::numeric AS revenue_generated

      FROM users u
      LEFT JOIN employee_time_sessions s ON s.user_id = u.id
        AND s.status = 'closed'
        AND s.work_date >= $

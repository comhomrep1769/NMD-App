import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

const TIERS = [
  { min: 0, max: 1000, pct: 0.02 },
  { min: 1000, max: 2000, pct: 0.04 },
  { min: 2000, max: 3500, pct: 0.06 },
  { min: 3500, max: Infinity, pct: 0.08 },
];

function getBonusPct(revenue: number): number {
  for (const tier of TIERS) {
    if (revenue >= tier.min && revenue < tier.max) return tier.pct;
  }
  return 0.08;
}

function calcBonus(revenue: number): number {
  return Math.round(revenue * getBonusPct(revenue) * 100) / 100;
}

// GET /api/bonus/tiers - get tier config (admin can update later)
router.get("/tiers", requireAuth, async (_req, res) => {
  return res.json({ tiers: TIERS.map(t => ({ ...t, max: t.max === Infinity ? null : t.max })) });
});

// GET /api/bonus/summary - admin sees all employees
router.get("/summary", requireAuth, requireRole("admin"), async (_req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const result = await pool.query(`
      SELECT
        u.id AS user_id,
        u.display_name,
        u.email,
        u.pay_rate,
        COUNT(DISTINCT ja.job_id) AS jobs_completed,
        COALESCE(SUM(
          i.total / NULLIF(worker_count.cnt, 0)
        ), 0) AS individual_revenue
      FROM users u
      LEFT JOIN job_assignments ja ON ja.user_id = u.id
      LEFT JOIN jobs j ON j.id = ja.job_id AND j.status = 'completed'
      LEFT JOIN invoices i ON i.job_id = j.id AND i.status = 'paid'
        AND i.created_at >= $1
      LEFT JOIN (
        SELECT job_id, COUNT(*) AS cnt
        FROM job_assignments
        GROUP BY job_id
      ) worker_count ON worker_count.job_id = j.id
      WHERE u.role = 'employee'
      GROUP BY u.id, u.display_name, u.email, u.pay_rate
      ORDER BY individual_revenue DESC
    `, [sevenDaysAgo.toISOString()]);

    const employees = result.rows.map(row => {
      const revenue = Number(row.individual_revenue || 0);
      const bonusPct = getBonusPct(revenue);
      const bonusAmount = calcBonus(revenue);
      return {
        userId: row.user_id,
        displayName: row.display_name,
        email: row.email,
        payRate: Number(row.pay_rate || 30),
        jobsCompleted: Number(row.jobs_completed || 0),
        weeklyRevenue: revenue,
        bonusPct: Math.round(bonusPct * 100),
        bonusAmount,
        tier: bonusPct === 0.02 ? 1 : bonusPct === 0.04 ? 2 : bonusPct === 0.06 ? 3 : 4,
        status: "pending",
      };
    });

    const totalBonus = employees.reduce((s, e) => s + e.bonusAmount, 0);
    const totalRevenue = employees.reduce((s, e) => s + e.weeklyRevenue, 0);

    return res.json({ employees, totalBonus, totalRevenue, period: "last_7_days" });
  } catch (err) {
    console.error("bonus summary error", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/bonus/me - employee sees their own
router.get("/me", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const result = await pool.query(`
      SELECT
        COUNT(DISTINCT ja.job_id) AS jobs_completed,
        COALESCE(SUM(
          i.total / NULLIF(worker_count.cnt, 0)
        ), 0) AS individual_revenue
      FROM job_assignments ja
      LEFT JOIN jobs j ON j.id = ja.job_id AND j.status = 'completed'
      LEFT JOIN invoices i ON i.job_id = j.id AND i.status = 'paid'
        AND i.created_at >= $2
      LEFT JOIN (
        SELECT job_id, COUNT(*) AS cnt
        FROM job_assignments
        GROUP BY job_id
      ) worker_count ON worker_count.job_id = j.id
      WHERE ja.user_id = $1
    `, [userId, sevenDaysAgo.toISOString()]);

    const revenue = Number(result.rows[0]?.individual_revenue || 0);
    const bonusPct = getBonusPct(revenue);
    const bonusAmount = calcBonus(revenue);
    const tier = bonusPct === 0.02 ? 1 : bonusPct === 0.04 ? 2 : bonusPct === 0.06 ? 3 : 4;
    const nextTier = TIERS[tier] || null;
    const toNextTier = nextTier && nextTier.max !== Infinity ? Math.max(0, nextTier.min - revenue) : 0;

    return res.json({
      weeklyRevenue: revenue,
      jobsCompleted: Number(result.rows[0]?.jobs_completed || 0),
      bonusPct: Math.round(bonusPct * 100),
      bonusAmount,
      tier,
      toNextTier,
      nextTierPct: nextTier ? Math.round(nextTier.pct * 100) : null,
      status: "pending_approval",
    });
  } catch (err) {
    console.error("bonus me error", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /api/bonus/approve/:userId - admin approves bonus
router.post("/approve/:userId", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, notes } = req.body;
    const approvedBy = req.user!.id;

    await pool.query(`
      INSERT INTO bonus_approvals (user_id, amount, approved_by, notes, approved_at)
      VALUES ($1, $2, $3, $4, NOW())
    `, [userId, amount, approvedBy, notes || '']);

    return res.json({ success: true });
  } catch (err) {
    console.error("bonus approve error", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
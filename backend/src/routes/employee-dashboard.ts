import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/me", requireAuth, requireRole("employee"), async (req, res) => {
  try {
    const userId = req.user!.id;

    const [jobStats, revenueStats, hoursStats, payrollStats, payRateStats] =
      await Promise.all([
        pool.query(
          `
          SELECT
            COUNT(*) FILTER (WHERE j.status = 'completed')::int AS completed_jobs,
            COUNT(*)::int AS total_jobs
          FROM job_assignments ja
          INNER JOIN jobs j ON j.id = ja.job_id
          WHERE ja.user_id = $1
          `,
          [userId]
        ),

        pool.query(
          `
          SELECT
            COALESCE(SUM(i.total) FILTER (
              WHERE DATE_TRUNC('day', i.created_at) = DATE_TRUNC('day', NOW())
            ), 0)::numeric AS daily_total,

            COALESCE(SUM(i.total) FILTER (
              WHERE DATE_TRUNC('week', i.created_at) = DATE_TRUNC('week', NOW())
            ), 0)::numeric AS weekly_total,

            COALESCE(SUM(i.total) FILTER (
              WHERE DATE_TRUNC('month', i.created_at) = DATE_TRUNC('month', NOW())
            ), 0)::numeric AS monthly_total,

            COALESCE(SUM(i.total) FILTER (
              WHERE DATE_TRUNC('year', i.created_at) = DATE_TRUNC('year', NOW())
            ), 0)::numeric AS yearly_total,

            COALESCE(SUM(i.total), 0)::numeric AS lifetime_total
          FROM invoices i
          WHERE i.assigned_user_id = $1
          `,
          [userId]
        ),

        pool.query(
          `
          SELECT
            COALESCE(SUM(paid_minutes) / 60, 0)::numeric AS lifetime_hours,
            COALESCE(SUM(paid_minutes) FILTER (
              WHERE DATE_TRUNC('day', clock_in_at) = DATE_TRUNC('day', NOW())
            ) / 60, 0)::numeric AS daily_hours,
            COALESCE(SUM(paid_minutes) FILTER (
              WHERE DATE_TRUNC('week', clock_in_at) = DATE_TRUNC('week', NOW())
            ) / 60, 0)::numeric AS weekly_hours,
            COALESCE(SUM(paid_minutes) FILTER (
              WHERE DATE_TRUNC('month', clock_in_at) = DATE_TRUNC('month', NOW())
            ) / 60, 0)::numeric AS monthly_hours,
            COALESCE(SUM(paid_minutes) FILTER (
              WHERE DATE_TRUNC('year', clock_in_at) = DATE_TRUNC('year', NOW())
            ) / 60, 0)::numeric AS yearly_hours
          FROM employee_time_sessions
          WHERE user_id = $1
            AND status = 'closed'
          `,
          [userId]
        ),

        pool.query(
          `
          SELECT
            COALESCE(SUM(amount), 0)::numeric AS total_pay,
            COUNT(*)::int AS pay_runs
          FROM pay_run_items
          WHERE user_id = $1
          `,
          [userId]
        ),

        pool.query(
          `
          SELECT pay_rate
          FROM users
          WHERE id = $1
          LIMIT 1
          `,
          [userId]
        )
      ]);

    const payRate = Number(payRateStats.rows[0]?.pay_rate || 30);
    const dailyHours = Number(hoursStats.rows[0].daily_hours || 0);
    const weeklyHours = Number(hoursStats.rows[0].weekly_hours || 0);
    const monthlyHours = Number(hoursStats.rows[0].monthly_hours || 0);
    const yearlyHours = Number(hoursStats.rows[0].yearly_hours || 0);
    const lifetimeHours = Number(hoursStats.rows[0].lifetime_hours || 0);

    return res.json({
      dashboard: {
        jobsCompleted: jobStats.rows[0].completed_jobs,
        totalAssignedJobs: jobStats.rows[0].total_jobs,

        dailyRevenue: Number(revenueStats.rows[0].daily_total),
        weeklyRevenue: Number(revenueStats.rows[0].weekly_total),
        monthlyRevenue: Number(revenueStats.rows[0].monthly_total),
        yearlyRevenue: Number(revenueStats.rows[0].yearly_total),
        lifetimeRevenue: Number(revenueStats.rows[0].lifetime_total),

        payRate,

        dailyHours,
        weeklyHours,
        monthlyHours,
        yearlyHours,
        lifetimeHours,

        dailyWages: dailyHours * payRate,
        weeklyWages: weeklyHours * payRate,
        monthlyWages: monthlyHours * payRate,
        yearlyWages: yearlyHours * payRate,
        lifetimeWages: lifetimeHours * payRate,

        totalPayrollPaid: Number(payrollStats.rows[0].total_pay),
        payRunsCompleted: payrollStats.rows[0].pay_runs
      }
    });
  } catch (error) {
    console.error("employee dashboard error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;

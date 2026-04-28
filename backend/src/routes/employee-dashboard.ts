import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/me", requireAuth, requireRole("employee"), async (req, res) => {
  try {
    const userId = req.user!.id;

    const [
      jobStats,
      revenueStats,
      hoursStats,
      payrollStats
    ] = await Promise.all([

      pool.query(
        `
        SELECT
          COUNT(*) FILTER (WHERE status = 'completed')::int AS completed_jobs,
          COUNT(*)::int AS total_jobs
        FROM job_assignments ja
        INNER JOIN jobs j
          ON j.id = ja.job_id
        WHERE ja.user_id = $1
        `,
        [userId]
      ),

      pool.query(
        `
        SELECT
          COALESCE(
            SUM(i.total)
            FILTER (
              WHERE DATE_TRUNC('day', i.created_at) = DATE_TRUNC('day', NOW())
            ),
            0
          )::numeric AS daily_total,

          COALESCE(
            SUM(i.total)
            FILTER (
              WHERE DATE_TRUNC('week', i.created_at) = DATE_TRUNC('week', NOW())
            ),
            0
          )::numeric AS weekly_total,

          COALESCE(
            SUM(i.total)
            FILTER (
              WHERE DATE_TRUNC('month', i.created_at) = DATE_TRUNC('month', NOW())
            ),
            0
          )::numeric AS monthly_total,

          COALESCE(
            SUM(i.total)
            FILTER (
              WHERE DATE_TRUNC('year', i.created_at) = DATE_TRUNC('year', NOW())
            ),
            0
          )::numeric AS yearly_total,

          COALESCE(
            SUM(i.total),
            0
          )::numeric AS lifetime_total

        FROM invoices i
        WHERE i.assigned_user_id = $1
        `,
        [userId]
      ),

      pool.query(
        `
        SELECT
          COALESCE(SUM(hours_worked),0)::numeric AS total_hours
        FROM employee_time_logs
        WHERE user_id = $1
        `,
        [userId]
      ),

      pool.query(
        `
        SELECT
          COALESCE(SUM(amount),0)::numeric AS total_pay,
          COUNT(*)::int AS pay_runs
        FROM pay_run_items
        WHERE user_id = $1
        `,
        [userId]
      )
    ]);

    return res.json({
      dashboard: {
        jobsCompleted: jobStats.rows[0].completed_jobs,
        totalAssignedJobs: jobStats.rows[0].total_jobs,

        dailyRevenue: Number(revenueStats.rows[0].daily_total),
        weeklyRevenue: Number(revenueStats.rows[0].weekly_total),
        monthlyRevenue: Number(revenueStats.rows[0].monthly_total),
        yearlyRevenue: Number(revenueStats.rows[0].yearly_total),
        lifetimeRevenue: Number(revenueStats.rows[0].lifetime_total),

        totalHoursWorked: Number(hoursStats.rows[0].total_hours),

        totalPayrollPaid: Number(payrollStats.rows[0].total_pay),
        payRunsCompleted: payrollStats.rows[0].pay_runs
      }
    });

  } catch (error) {
    console.error("employee dashboard error", error);
    return res.status(500).json({
      error: "Server error"
    });
  }
});

export default router;

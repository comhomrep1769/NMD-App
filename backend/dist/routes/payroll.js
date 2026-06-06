import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
const router = Router();
function mapPayRun(row) {
    return {
        id: row.id,
        periodStart: row.period_start,
        periodEnd: row.period_end,
        status: row.status,
        notes: row.notes,
        approvedAt: row.approved_at,
        paidAt: row.paid_at,
        createdBy: row.created_by,
        createdAt: row.created_at,
        items: row.items || []
    };
}
/*
====================================================
GET ALL PAY RUNS
====================================================
*/
router.get("/runs", requireAuth, requireRole("admin"), async (_req, res) => {
    try {
        const result = await pool.query(`
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
        LEFT JOIN pay_run_items pri
          ON pri.pay_run_id = pr.id
        LEFT JOIN users u
          ON u.id = pri.user_id

        GROUP BY pr.id
        ORDER BY pr.created_at DESC
      `);
        return res.json({
            payRuns: result.rows.map(mapPayRun)
        });
    }
    catch (error) {
        console.error("pay runs error", error);
        return res.status(500).json({
            error: "Server error"
        });
    }
});
/*
====================================================
LIVE PAYROLL PREVIEW
Pulls REAL paid hours from time clock
====================================================
*/
router.get("/preview", requireAuth, requireRole("admin"), async (req, res) => {
    try {
        const { periodStart, periodEnd } = req.query;
        if (!periodStart || !periodEnd) {
            return res.status(400).json({
                error: "periodStart and periodEnd are required"
            });
        }
        const result = await pool.query(`
        SELECT
          u.id,
          u.display_name,
          u.email,
          u.pay_rate,

          COALESCE(
            SUM(s.paid_minutes),
            0
          )::numeric AS total_paid_minutes,

          COALESCE(
            SUM(s.paid_minutes) / 60,
            0
          )::numeric AS total_paid_hours,

          COALESCE(
            (SUM(s.paid_minutes) / 60) * u.pay_rate,
            0
          )::numeric AS wage_total

        FROM users u

        LEFT JOIN employee_time_sessions s
          ON s.user_id = u.id
          AND s.status = 'closed'
          AND s.work_date >= $1::date
          AND s.work_date <= $2::date

        WHERE u.role = 'employee'

        GROUP BY
          u.id,
          u.display_name,
          u.email,
          u.pay_rate

        ORDER BY u.display_name ASC
        `, [periodStart, periodEnd]);
        return res.json({
            preview: result.rows.map((row) => ({
                userId: row.id,
                displayName: row.display_name,
                email: row.email,
                payRate: Number(row.pay_rate),
                paidMinutes: Number(row.total_paid_minutes),
                paidHours: Number(row.total_paid_hours),
                wageTotal: Number(row.wage_total)
            }))
        });
    }
    catch (error) {
        console.error("payroll preview error", error);
        return res.status(500).json({
            error: "Server error"
        });
    }
});
/*
====================================================
CREATE PAY RUN
Creates actual payroll record from preview
====================================================
*/
router.post("/create", requireAuth, requireRole("admin"), async (req, res) => {
    const client = await pool.connect();
    try {
        const { periodStart, periodEnd, notes } = req.body;
        if (!periodStart || !periodEnd) {
            return res.status(400).json({
                error: "Missing payroll period"
            });
        }
        await client.query("BEGIN");
        const payRunResult = await client.query(`
        INSERT INTO pay_runs (
          period_start,
          period_end,
          status,
          notes,
          created_by
        )
        VALUES ($1,$2,'draft',$3,$4)
        RETURNING *
        `, [
            periodStart,
            periodEnd,
            notes || null,
            req.user.id
        ]);
        const payRun = payRunResult.rows[0];
        const previewResult = await client.query(`
        SELECT
          u.id,
          u.pay_rate,

          COALESCE(
            SUM(s.paid_minutes) / 60,
            0
          )::numeric AS paid_hours,

          COALESCE(
            (SUM(s.paid_minutes) / 60) * u.pay_rate,
            0
          )::numeric AS wage_total

        FROM users u
        LEFT JOIN employee_time_sessions s
          ON s.user_id = u.id
          AND s.status = 'closed'
          AND s.work_date >= $1::date
          AND s.work_date <= $2::date

        WHERE u.role = 'employee'

        GROUP BY u.id, u.pay_rate
        `, [periodStart, periodEnd]);
        for (const employee of previewResult.rows) {
            if (Number(employee.wage_total) <= 0)
                continue;
            await client.query(`
          INSERT INTO pay_run_items (
            pay_run_id,
            user_id,
            amount,
            notes
          )
          VALUES ($1,$2,$3,$4)
          `, [
                payRun.id,
                employee.id,
                Number(employee.wage_total),
                "Generated from live time clock hours"
            ]);
        }
        await client.query("COMMIT");
        return res.status(201).json({
            message: "Payroll created successfully",
            payRunId: payRun.id
        });
    }
    catch (error) {
        await client.query("ROLLBACK");
        console.error("create payroll error", error);
        return res.status(500).json({
            error: "Server error"
        });
    }
    finally {
        client.release();
    }
});
/*
====================================================
APPROVE PAY RUN
====================================================
*/
router.post("/:id/approve", requireAuth, requireRole("admin"), async (req, res) => {
    try {
        const result = await pool.query(`
        UPDATE pay_runs
        SET
          status = 'approved',
          approved_at = NOW()
        WHERE id = $1
        RETURNING *
        `, [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Pay run not found"
            });
        }
        return res.json({
            payRun: mapPayRun(result.rows[0])
        });
    }
    catch (error) {
        console.error("approve payroll error", error);
        return res.status(500).json({
            error: "Server error"
        });
    }
});
/*
====================================================
MARK AS PAID
====================================================
*/
router.post("/:id/mark-paid", requireAuth, requireRole("admin"), async (req, res) => {
    try {
        const result = await pool.query(`
        UPDATE pay_runs
        SET
          status = 'paid_in_roll',
          paid_at = NOW()
        WHERE id = $1
        RETURNING *
        `, [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Pay run not found"
            });
        }
        return res.json({
            payRun: mapPayRun(result.rows[0])
        });
    }
    catch (error) {
        console.error("mark paid error", error);
        return res.status(500).json({
            error: "Server error"
        });
    }
});
export default router;

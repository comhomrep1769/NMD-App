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
        COALESCE(SUM(i.total), 0) AS amount
      FROM users u
      LEFT JOIN invoices i ON i.assigned_user_id = u.id
        AND i.status = 'paid'
        AND i.created_at::date >= $1::date
        AND i.created_at::date <= $2::date
      WHERE u.role = 'employee'
      GROUP BY u.id, u.display_name, u.email
      ORDER BY u.display_name ASC
      `,
      [periodStart, periodEnd]
    );

    return res.json({
      items: result.rows.map((row) => ({
        userId: row.user_id,
        displayName: row.display_name,
        email: row.email,
        amount: Number(row.amount),
        notes: ""
      }))
    });
  } catch (error) {
    console.error("payroll preview error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/runs", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { periodStart, periodEnd, notes, items } = req.body as {
      periodStart?: string;
      periodEnd?: string;
      notes?: string;
      items?: Array<{
        userId: string;
        amount: number;
        notes?: string;
      }>;
    };

    if (!periodStart || !periodEnd) {
      return res.status(400).json({ error: "Period start and end are required" });
    }

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: "Pay run items are required" });
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const runResult = await client.query(
        `
        INSERT INTO pay_runs (period_start, period_end, notes, created_by)
        VALUES ($1, $2, $3, $4)
        RETURNING *
        `,
        [periodStart, periodEnd, notes || null, req.user!.id]
      );

      const payRun = runResult.rows[0];

      for (const item of items) {
        await client.query(
          `
          INSERT INTO pay_run_items (pay_run_id, user_id, amount, notes)
          VALUES ($1, $2, $3, $4)
          `,
          [payRun.id, item.userId, item.amount || 0, item.notes || null]
        );
      }

      await client.query("COMMIT");

      return res.status(201).json({ payRun });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("payroll create error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.patch("/runs/:payRunId/status", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { payRunId } = req.params;
    const { status } = req.body as {
      status?: "draft" | "approved" | "paid_in_roll";
    };

    if (!status || !["draft", "approved", "paid_in_roll"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const result = await pool.query(
      `
      UPDATE pay_runs
      SET
        status = $2,
        approved_at = CASE WHEN $2 = 'approved' THEN NOW() ELSE approved_at END,
        paid_at = CASE WHEN $2 = 'paid_in_roll' THEN NOW() ELSE paid_at END
      WHERE id = $1
      RETURNING *
      `,
      [payRunId, status]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Pay run not found" });
    }

    return res.json({ payRun: result.rows[0] });
  } catch (error) {
    console.error("payroll status update error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.delete("/runs/:payRunId", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { payRunId } = req.params;

    const result = await pool.query(
      `DELETE FROM pay_runs WHERE id = $1 RETURNING id`,
      [payRunId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Pay run not found" });
    }

    return res.json({ deleted: true });
  } catch (error) {
    console.error("payroll delete error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;

import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
const router = Router();
function mapSession(row) {
    return {
        id: row.id,
        userId: row.user_id,
        employeeName: row.employee_name,
        workDate: row.work_date,
        clockInAt: row.clock_in_at,
        clockOutAt: row.clock_out_at,
        status: row.status,
        totalMinutes: Number(row.total_minutes || 0),
        breakMinutes: Number(row.break_minutes || 0),
        penaltyMinutes: Number(row.penalty_minutes || 0),
        paidMinutes: Number(row.paid_minutes || 0),
        adminNotes: row.admin_notes,
        createdAt: row.created_at
    };
}
function mapBreak(row) {
    return {
        id: row.id,
        sessionId: row.session_id,
        userId: row.user_id,
        breakType: row.break_type,
        allowedMinutes: Number(row.allowed_minutes || 0),
        startedAt: row.started_at,
        endedAt: row.ended_at,
        overtimePenaltyMinutes: Number(row.overtime_penalty_minutes || 0),
        status: row.status,
        createdAt: row.created_at
    };
}
router.get("/me", requireAuth, async (req, res) => {
    try {
        const sessionResult = await pool.query(`
      SELECT
        s.*,
        u.display_name AS employee_name
      FROM employee_time_sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.user_id = $1
        AND s.status = 'open'
      ORDER BY s.clock_in_at DESC
      LIMIT 1
      `, [req.user.id]);
        const session = sessionResult.rows[0];
        if (!session) {
            return res.json({
                activeSession: null,
                breaks: []
            });
        }
        const breaksResult = await pool.query(`
      SELECT *
      FROM employee_break_logs
      WHERE session_id = $1
      ORDER BY started_at ASC
      `, [session.id]);
        return res.json({
            activeSession: mapSession(session),
            breaks: breaksResult.rows.map(mapBreak)
        });
    }
    catch (error) {
        console.error("timeclock me error", error);
        return res.status(500).json({ error: "Server error" });
    }
});
router.get("/my-history", requireAuth, async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT
        s.*,
        u.display_name AS employee_name
      FROM employee_time_sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.user_id = $1
      ORDER BY s.clock_in_at DESC
      LIMIT 60
      `, [req.user.id]);
        return res.json({
            sessions: result.rows.map(mapSession)
        });
    }
    catch (error) {
        console.error("timeclock my history error", error);
        return res.status(500).json({ error: "Server error" });
    }
});
router.get("/admin/sessions", requireAuth, requireRole("admin"), async (_req, res) => {
    try {
        const result = await pool.query(`
      SELECT
        s.*,
        u.display_name AS employee_name
      FROM employee_time_sessions s
      JOIN users u ON u.id = s.user_id
      ORDER BY s.clock_in_at DESC
      LIMIT 200
      `);
        return res.json({
            sessions: result.rows.map(mapSession)
        });
    }
    catch (error) {
        console.error("timeclock admin sessions error", error);
        return res.status(500).json({ error: "Server error" });
    }
});
router.post("/clock-in", requireAuth, async (req, res) => {
    try {
        const openCheck = await pool.query(`
      SELECT id
      FROM employee_time_sessions
      WHERE user_id = $1
        AND status = 'open'
      LIMIT 1
      `, [req.user.id]);
        if (openCheck.rows.length > 0) {
            return res.status(400).json({ error: "You are already clocked in." });
        }
        const result = await pool.query(`
      INSERT INTO employee_time_sessions (user_id)
      VALUES ($1)
      RETURNING *
      `, [req.user.id]);
        return res.status(201).json({
            session: mapSession(result.rows[0])
        });
    }
    catch (error) {
        console.error("clock in error", error);
        return res.status(500).json({ error: "Server error" });
    }
});
router.post("/clock-out", requireAuth, async (req, res) => {
    try {
        const sessionResult = await pool.query(`
      SELECT *
      FROM employee_time_sessions
      WHERE user_id = $1
        AND status = 'open'
      ORDER BY clock_in_at DESC
      LIMIT 1
      `, [req.user.id]);
        if (sessionResult.rows.length === 0) {
            return res.status(400).json({ error: "You are not clocked in." });
        }
        const session = sessionResult.rows[0];
        const activeBreak = await pool.query(`
      SELECT *
      FROM employee_break_logs
      WHERE session_id = $1
        AND status = 'active'
      LIMIT 1
      `, [session.id]);
        if (activeBreak.rows.length > 0) {
            return res.status(400).json({
                error: "End your active break before clocking out."
            });
        }
        const summaryResult = await pool.query(`
      SELECT
        COALESCE(SUM(EXTRACT(EPOCH FROM (ended_at - started_at)) / 60), 0) AS break_minutes,
        COALESCE(SUM(overtime_penalty_minutes), 0) AS penalty_minutes
      FROM employee_break_logs
      WHERE session_id = $1
        AND status = 'completed'
      `, [session.id]);
        const breakMinutes = Number(summaryResult.rows[0].break_minutes || 0);
        const penaltyMinutes = Number(summaryResult.rows[0].penalty_minutes || 0);
        const updateResult = await pool.query(`
      UPDATE employee_time_sessions
      SET
        clock_out_at = NOW(),
        status = 'closed',
        total_minutes = EXTRACT(EPOCH FROM (NOW() - clock_in_at)) / 60,
        break_minutes = $2,
        penalty_minutes = $3,
        paid_minutes = GREATEST(
          (EXTRACT(EPOCH FROM (NOW() - clock_in_at)) / 60) - $3,
          0
        )
      WHERE id = $1
      RETURNING *
      `, [session.id, breakMinutes, penaltyMinutes]);
        return res.json({
            session: mapSession(updateResult.rows[0])
        });
    }
    catch (error) {
        console.error("clock out error", error);
        return res.status(500).json({ error: "Server error" });
    }
});
router.post("/break/start", requireAuth, async (req, res) => {
    try {
        const { breakType } = req.body;
        const breakMap = {
            break_15_1: 15,
            break_15_2: 15,
            lunch_30: 30,
            break_60: 60
        };
        if (!breakType || !(breakType in breakMap)) {
            return res.status(400).json({ error: "Invalid break type." });
        }
        const sessionResult = await pool.query(`
      SELECT *
      FROM employee_time_sessions
      WHERE user_id = $1
        AND status = 'open'
      ORDER BY clock_in_at DESC
      LIMIT 1
      `, [req.user.id]);
        if (sessionResult.rows.length === 0) {
            return res.status(400).json({ error: "Clock in before starting a break." });
        }
        const session = sessionResult.rows[0];
        const activeBreak = await pool.query(`
      SELECT id
      FROM employee_break_logs
      WHERE session_id = $1
        AND status = 'active'
      LIMIT 1
      `, [session.id]);
        if (activeBreak.rows.length > 0) {
            return res.status(400).json({ error: "You already have an active break." });
        }
        const usedBreaks = await pool.query(`
      SELECT break_type
      FROM employee_break_logs
      WHERE session_id = $1
      `, [session.id]);
        const usedTypes = usedBreaks.rows.map((row) => row.break_type);
        if (usedTypes.includes("break_60")) {
            return res.status(400).json({
                error: "You already used the 1-hour break. No more breaks are available."
            });
        }
        if (breakType === "break_60" && usedTypes.length > 0) {
            return res.status(400).json({
                error: "The 1-hour break can only be used before other breaks."
            });
        }
        if (usedTypes.includes(breakType)) {
            return res.status(400).json({
                error: "This break option has already been used."
            });
        }
        const result = await pool.query(`
      INSERT INTO employee_break_logs
        (session_id, user_id, break_type, allowed_minutes)
      VALUES
        ($1, $2, $3, $4)
      RETURNING *
      `, [session.id, req.user.id, breakType, breakMap[breakType]]);
        return res.status(201).json({
            breakLog: mapBreak(result.rows[0])
        });
    }
    catch (error) {
        console.error("break start error", error);
        return res.status(500).json({ error: "Server error" });
    }
});
router.post("/break/end", requireAuth, async (req, res) => {
    try {
        const sessionResult = await pool.query(`
      SELECT *
      FROM employee_time_sessions
      WHERE user_id = $1
        AND status = 'open'
      ORDER BY clock_in_at DESC
      LIMIT 1
      `, [req.user.id]);
        if (sessionResult.rows.length === 0) {
            return res.status(400).json({ error: "You are not clocked in." });
        }
        const session = sessionResult.rows[0];
        const activeBreakResult = await pool.query(`
      SELECT *
      FROM employee_break_logs
      WHERE session_id = $1
        AND status = 'active'
      ORDER BY started_at DESC
      LIMIT 1
      `, [session.id]);
        if (activeBreakResult.rows.length === 0) {
            return res.status(400).json({ error: "No active break found." });
        }
        const activeBreak = activeBreakResult.rows[0];
        const updateResult = await pool.query(`
      UPDATE employee_break_logs
      SET
        ended_at = NOW(),
        status = 'completed',
        overtime_penalty_minutes = GREATEST(
          (EXTRACT(EPOCH FROM (NOW() - started_at)) / 60) - allowed_minutes - 1,
          0
        )
      WHERE id = $1
      RETURNING *
      `, [activeBreak.id]);
        const summaryResult = await pool.query(`
      SELECT
        COALESCE(SUM(EXTRACT(EPOCH FROM (COALESCE(ended_at, NOW()) - started_at)) / 60), 0) AS break_minutes,
        COALESCE(SUM(overtime_penalty_minutes), 0) AS penalty_minutes
      FROM employee_break_logs
      WHERE session_id = $1
      `, [session.id]);
        await pool.query(`
      UPDATE employee_time_sessions
      SET
        break_minutes = $2,
        penalty_minutes = $3,
        total_minutes = EXTRACT(EPOCH FROM (NOW() - clock_in_at)) / 60,
        paid_minutes = GREATEST(
          (EXTRACT(EPOCH FROM (NOW() - clock_in_at)) / 60) - $3,
          0
        )
      WHERE id = $1
      `, [
            session.id,
            Number(summaryResult.rows[0].break_minutes || 0),
            Number(summaryResult.rows[0].penalty_minutes || 0)
        ]);
        return res.json({
            breakLog: mapBreak(updateResult.rows[0])
        });
    }
    catch (error) {
        console.error("break end error", error);
        return res.status(500).json({ error: "Server error" });
    }
});
export default router;

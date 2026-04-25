import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const isAdmin = req.user!.role === "admin";

    const result = isAdmin
      ? await pool.query(
          `
          SELECT
            a.id,
            a.user_id,
            u.display_name,
            a.start_time,
            a.end_time,
            a.reason,
            a.created_at
          FROM availability a
          JOIN users u ON u.id = a.user_id
          ORDER BY a.start_time ASC
          `
        )
      : await pool.query(
          `
          SELECT
            id,
            user_id,
            start_time,
            end_time,
            reason,
            created_at
          FROM availability
          WHERE user_id = $1
          ORDER BY start_time ASC
          `,
          [req.user!.id]
        );

    return res.json({ availability: result.rows });
  } catch (error) {
    console.error("availability list error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const { startTime, endTime, reason } = req.body;

    if (!startTime || !endTime) {
      return res.status(400).json({ error: "Start and end time required" });
    }

    const result = await pool.query(
      `
      INSERT INTO availability (user_id, start_time, end_time, reason)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [req.user!.id, startTime, endTime, reason || null]
    );

    return res.status(201).json({ entry: result.rows[0] });
  } catch (error) {
    console.error("availability create error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM availability
      WHERE id = $1 AND user_id = $2
      RETURNING id
      `,
      [id, req.user!.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Entry not found" });
    }

    return res.json({ deleted: true });
  } catch (error) {
    console.error("availability delete error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;

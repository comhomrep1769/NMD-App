import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, async (_req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        id,
        title,
        content,
        category,
        pinned,
        created_by,
        created_at,
        updated_at
      FROM tips_notes
      ORDER BY pinned DESC, updated_at DESC
      `
    );

    return res.json({ tips: result.rows });
  } catch (error) {
    console.error("tips list error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { title, content, category, pinned } = req.body as {
      title?: string;
      content?: string;
      category?: string;
      pinned?: boolean;
    };

    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }

    const result = await pool.query(
      `
      INSERT INTO tips_notes (title, content, category, pinned, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [
        title.trim(),
        content.trim(),
        category?.trim() || "General",
        Boolean(pinned),
        req.user!.id
      ]
    );

    return res.status(201).json({ tip: result.rows[0] });
  } catch (error) {
    console.error("tip create error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.patch("/:tipId", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { tipId } = req.params;
    const { title, content, category, pinned } = req.body as {
      title?: string;
      content?: string;
      category?: string;
      pinned?: boolean;
    };

    const result = await pool.query(
      `
      UPDATE tips_notes
      SET
        title = COALESCE($2, title),
        content = COALESCE($3, content),
        category = COALESCE($4, category),
        pinned = COALESCE($5, pinned),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [
        tipId,
        title ?? null,
        content ?? null,
        category ?? null,
        typeof pinned === "boolean" ? pinned : null
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Tip not found" });
    }

    return res.json({ tip: result.rows[0] });
  } catch (error) {
    console.error("tip update error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:tipId", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { tipId } = req.params;

    const result = await pool.query(
      `DELETE FROM tips_notes WHERE id = $1 RETURNING id`,
      [tipId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Tip not found" });
    }

    return res.json({ deleted: true });
  } catch (error) {
    console.error("tip delete error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;

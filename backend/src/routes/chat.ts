import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/conversations", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        c.id,
        c.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', u.id,
              'displayName', u.display_name,
              'email', u.email,
              'role', u.role
            )
          ) FILTER (WHERE u.id IS NOT NULL),
          '[]'
        ) AS members,
        (
          SELECT m.body
          FROM messages m
          WHERE m.conversation_id = c.id
          ORDER BY m.created_at DESC
          LIMIT 1
        ) AS last_message,
        (
          SELECT m.created_at
          FROM messages m
          WHERE m.conversation_id = c.id
          ORDER BY m.created_at DESC
          LIMIT 1
        ) AS last_message_at
      FROM conversations c
      JOIN conversation_members mycm ON mycm.conversation_id = c.id
      LEFT JOIN conversation_members cm ON cm.conversation_id = c.id
      LEFT JOIN users u ON u.id = cm.user_id
      WHERE mycm.user_id = $1
      GROUP BY c.id
      ORDER BY COALESCE(
        (
          SELECT m.created_at
          FROM messages m
          WHERE m.conversation_id = c.id
          ORDER BY m.created_at DESC
          LIMIT 1
        ),
        c.created_at
      ) DESC
      `,
      [req.user!.id]
    );

    return res.json({ conversations: result.rows });
  } catch (error) {
    console.error("chat conversations error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/users", requireAuth, async (req, res) => {
  try {
    const isAdmin = req.user!.role === "admin";

    const result = isAdmin
      ? await pool.query(
          `
          SELECT id, email, display_name, role
          FROM users
          WHERE id <> $1
          ORDER BY role ASC, display_name ASC
          `,
          [req.user!.id]
        )
      : await pool.query(
          `
          SELECT id, email, display_name, role
          FROM users
          WHERE role = 'admin'
          ORDER BY display_name ASC
          `
        );

    return res.json({
      users: result.rows.map((row) => ({
        id: row.id,
        email: row.email,
        displayName: row.display_name,
        role: row.role
      }))
    });
  } catch (error) {
    console.error("chat users error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/conversations", requireAuth, async (req, res) => {
  try {
    const { targetUserId } = req.body as { targetUserId?: string };

    if (!targetUserId) {
      return res.status(400).json({ error: "targetUserId is required" });
    }

    if (targetUserId === req.user!.id) {
      return res.status(400).json({ error: "Cannot create chat with yourself" });
    }

    const targetCheck = await pool.query(
      `SELECT id FROM users WHERE id = $1 LIMIT 1`,
      [targetUserId]
    );

    if (targetCheck.rows.length === 0) {
      return res.status(404).json({ error: "Target user not found" });
    }

    const existing = await pool.query(
      `
      SELECT c.id
      FROM conversations c
      JOIN conversation_members cm1 ON cm1.conversation_id = c.id
      JOIN conversation_members cm2 ON cm2.conversation_id = c.id
      WHERE cm1.user_id = $1
        AND cm2.user_id = $2
      GROUP BY c.id
      HAVING COUNT(*) = 2
      LIMIT 1
      `,
      [req.user!.id, targetUserId]
    );

    if (existing.rows.length > 0) {
      return res.json({ conversationId: existing.rows[0].id });
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const conversation = await client.query(
        `INSERT INTO conversations DEFAULT VALUES RETURNING id`,
        []
      );

      const conversationId = conversation.rows[0].id;

      await client.query(
        `
        INSERT INTO conversation_members (conversation_id, user_id)
        VALUES ($1, $2), ($1, $3)
        `,
        [conversationId, req.user!.id, targetUserId]
      );

      await client.query("COMMIT");
      return res.status(201).json({ conversationId });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("chat create conversation error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/conversations/:conversationId/messages", requireAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;

    const memberCheck = await pool.query(
      `
      SELECT 1
      FROM conversation_members
      WHERE conversation_id = $1 AND user_id = $2
      LIMIT 1
      `,
      [conversationId, req.user!.id]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: "Not a member of this conversation" });
    }

    const result = await pool.query(
      `
      SELECT
        m.id,
        m.conversation_id,
        m.sender_id,
        m.body,
        m.created_at,
        u.display_name AS sender_display_name,
        u.email AS sender_email,
        u.role AS sender_role
      FROM messages m
      JOIN users u ON u.id = m.sender_id
      WHERE m.conversation_id = $1
      ORDER BY m.created_at ASC
      `,
      [conversationId]
    );

    return res.json({ messages: result.rows });
  } catch (error) {
    console.error("chat messages error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/conversations/:conversationId/messages", requireAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { body } = req.body as { body?: string };

    if (!body || !body.trim()) {
      return res.status(400).json({ error: "Message body is required" });
    }

    const memberCheck = await pool.query(
      `
      SELECT 1
      FROM conversation_members
      WHERE conversation_id = $1 AND user_id = $2
      LIMIT 1
      `,
      [conversationId, req.user!.id]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: "Not a member of this conversation" });
    }

    const result = await pool.query(
      `
      INSERT INTO messages (conversation_id, sender_id, body)
      VALUES ($1, $2, $3)
      RETURNING id, conversation_id, sender_id, body, created_at
      `,
      [conversationId, req.user!.id, body.trim()]
    );

    return res.status(201).json({ message: result.rows[0] });
  } catch (error) {
    console.error("chat send message error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;

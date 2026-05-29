import { Router } from "express";
import { pool } from "../db.js";
import bcrypt from "bcryptjs";

const router = Router();

router.post("/set-password", async (req, res) => {
  try {
    const { token, password } = req.body as { token?: string; password?: string };

    if (!token || !password || password.length < 8) {
      return res.status(400).json({ error: "Valid token and password (min 8 chars) are required." });
    }

    const tokenResult = await pool.query(
      `SELECT * FROM password_reset_tokens WHERE token = $1 AND used_at IS NULL AND expires_at > NOW() LIMIT 1`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ error: "This link is invalid or has expired. Please contact NMD to request a new one." });
    }

    const tokenRow = tokenResult.rows[0];
    const hashed = await bcrypt.hash(password, 12);

    await pool.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [hashed, tokenRow.user_id]);
    await pool.query(`UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1`, [tokenRow.id]);

    return res.json({ ok: true });
  } catch (error) {
    console.error("set-password error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;

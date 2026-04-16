import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, requireRole("admin"), async (_req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT id, email, display_name, role, created_at
      FROM users
      WHERE role = 'employee'
      ORDER BY display_name ASC
      `
    );

    return res.json({
      employees: result.rows.map((row) => ({
        id: row.id,
        email: row.email,
        displayName: row.display_name,
        role: row.role,
        createdAt: row.created_at
      }))
    });
  } catch (error) {
    console.error("employees list error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;

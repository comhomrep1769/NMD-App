import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const { email, password, displayName, role } = req.body as {
      email?: string;
      password?: string;
      displayName?: string;
      role?: "admin" | "employee";
    };

    if (!email || !password || !displayName || !role) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!["admin", "employee"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1 LIMIT 1",
      [email.toLowerCase()]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `
      INSERT INTO users (email, password_hash, display_name, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, display_name, role, created_at
      `,
      [email.toLowerCase(), passwordHash, displayName, role]
    );

    return res.status(201).json({ user: result.rows[0] });
  } catch (error) {
    console.error("register error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const result = await pool.query(
      `
      SELECT id, email, password_hash, display_name, role
      FROM users
      WHERE email = $1
      LIMIT 1
      `,
      [email.toLowerCase()]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        role: user.role
      }
    });
  } catch (error) {
    console.error("login error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT id, email, display_name, role, created_at
      FROM users
      WHERE id = $1
      LIMIT 1
      `,
      [req.user!.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({
      user: {
        id: result.rows[0].id,
        email: result.rows[0].email,
        displayName: result.rows[0].display_name,
        role: result.rows[0].role,
        createdAt: result.rows[0].created_at
      }
    });
  } catch (error) {
    console.error("me error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;

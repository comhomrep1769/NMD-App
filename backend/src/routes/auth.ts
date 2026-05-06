import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

function signToken(user: {
  id: string;
  email: string;
  display_name: string;
  role: "admin" | "employee" | "client";
}) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function mapUser(user: any) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    role: user.role
  };
}

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
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
      `,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid login" });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({ error: "Invalid login" });
    }

    const token = signToken(user);

    return res.json({
      token,
      user: mapUser(user)
    });
  } catch (error) {
    console.error("login error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/client-register", async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      password
    } = req.body as {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      address?: string;
      password?: string;
    };

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        error: "First name, last name, email, and password are required"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters"
      });
    }

    await client.query("BEGIN");

    const existingUser = await client.query(
      `
      SELECT id
      FROM users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
      `,
      [email]
    );

    if (existingUser.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        error: "An account with this email already exists"
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const displayName = `${firstName.trim()} ${lastName.trim()}`;

    const userResult = await client.query(
      `
      INSERT INTO users (email, password_hash, display_name, role)
      VALUES ($1, $2, $3, 'client')
      RETURNING id, email, display_name, role
      `,
      [email.trim().toLowerCase(), passwordHash, displayName]
    );

    const user = userResult.rows[0];

    const existingClient = await client.query(
      `
      SELECT id
      FROM clients
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
      `,
      [email]
    );

    if (existingClient.rows.length > 0) {
      await client.query(
        `
        UPDATE clients
        SET
          user_id = $2,
          first_name = COALESCE(NULLIF($3, ''), first_name),
          last_name = COALESCE(NULLIF($4, ''), last_name),
          phone = COALESCE(NULLIF($5, ''), phone),
          address = COALESCE(NULLIF($6, ''), address)
        WHERE id = $1
        `,
        [
          existingClient.rows[0].id,
          user.id,
          firstName.trim(),
          lastName.trim(),
          phone?.trim() || "",
          address?.trim() || ""
        ]
      );
    } else {
      await client.query(
        `
        INSERT INTO clients (user_id, first_name, last_name, phone, email, address)
        VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [
          user.id,
          firstName.trim(),
          lastName.trim(),
          phone?.trim() || "",
          email.trim().toLowerCase(),
          address?.trim() || ""
        ]
      );
    }

    await client.query("COMMIT");

    const token = signToken(user);

    return res.status(201).json({
      token,
      user: mapUser(user)
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("client register error", error);
    return res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT id, email, display_name, role
      FROM users
      WHERE id = $1
      LIMIT 1
      `,
      [req.user!.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "User not found" });
    }

    return res.json({
      user: mapUser(result.rows[0])
    });
  } catch (error) {
    console.error("me error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;

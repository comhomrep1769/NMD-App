import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Pool } from "pg";
import crypto from "crypto";
import rateLimit from "express-rate-limit";

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: "Too many login attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
})

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { message: "Too many account creation attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
})

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : undefined
});

type UserRole = "superadmin" | "admin" | "employee" | "client" | "sales";

type DbUser = {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
  role: UserRole;
  pay_rate: string | number | null;
  phone: string | null;
  address: string | null;
  date_joined: string | null;
  created_at: string;
  updated_at: string;
  must_change_password: boolean;
};

type SeedUserResponse = {
  role: string;
  email: string;
  password: string;
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is missing from backend environment variables.");
  return secret;
}

function signToken(user: DbUser, rememberMe?: boolean) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    getJwtSecret(),
    { expiresIn: rememberMe ? "30d" : "12h" }
  );
}

function mapUser(user: DbUser) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    role: user.role,
    payRate: user.pay_rate === null || user.pay_rate === undefined ? null : Number(user.pay_rate),
    phone: user.phone,
    address: user.address,
    dateJoined: user.date_joined,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
    mustChangePassword: user.must_change_password ?? false,
  };
}

function getBearerToken(req: express.Request) {
  const header = req.headers.authorization || "";
  if (header.toLowerCase().startsWith("bearer ")) return header.slice(7).trim();
  return "";
}

function normalizeRole(value: unknown): UserRole {
  if (value === "superadmin") return "superadmin";
  if (value === "admin") return "admin";
  if (value === "employee") return "employee";
  if (value === "sales") return "sales";
  return "client";
}

function getAllowedRolesForPortal(portalRole: string): UserRole[] {
  if (portalRole === "admin" || portalRole === "superadmin") return ["admin", "superadmin"];
  if (portalRole === "employee") return ["employee"];
  if (portalRole === "client") return ["client"];
  if (portalRole === "sales") return ["sales"];
  return ["superadmin", "admin", "employee", "client", "sales"];
}

async function ensureUsersTable() {
  await pool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'client',
      pay_rate NUMERIC NULL,
      phone TEXT NULL,
      address TEXT NULL,
      date_joined DATE NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT NULL;`);
  await pool.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;`);
  await pool.query(`
    ALTER TABLE users ADD CONSTRAINT users_role_check
    CHECK (role IN ('superadmin', 'admin', 'employee', 'client', 'sales'));
  `);
  await pool.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_client_pay_rate_check;`);
  await pool.query(`
    ALTER TABLE users ADD CONSTRAINT users_client_pay_rate_check
    CHECK (role <> 'client' OR pay_rate IS NULL);
  `);
}

async function findUserByEmail(email: string) {
  const result = await pool.query<DbUser>(
    `SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1;`,
    [email]
  );
  return result.rows[0] || null;
}

async function findUserById(id: string) {
  const result = await pool.query<DbUser>(
    `SELECT * FROM users WHERE id = $1 LIMIT 1;`,
    [id]
  );
  return result.rows[0] || null;
}

async function upsertTestUser(input: {
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
  payRate: number | null;
  phone: string | null;
  address?: string | null;
}) {
  const passwordHash = await bcrypt.hash(input.password, 12);
  const result = await pool.query<DbUser>(
    `
    INSERT INTO users (email, password_hash, display_name, role, pay_rate, phone, address, date_joined, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE, NOW())
    ON CONFLICT (email) DO UPDATE SET
      password_hash = EXCLUDED.password_hash,
      display_name = EXCLUDED.display_name,
      role = EXCLUDED.role,
      pay_rate = EXCLUDED.pay_rate,
      phone = EXCLUDED.phone,
      address = EXCLUDED.address,
      updated_at = NOW()
    RETURNING *;
    `,
    [input.email, passwordHash, input.displayName, input.role, input.payRate, input.phone, input.address || null]
  );
  return result.rows[0];
}

export async function createClientAccountAndToken(input: {
  email: string;
  displayName: string;
  phone?: string | null;
  address?: string | null;
}): Promise<{ userId: string; token: string; isNew: boolean }> {
  const existing = await findUserByEmail(input.email);
  let userId: string;
  let isNew = false;

  if (existing) {
    userId = existing.id;
  } else {
    const placeholder = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 12);
    const result = await pool.query<DbUser>(
      `
      INSERT INTO users (email, password_hash, display_name, role, pay_rate, phone, address, updated_at)
      VALUES ($1, $2, $3, 'client', NULL, $4, $5, NOW())
      RETURNING *;
      `,
      [input.email.trim().toLowerCase(), placeholder, input.displayName.trim(), input.phone || null, input.address || null]
    );
    userId = result.rows[0].id;
    isNew = true;
  }

  // ── Ensure a matching `clients` row exists, linked via user_id ──
  // Quotes, invoices, the admin client picker, and "My Quotes" all read from
  // `clients`, not `users` — without this, a self-registered client is invisible
  // to the entire quoting system even though their login works fine.
  try {
    const normalizedEmail = input.email.trim().toLowerCase();
    const nameParts = input.displayName.trim().split(/\s+/);
    const firstName = nameParts[0] || input.displayName.trim();
    const lastName = nameParts.slice(1).join(" ") || "";

    const existingClient = await pool.query(
      `SELECT id FROM clients WHERE user_id = $1 OR LOWER(email) = LOWER($2) LIMIT 1`,
      [userId, normalizedEmail]
    );

    if (existingClient.rows.length > 0) {
      await pool.query(
        `UPDATE clients SET
          user_id = $1,
          phone = COALESCE($2, phone),
          address = COALESCE($3, address)
        WHERE id = $4`,
        [userId, input.phone || null, input.address || null, existingClient.rows[0].id]
      );
    } else {
      await pool.query(
        `INSERT INTO clients (first_name, last_name, phone, email, address, user_id)
        VALUES ($1, $2, $3, $4, $5, $6)`,
        [firstName, lastName, input.phone || null, normalizedEmail, input.address || null, userId]
      );
    }
  } catch (clientSyncErr) {
    console.error("[createClientAccountAndToken] failed to sync clients table:", clientSyncErr);
  }

  const token = crypto.randomBytes(48).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await pool.query(
    `INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
    [userId, token, expiresAt]
  );

  return { userId, token, isNew };
}

router.post("/login", loginLimiter, async (req, res) => {
  try {
    await ensureUsersTable();
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    const rememberMe = Boolean(req.body?.rememberMe);
    const portalRole = String(req.body?.portalRole || "").trim().toLowerCase();

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    if (portalRole) {
      const allowedRoles = getAllowedRolesForPortal(portalRole);
      if (!allowedRoles.includes(user.role)) {
        const portalName =
          portalRole === "client" ? "client portal" :
          portalRole === "employee" ? "employee portal" :
          portalRole === "sales" ? "sales portal" :
          "admin portal";
        return res.status(403).json({
          message: `This account does not have access to the ${portalName}. Please use the correct login page.`
        });
      }
    }

    const token = signToken(user, rememberMe);
    return res.json({ token, user: mapUser(user) });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: err instanceof Error ? err.message : "Login failed." });
  }
});

router.get("/me", async (req, res) => {
  try {
    await ensureUsersTable();
    const token = getBearerToken(req);
    if (!token) return res.status(401).json({ message: "Missing authorization token." });

    const decoded = jwt.verify(token, getJwtSecret()) as { id?: string; email?: string; role?: UserRole };
    if (!decoded.id) return res.status(401).json({ message: "Invalid authorization token." });

    const user = await findUserById(decoded.id);
    if (!user) return res.status(401).json({ message: "User no longer exists." });

    return res.json({ user: mapUser(user) });
  } catch (err) {
    return res.status(401).json({ message: err instanceof Error ? err.message : "Unauthorized." });
  }
});

router.post("/register-client", registerLimiter, async (req, res) => {
  try {
    await ensureUsersTable();
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    const displayName = String(req.body?.displayName || req.body?.name || "").trim();
    const phone = String(req.body?.phone || "").trim() || null;
    const address = String(req.body?.address || "").trim() || null;

    if (!email || !password || !displayName) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }

    const existing = await findUserByEmail(email);
    if (existing) return res.status(409).json({ message: "An account with this email already exists." });

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await pool.query<DbUser>(
      `
      INSERT INTO users (email, password_hash, display_name, role, pay_rate, phone, address, updated_at)
      VALUES ($1, $2, $3, 'client', NULL, $4, $5, NOW())
      RETURNING *;
      `,
      [email, passwordHash, displayName, phone, address]
    );

    const user = result.rows[0];
    const token = signToken(user, true);
    return res.status(201).json({ token, user: mapUser(user) });
  } catch (err) {
    console.error("Client registration error:", err);
    return res.status(500).json({ message: err instanceof Error ? err.message : "Client registration failed." });
  }
});

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

    await pool.query(`UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`, [hashed, tokenRow.user_id]);
    await pool.query(`UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1`, [tokenRow.id]);

    return res.json({ ok: true });
  } catch (error) {
    console.error("set-password error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

// ── Change password (logged-in client/employee/admin updating their own password) ──
// Distinct from /set-password above, which is the one-time token-based flow used
// the first time a self-registered client sets a password from an emailed link.
router.post("/change-password", async (req, res) => {
  try {
    await ensureUsersTable();
    const token = getBearerToken(req);
    if (!token) return res.status(401).json({ error: "Missing authorization token." });

    let decoded: { id?: string };
    try {
      decoded = jwt.verify(token, getJwtSecret()) as { id?: string };
    } catch {
      return res.status(401).json({ error: "Invalid or expired session. Please log in again." });
    }
    if (!decoded.id) return res.status(401).json({ error: "Invalid authorization token." });

    const { currentPassword, newPassword } = req.body as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current password and new password are required." });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters." });
    }

    const user = await findUserById(decoded.id);
    if (!user) return res.status(401).json({ error: "User no longer exists." });

    const passwordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!passwordValid) {
      return res.status(401).json({ error: "Current password is incorrect." });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await pool.query(
      `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
      [newHash, user.id]
    );

    return res.json({ ok: true });
  } catch (err) {
    console.error("change-password error:", err);
    return res.status(500).json({ error: err instanceof Error ? err.message : "Failed to update password." });
  }
});


export default router;


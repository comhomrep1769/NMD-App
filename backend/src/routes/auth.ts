import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Pool } from "pg";

const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? {
          rejectUnauthorized: false
        }
      : undefined
});

type UserRole = "superadmin" | "admin" | "employee" | "client";

type DbUser = {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
  role: UserRole;
  pay_rate: string | number | null;
  phone: string | null;
  date_joined: string | null;
  created_at: string;
  updated_at: string;
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is missing from backend environment variables.");
  }

  return secret;
}

function signToken(user: DbUser, rememberMe?: boolean) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    getJwtSecret(),
    {
      expiresIn: rememberMe ? "30d" : "12h"
    }
  );
}

function mapUser(user: DbUser) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    role: user.role,
    payRate:
      user.pay_rate === null || user.pay_rate === undefined
        ? null
        : Number(user.pay_rate),
    phone: user.phone,
    dateJoined: user.date_joined,
    createdAt: user.created_at,
    updatedAt: user.updated_at
  };
}

function getBearerToken(req: express.Request) {
  const header = req.headers.authorization || "";

  if (header.toLowerCase().startsWith("bearer ")) {
    return header.slice(7).trim();
  }

  return "";
}

function normalizeRole(value: unknown): UserRole {
  if (value === "superadmin") return "superadmin";
  if (value === "admin") return "admin";
  if (value === "employee") return "employee";
  return "client";
}

async function ensureUsersTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'client',
      pay_rate NUMERIC NULL,
      phone TEXT NULL,
      date_joined DATE NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    ALTER TABLE users
    DROP CONSTRAINT IF EXISTS users_role_check;
  `);

  await pool.query(`
    ALTER TABLE users
    ADD CONSTRAINT users_role_check
    CHECK (role IN ('superadmin', 'admin', 'employee', 'client'));
  `);

  await pool.query(`
    ALTER TABLE users
    DROP CONSTRAINT IF EXISTS users_client_pay_rate_check;
  `);

  await pool.query(`
    ALTER TABLE users
    ADD CONSTRAINT users_client_pay_rate_check
    CHECK (
      role <> 'client'
      OR pay_rate IS NULL
    );
  `);
}

async function findUserByEmail(email: string) {
  const result = await pool.query<DbUser>(
    `
      SELECT *
      FROM users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1;
    `,
    [email]
  );

  return result.rows[0] || null;
}

async function findUserById(id: string) {
  const result = await pool.query<DbUser>(
    `
      SELECT *
      FROM users
      WHERE id = $1
      LIMIT 1;
    `,
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
}) {
  const passwordHash = await bcrypt.hash(input.password, 12);

  const result = await pool.query<DbUser>(
    `
      INSERT INTO users (
        email,
        password_hash,
        display_name,
        role,
        pay_rate,
        phone,
        date_joined,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE, NOW())
      ON CONFLICT (email)
      DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        display_name = EXCLUDED.display_name,
        role = EXCLUDED.role,
        pay_rate = EXCLUDED.pay_rate,
        phone = EXCLUDED.phone,
        updated_at = NOW()
      RETURNING *;
    `,
    [
      input.email,
      passwordHash,
      input.displayName,
      input.role,
      input.payRate,
      input.phone
    ]
  );

  return result.rows[0];
}

router.post("/login", async (req, res) => {
  try {
    await ensureUsersTable();

    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    const rememberMe = Boolean(req.body?.rememberMe);

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required."
      });
    }

    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password."
      });
    }

    const passwordValid = await bcrypt.compare(password, user.password_hash);

    if (!passwordValid) {
      return res.status(401).json({
        message: "Invalid email or password."
      });
    }

    const token = signToken(user, rememberMe);

    return res.json({
      token,
      user: mapUser(user)
    });
  } catch (err) {
    console.error("Login error:", err);

    return res.status(500).json({
      message: err instanceof Error ? err.message : "Login failed."
    });
  }
});

router.get("/me", async (req, res) => {
  try {
    await ensureUsersTable();

    const token = getBearerToken(req);

    if (!token) {
      return res.status(401).json({
        message: "Missing authorization token."
      });
    }

    const decoded = jwt.verify(token, getJwtSecret()) as {
      id?: string;
      email?: string;
      role?: UserRole;
    };

    if (!decoded.id) {
      return res.status(401).json({
        message: "Invalid authorization token."
      });
    }

    const user = await findUserById(decoded.id);

    if (!user) {
      return res.status(401).json({
        message: "User no longer exists."
      });
    }

    return res.json({
      user: mapUser(user)
    });
  } catch (err) {
    return res.status(401).json({
      message: err instanceof Error ? err.message : "Unauthorized."
    });
  }
});

router.post("/register-client", async (req, res) => {
  try {
    await ensureUsersTable();

    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    const displayName = String(req.body?.displayName || req.body?.name || "").trim();
    const phone = String(req.body?.phone || "").trim() || null;

    if (!email || !password || !displayName) {
      return res.status(400).json({
        message: "Name, email, and password are required."
      });
    }

    const existing = await findUserByEmail(email);

    if (existing) {
      return res.status(409).json({
        message: "An account with this email already exists."
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query<DbUser>(
      `
        INSERT INTO users (
          email,
          password_hash,
          display_name,
          role,
          pay_rate,
          phone,
          updated_at
        )
        VALUES ($1, $2, $3, 'client', NULL, $4, NOW())
        RETURNING *;
      `,
      [email, passwordHash, displayName, phone]
    );

    const user = result.rows[0];
    const token = signToken(user, true);

    return res.status(201).json({
      token,
      user: mapUser(user)
    });
  } catch (err) {
    console.error("Client registration error:", err);

    return res.status(500).json({
      message: err instanceof Error ? err.message : "Client registration failed."
    });
  }
});

router.post("/seed-test-users", async (req, res) => {
  try {
    await ensureUsersTable();

    const requiredSeedKey = process.env.TEST_SEED_KEY || "";
    const providedSeedKey =
      String(req.headers["x-test-seed-key"] || "") ||
      String(req.body?.seedKey || "");

    if (requiredSeedKey && providedSeedKey !== requiredSeedKey) {
      return res.status(403).json({
        message: "Invalid or missing TEST_SEED_KEY."
      });
    }

    const testUsers = [
      {
        role: "superadmin" as UserRole,
        label: "Super Admin",
        email: "testsuperadmin@nmd.local",
        password: "TestSuperAdmin123!",
        displayName: "Test Super Admin",
        payRate: 40,
        phone: "321-888-6586"
      },
      {
        role: "admin" as UserRole,
        label: "Admin",
        email: "testadmin@nmd.local",
        password: "TestAdmin123!",
        displayName: "Test Admin",
        payRate: 35,
        phone: "321-888-6586"
      },
      {
        role: "employee" as UserRole,
        label: "Employee",
        email: "testemployee@nmd.local",
        password: "TestEmployee123!",
        displayName: "Test Employee",
        payRate: 30,
        phone: "321-888-6586"
      },
      {
        role: "client" as UserRole,
        label: "Client",
        email: "testclient@nmd.local",
        password: "TestClient123!",
        displayName: "Test Client",
        payRate: null,
        phone: "321-888-6586"
      }
    ];

    const savedUsers = [];

    for (const testUser of testUsers) {
      await upsertTestUser({
        email: testUser.email,
        password: testUser.password,
        displayName: testUser.displayName,
        role: normalizeRole(testUser.role),
        payRate: testUser.payRate,
        phone: testUser.phone
      });

      savedUsers.push({
        role: testUser.label,
        email: testUser.email,
        password: testUser.password
      });
    }

    return res.json({
      message: "Test users created or refreshed successfully.",
      users: savedUsers
    });
  } catch (err) {
    console.error("Seed test users error:", err);

    return res.status(500).json({
      message: err instanceof Error ? err.message : "Failed to seed test users."
    });
  }
});

export default router;

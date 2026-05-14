import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const jwtSecret = process.env.JWT_SECRET || "dev-secret";

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
    jwtSecret,
    { expiresIn: "30d" }
  );
}

function mapUser(row: any) {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    role: row.role
  };
}

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required"
      });
    }

    const result = await pool.query(
      `
      SELECT id, email, password_hash, display_name, role
      FROM users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
      `,
      [email.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: "Invalid email or password"
      });
    }

    const user = result.rows[0];

    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({
        error: "Invalid email or password"
      });
    }

    const token = signToken(user);

    return res.json({
      token,
      user: mapUser(user)
    });
  } catch (error) {
    console.error("login error", error);
    return res.status(500).json({
      error: "Server error"
    });
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
      return res.status(401).json({
        error: "User not found"
      });
    }

    return res.json({
      user: mapUser(result.rows[0])
    });
  } catch (error) {
    console.error("me error", error);
    return res.status(500).json({
      error: "Server error"
    });
  }
});

router.post("/register-client", async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      firstName,
      lastName,
      phone,
      email,
      address,
      password
    } = req.body as {
      firstName?: string;
      lastName?: string;
      phone?: string;
      email?: string;
      address?: string;
      password?: string;
    };

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        error: "First name, last name, email, and password are required"
      });
    }

    await client.query("BEGIN");

    const existing = await client.query(
      `
      SELECT id
      FROM users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
      `,
      [email.trim()]
    );

    if (existing.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        error: "An account with this email already exists"
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const userResult = await client.query(
      `
      INSERT INTO users (
        email,
        password_hash,
        display_name,
        role,
        pay_rate
      )
      VALUES ($1, $2, $3, 'client', NULL)
      RETURNING id, email, display_name, role
      `,
      [
        email.trim().toLowerCase(),
        passwordHash,
        `${firstName.trim()} ${lastName.trim()}`
      ]
    );

    const user = userResult.rows[0];

    await client.query(
      `
      INSERT INTO clients (
        user_id,
        first_name,
        last_name,
        phone,
        email,
        address
      )
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

    await client.query("COMMIT");

    const token = signToken(user);

    return res.status(201).json({
      token,
      user: mapUser(user)
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("register client error", error);
    return res.status(500).json({
      error: "Server error"
    });
  } finally {
    client.release();
  }
});

/**
 * Temporary test account reset route.
 * Delete this route after your test accounts work.
 */
router.post("/seed-test-users", async (req, res) => {
  const seedKey = req.headers["x-seed-key"];

  if (!process.env.TEST_SEED_KEY || seedKey !== process.env.TEST_SEED_KEY) {
    return res.status(403).json({
      error: "Forbidden"
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const adminHash = await bcrypt.hash("TestAdmin123!", 12);
    const employeeHash = await bcrypt.hash("TestEmployee123!", 12);
    const clientHash = await bcrypt.hash("TestClient123!", 12);

    await client.query(
      `
      INSERT INTO users (
        email,
        password_hash,
        display_name,
        role,
        pay_rate
      )
      VALUES
        ($1, $2, 'Test Admin', 'admin', 40),
        ($3, $4, 'Test Employee', 'employee', 30),
        ($5, $6, 'Test Client', 'client', NULL)
      ON CONFLICT (email) DO UPDATE
      SET
        password_hash = EXCLUDED.password_hash,
        display_name = EXCLUDED.display_name,
        role = EXCLUDED.role,
        pay_rate = EXCLUDED.pay_rate
      `,
      [
        "testadmin@nmd.local",
        adminHash,
        "testemployee@nmd.local",
        employeeHash,
        "testclient@nmd.local",
        clientHash
      ]
    );

    const clientUser = await client.query(
      `
      SELECT id, email
      FROM users
      WHERE email = 'testclient@nmd.local'
      LIMIT 1
      `
    );

    const clientUserId = clientUser.rows[0]?.id;

    if (clientUserId) {
      await client.query(
        `
        INSERT INTO clients (
          user_id,
          first_name,
          last_name,
          phone,
          email,
          address
        )
        VALUES (
          $1,
          'Test',
          'Client',
          '321-888-6586',
          'testclient@nmd.local',
          '123 Test Drive, Winter Park, FL'
        )
        ON CONFLICT DO NOTHING
        `,
        [clientUserId]
      );
    }

    await client.query("COMMIT");

    return res.json({
      ok: true,
      message: "Test users reset successfully",
      logins: {
        admin: {
          email: "testadmin@nmd.local",
          password: "TestAdmin123!",
          portal: "/admin"
        },
        employee: {
          email: "testemployee@nmd.local",
          password: "TestEmployee123!",
          portal: "/employee"
        },
        client: {
          email: "testclient@nmd.local",
          password: "TestClient123!",
          portal: "/"
        }
      }
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("seed test users error", error);
    return res.status(500).json({
      error: "Server error"
    });
  } finally {
    client.release();
  }
});

export default router;

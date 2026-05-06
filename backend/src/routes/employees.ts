import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { buildNmdEmailTemplate, sendEmail } from "../services/email.js";

const router = Router();

function mapEmployee(row: any) {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
    createdAt: row.created_at,
    payRate: Number(row.pay_rate || 30)
  };
}

router.get("/", requireAuth, requireRole("admin"), async (_req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT id, email, display_name, role, created_at, pay_rate
      FROM users
      WHERE role IN ('admin', 'employee')
      ORDER BY created_at DESC
      `
    );

    return res.json({
      employees: result.rows.map(mapEmployee)
    });
  } catch (error) {
    console.error("employees list error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const {
      email,
      displayName,
      password,
      role,
      payRate
    } = req.body as {
      email?: string;
      displayName?: string;
      password?: string;
      role?: "admin" | "employee";
      payRate?: number;
    };

    if (!email || !displayName || !password) {
      return res.status(400).json({
        error: "Email, display name, and password are required"
      });
    }

    if (!role || !["admin", "employee"].includes(role)) {
      return res.status(400).json({
        error: "Role must be admin or employee"
      });
    }

    const existing = await pool.query(
      `
      SELECT id
      FROM users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
      `,
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        error: "A user with this email already exists"
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `
      INSERT INTO users
        (email, password_hash, display_name, role, pay_rate)
      VALUES
        ($1, $2, $3, $4, $5)
      RETURNING id, email, display_name, role, created_at, pay_rate
      `,
      [
        email.trim().toLowerCase(),
        passwordHash,
        displayName.trim(),
        role,
        payRate ?? 30
      ]
    );

    const employee = mapEmployee(result.rows[0]);

    await sendEmail({
      to: employee.email,
      subject: "Your NMD employee portal login",
      html: buildNmdEmailTemplate({
        title: "Welcome to NMD",
        message: `
          <p>Hi ${employee.displayName},</p>
          <p>Your NMD portal account has been created.</p>
          <p><strong>Email:</strong> ${employee.email}</p>
          <p><strong>Temporary Password:</strong> ${password}</p>
          <p><strong>Role:</strong> ${employee.role}</p>
          <p>Please log in and keep this information secure.</p>
        `,
        actionLabel: "Open NMD Portal",
        actionUrl: process.env.FRONTEND_URL || "https://nmd-frontend.onrender.com"
      }),
      text: `Your NMD portal account has been created. Email: ${employee.email}. Temporary password: ${password}`
    });

    return res.status(201).json({
      employee
    });
  } catch (error) {
    console.error("employee create error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.patch("/:employeeId", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { employeeId } = req.params;

    const {
      email,
      displayName,
      role,
      payRate
    } = req.body as {
      email?: string;
      displayName?: string;
      role?: "admin" | "employee";
      payRate?: number;
    };

    if (role && !["admin", "employee"].includes(role)) {
      return res.status(400).json({
        error: "Role must be admin or employee"
      });
    }

    const result = await pool.query(
      `
      UPDATE users
      SET
        email = COALESCE($2, email),
        display_name = COALESCE($3, display_name),
        role = COALESCE($4, role),
        pay_rate = COALESCE($5, pay_rate)
      WHERE id = $1
        AND role IN ('admin', 'employee')
      RETURNING id, email, display_name, role, created_at, pay_rate
      `,
      [
        employeeId,
        email ? email.trim().toLowerCase() : null,
        displayName ? displayName.trim() : null,
        role ?? null,
        payRate ?? null
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Employee not found"
      });
    }

    return res.json({
      employee: mapEmployee(result.rows[0])
    });
  } catch (error) {
    console.error("employee update error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:employeeId", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { employeeId } = req.params;

    const result = await pool.query(
      `
      DELETE FROM users
      WHERE id = $1
        AND role IN ('admin', 'employee')
      RETURNING id
      `,
      [employeeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Employee not found"
      });
    }

    return res.json({
      deleted: true
    });
  } catch (error) {
    console.error("employee delete error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;

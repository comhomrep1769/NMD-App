import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { buildNmdEmailTemplate, sendEmail } from "../services/email.js";
import { logActivity } from "../services/activityLog.js";
const router = Router();
const STAFF_ROLES = ["admin", "superadmin", "employee", "sales"];
function generateTempPassword() {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 10; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
// ── The correct login page differs per role — used in welcome/reset emails
// so new accounts land on the right page instead of always /employee/login. ──
function portalUrlForRole(role) {
    const base = process.env.FRONTEND_URL || "https://nmdpowash.com";
    const map = {
        admin: `${base}/admin`,
        superadmin: `${base}/superadmin`,
        employee: `${base}/employee/login`,
        sales: `${base}/sales/login`,
    };
    return map[role] || `${base}/employee/login`;
}
function capitalize(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
function mapEmployee(row) {
    return {
        id: row.id,
        email: row.email,
        displayName: row.display_name,
        role: row.role,
        createdAt: row.created_at,
        payRate: Number(row.pay_rate || 30),
        mustChangePassword: row.must_change_password ?? false,
    };
}
router.get("/", requireAuth, requireRole("admin", "superadmin"), async (_req, res) => {
    try {
        const result = await pool.query(`SELECT id, email, display_name, role, created_at, pay_rate, must_change_password, profile_image_url
      FROM users WHERE role IN ('admin', 'superadmin', 'employee', 'sales') ORDER BY created_at DESC`);
        return res.json({ employees: result.rows.map(mapEmployee) });
    }
    catch (error) {
        console.error("employees list error", error);
        return res.status(500).json({ error: "Server error" });
    }
});
router.post("/", requireAuth, requireRole("admin", "superadmin"), async (req, res) => {
    try {
        const { email, displayName, role, payRate } = req.body;
        if (!email || !displayName) {
            return res.status(400).json({ error: "Email and display name are required" });
        }
        if (!role || !STAFF_ROLES.includes(role)) {
            return res.status(400).json({ error: "Role must be admin, superadmin, employee, or sales" });
        }
        const existing = await pool.query(`SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`, [email]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: "A user with this email already exists" });
        }
        // Auto-generate temporary password
        const tempPassword = generateTempPassword();
        const passwordHash = await bcrypt.hash(tempPassword, 12);
        const result = await pool.query(`INSERT INTO users (email, password_hash, display_name, role, pay_rate, must_change_password)
      VALUES ($1, $2, $3, $4, $5, TRUE)
      RETURNING id, email, display_name, role, created_at, pay_rate, must_change_password`, [email.trim().toLowerCase(), passwordHash, displayName.trim(), role, payRate ?? 30]);
        const employee = mapEmployee(result.rows[0]);
        const portalUrl = portalUrlForRole(employee.role);
        await logActivity({
            actorType: "admin",
            actorId: req.user.id,
            action: "employee_created",
            description: `New ${employee.role} account created for ${employee.displayName} (${employee.email})`,
            metadata: { employeeId: employee.id, role: employee.role },
        });
        await sendEmail({
            to: employee.email,
            subject: "Welcome to the Team - NMD Pressure Washing Services",
            html: buildNmdEmailTemplate({
                title: "Welcome to the Team",
                heading: "Welcome to the Team!",
                message: `Hi ${employee.displayName},\n\nWe are excited to have you on board at NMD Pressure Washing Services LLC. We are committed to providing top-notch service, supporting our team, and growing together.\n\nYOUR ACCOUNT DETAILS\n\nEmail: ${employee.email}\nTemporary Password: ${tempPassword}\nRole: ${capitalize(employee.role)}\n\nPlease log in using the button below and you will be prompted to set your own password immediately.\n\nGET STARTED\n\nComplete the following to get set up:\n- Log in and set your permanent password\n- Complete new hire paperwork (I-9, W-4, Direct deposit)\n- Review and sign company policies\n- Receive equipment and uniform if applicable\n- Meet your team and review your first week schedule\n\nADD THE APP TO YOUR PHONE\n\niPhone (Safari): Open the link in Safari, tap the Share icon, select Add to Home Screen, tap Add.\n\nAndroid (Chrome): Open the link in Chrome, tap the menu (3 dots), select Add to Home Screen or Install App, tap Add/Install.\n\nSAFETY COMES FIRST\n\nYour safety and the safety of others is our top priority. Always follow safety guidelines, wear required PPE, and report any hazards immediately.\n\nThank you for choosing to be a part of NMD Pressure Washing Services LLC. We look forward to achieving great things together!\n\nBest regards,\nNMD Pressure Washing Services LLC\n321-888-6586\nnmdpowash@gmail.com`,
                buttonText: "Log In to Your Portal",
                buttonUrl: portalUrl,
                footerNote: "Clean Results. Reliable Service. Every Time."
            }),
            text: `Welcome to NMD! Your login: ${employee.email} / Temporary password: ${tempPassword}. Log in here: ${portalUrl}`
        });
        return res.status(201).json({ employee });
    }
    catch (error) {
        console.error("employee create error", error);
        return res.status(500).json({ error: "Server error" });
    }
});
// ── Employee changes their own password ──────────────────────────────────────
router.post("/change-password", requireAuth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: "Current and new password are required" });
        }
        if (newPassword.length < 8) {
            return res.status(400).json({ error: "New password must be at least 8 characters" });
        }
        const userResult = await pool.query(`SELECT id, password_hash FROM users WHERE id = $1 LIMIT 1`, [req.user?.id]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }
        const valid = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
        if (!valid) {
            return res.status(400).json({ error: "Current password is incorrect" });
        }
        const newHash = await bcrypt.hash(newPassword, 12);
        await pool.query(`UPDATE users SET password_hash = $1, must_change_password = FALSE WHERE id = $2`, [newHash, req.user?.id]);
        return res.json({ success: true, message: "Password changed successfully" });
    }
    catch (error) {
        console.error("change password error", error);
        return res.status(500).json({ error: "Server error" });
    }
});
router.patch("/:employeeId", requireAuth, requireRole("admin", "superadmin"), async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { email, displayName, role, payRate } = req.body;
        if (role && !STAFF_ROLES.includes(role)) {
            return res.status(400).json({ error: "Role must be admin, superadmin, employee, or sales" });
        }
        const result = await pool.query(`UPDATE users
      SET
        email = COALESCE($2, email),
        display_name = COALESCE($3, display_name),
        role = COALESCE($4, role),
        pay_rate = COALESCE($5, pay_rate)
      WHERE id = $1 AND role IN ('admin', 'superadmin', 'employee', 'sales')
      RETURNING id, email, display_name, role, created_at, pay_rate, must_change_password`, [employeeId, email ? email.trim().toLowerCase() : null,
            displayName ? displayName.trim() : null, role ?? null, payRate ?? null]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Employee not found" });
        }
        return res.json({ employee: mapEmployee(result.rows[0]) });
    }
    catch (error) {
        console.error("employee update error", error);
        return res.status(500).json({ error: "Server error" });
    }
});
// ── Admin resets an employee's password ─────────────────────────────────────
router.post("/:employeeId/reset-password", requireAuth, requireRole("admin", "superadmin"), async (req, res) => {
    try {
        const { employeeId } = req.params;
        const userResult = await pool.query(`SELECT id, email, display_name, role FROM users WHERE id = $1 AND role IN ('admin','superadmin','employee','sales') LIMIT 1`, [employeeId]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: "Employee not found" });
        }
        const employee = userResult.rows[0];
        const tempPassword = generateTempPassword();
        const passwordHash = await bcrypt.hash(tempPassword, 12);
        await pool.query(`UPDATE users SET password_hash = $1, must_change_password = TRUE WHERE id = $2`, [passwordHash, employeeId]);
        await logActivity({
            actorType: "admin",
            actorId: req.user.id,
            action: "employee_password_reset",
            description: `Admin reset the password for ${employee.display_name}`,
            metadata: { employeeId },
        });
        const portalUrl = portalUrlForRole(employee.role);
        await sendEmail({
            to: employee.email,
            subject: "Password Reset - NMD Pressure Washing Services",
            html: buildNmdEmailTemplate({
                title: "Password Reset",
                heading: "Your Password Has Been Reset",
                message: `Hi ${employee.display_name},\n\nYour password has been reset by an administrator.\n\nYour new temporary password is: ${tempPassword}\n\nPlease log in and set a new password immediately.\n\nBest regards,\nNMD Pressure Washing Services LLC`,
                buttonText: "Log In Now",
                buttonUrl: portalUrl,
                footerNote: "Clean Results. Reliable Service. Every Time."
            }),
            text: `Your NMD password was reset. Temporary password: ${tempPassword}. Log in: ${portalUrl}`
        });
        return res.json({ success: true, message: "Password reset and email sent" });
    }
    catch (error) {
        console.error("reset password error", error);
        return res.status(500).json({ error: "Server error" });
    }
});
router.delete("/:employeeId", requireAuth, requireRole("admin", "superadmin"), async (req, res) => {
    try {
        const { employeeId } = req.params;
        const result = await pool.query(`DELETE FROM users WHERE id = $1 AND role IN ('admin', 'superadmin', 'employee', 'sales') RETURNING id`, [employeeId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Employee not found" });
        }
        return res.json({ deleted: true });
    }
    catch (error) {
        console.error("employee delete error", error);
        return res.status(500).json({ error: "Server error" });
    }
});
export default router;

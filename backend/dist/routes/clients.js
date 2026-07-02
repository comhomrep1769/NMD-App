import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { buildNmdEmailTemplate, sendEmail } from "../services/email.js";
import { logActivity } from "../services/activityLog.js";
const router = Router();
function generateTempPassword() {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 10; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
router.get("/", requireAuth, async (_req, res) => {
    try {
        const result = await pool.query(`
      SELECT id, first_name, last_name, phone, email, address, created_at, user_id
      FROM clients
      ORDER BY created_at DESC
    `);
        res.json({
            clients: result.rows.map((row) => ({
                id: row.id,
                firstName: row.first_name,
                lastName: row.last_name,
                phone: row.phone ?? "",
                email: row.email ?? "",
                address: row.address ?? "",
                createdAt: row.created_at,
                hasLogin: !!row.user_id,
            }))
        });
    }
    catch (error) {
        console.error("clients list error", error);
        res.status(500).json({ error: "Server error" });
    }
});
router.post("/", requireAuth, requireRole("admin", "superadmin"), async (req, res) => {
    try {
        const { firstName, lastName, phone, email, address, createLogin } = req.body;
        if (!firstName || !lastName) {
            return res.status(400).json({ error: "First and last name are required" });
        }
        // ── Opt-in path: also create a portal login for this client ──
        if (createLogin) {
            if (!email) {
                return res.status(400).json({ error: "Email is required to create a portal login" });
            }
            const existingUser = await pool.query(`SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`, [email]);
            if (existingUser.rows.length > 0) {
                return res.status(400).json({ error: "A user with this email already exists" });
            }
            const tempPassword = generateTempPassword();
            const passwordHash = await bcrypt.hash(tempPassword, 12);
            const displayName = `${firstName} ${lastName}`.trim();
            const userResult = await pool.query(`INSERT INTO users (email, password_hash, display_name, role, pay_rate, phone, address, must_change_password)
        VALUES ($1, $2, $3, 'client', NULL, $4, $5, TRUE)
        RETURNING id`, [email.trim().toLowerCase(), passwordHash, displayName, phone ?? null, address ?? null]);
            const userId = userResult.rows[0].id;
            const result = await pool.query(`
        INSERT INTO clients (first_name, last_name, phone, email, address, user_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, first_name, last_name, phone, email, address, created_at, user_id
        `, [firstName, lastName, phone ?? "", email ?? "", address ?? "", userId]);
            const row = result.rows[0];
            await logActivity({
                actorType: "admin",
                actorId: req.user.id,
                action: "client_created",
                description: `New client account created for ${firstName} ${lastName} (${email})`,
                metadata: { clientId: row.id, userId },
            });
            const portalUrl = `${process.env.FRONTEND_URL || "https://nmdpowash.com"}/client/login`;
            await sendEmail({
                to: email,
                subject: "Welcome to Your Client Portal - NMD Pressure Washing Services",
                html: buildNmdEmailTemplate({
                    title: "Welcome to Your Client Portal",
                    heading: "Welcome to NMD Pressure Washing!",
                    message: `Hi ${displayName},\n\nAn account has been set up for you on the NMD Pressure Washing Services LLC client portal. From your portal you can request services, review and accept quotes, pay invoices, track your recurring plan, and view before/after photos of your completed jobs.\n\nYOUR ACCOUNT DETAILS\n\nEmail: ${email}\nTemporary Password: ${tempPassword}\n\nPlease log in using the button below and you will be prompted to set your own password immediately.\n\nADD THE APP TO YOUR PHONE\n\niPhone (Safari): Open the link in Safari, tap the Share icon, select Add to Home Screen, tap Add.\n\nAndroid (Chrome): Open the link in Chrome, tap the menu (3 dots), select Add to Home Screen or Install App, tap Add/Install.\n\nWe look forward to serving you!\n\nBest regards,\nNMD Pressure Washing Services LLC\n321-888-6586\nnmdpowash@gmail.com`,
                    buttonText: "Log In to Client Portal",
                    buttonUrl: portalUrl,
                    footerNote: "Clean Results. Reliable Service. Every Time."
                }),
                text: `Welcome to NMD! Your login: ${email} / Temporary password: ${tempPassword}. Log in here: ${portalUrl}`
            });
            return res.status(201).json({
                client: {
                    id: row.id,
                    firstName: row.first_name,
                    lastName: row.last_name,
                    phone: row.phone ?? "",
                    email: row.email ?? "",
                    address: row.address ?? "",
                    createdAt: row.created_at,
                    hasLogin: !!row.user_id,
                }
            });
        }
        // ── Original behavior — CRM-only record, no portal access ──
        const result = await pool.query(`
      INSERT INTO clients (first_name, last_name, phone, email, address)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, first_name, last_name, phone, email, address, created_at, user_id
      `, [firstName, lastName, phone ?? "", email ?? "", address ?? ""]);
        const row = result.rows[0];
        await logActivity({
            actorType: "admin",
            actorId: req.user.id,
            action: "client_created",
            description: `New client record added for ${firstName} ${lastName}`,
            metadata: { clientId: row.id },
        });
        res.status(201).json({
            client: {
                id: row.id,
                firstName: row.first_name,
                lastName: row.last_name,
                phone: row.phone ?? "",
                email: row.email ?? "",
                address: row.address ?? "",
                createdAt: row.created_at,
                hasLogin: !!row.user_id,
            }
        });
    }
    catch (error) {
        console.error("client create error", error);
        res.status(500).json({ error: "Server error" });
    }
});
router.patch("/:clientId", requireAuth, requireRole("admin", "superadmin"), async (req, res) => {
    try {
        const { clientId } = req.params;
        const { firstName, lastName, phone, email, address } = req.body;
        const result = await pool.query(`
      UPDATE clients
      SET
        first_name = COALESCE($2, first_name),
        last_name = COALESCE($3, last_name),
        phone = COALESCE($4, phone),
        email = COALESCE($5, email),
        address = COALESCE($6, address)
      WHERE id = $1
      RETURNING id, first_name, last_name, phone, email, address, created_at, user_id
      `, [clientId, firstName ?? null, lastName ?? null, phone ?? null, email ?? null, address ?? null]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Client not found" });
        }
        const row = result.rows[0];
        res.json({
            client: {
                id: row.id,
                firstName: row.first_name,
                lastName: row.last_name,
                phone: row.phone ?? "",
                email: row.email ?? "",
                address: row.address ?? "",
                createdAt: row.created_at,
                hasLogin: !!row.user_id,
            }
        });
    }
    catch (error) {
        console.error("client update error", error);
        res.status(500).json({ error: "Server error" });
    }
});
router.delete("/:clientId", requireAuth, requireRole("admin", "superadmin"), async (req, res) => {
    try {
        const { clientId } = req.params;
        const result = await pool.query(`DELETE FROM clients WHERE id = $1 RETURNING id, user_id`, [clientId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Client not found" });
        }
        // ── If this client had a portal login, remove it too — otherwise the
        // email is permanently stuck and an orphaned login with no client
        // profile would remain. ──
        const deletedUserId = result.rows[0].user_id;
        if (deletedUserId) {
            await pool.query(`DELETE FROM users WHERE id = $1 AND role = 'client'`, [deletedUserId]);
        }
        res.json({ deleted: true });
    }
    catch (error) {
        console.error("client delete error", error);
        res.status(500).json({ error: "Server error" });
    }
});
export default router;

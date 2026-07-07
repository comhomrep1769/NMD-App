import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { buildNmdEmailTemplate, sendEmail } from "../services/email.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
const router = Router();
function mapApplicant(row) {
    return {
        id: row.id,
        fullName: row.full_name,
        email: row.email,
        phone: row.phone,
        position: row.position,
        message: row.message,
        resumeDataUrl: row.resume_data_url,
        resumeFileName: row.resume_file_name,
        status: row.status,
        adminNotes: row.admin_notes,
        createdAt: row.created_at,
        userId: row.user_id,
        onboardingComplete: row.onboarding_complete ?? false,
    };
}
// Public — submit application
router.post("/", async (req, res) => {
    try {
        const { fullName, email, phone, position, message, resumeDataUrl, resumeFileName } = req.body;
        if (!fullName || !email || !position) {
            return res.status(400).json({ error: "Full name, email, and position are required." });
        }
        if (resumeDataUrl && resumeDataUrl.length > 10_000_000) {
            return res.status(400).json({ error: "Resume file is too large. Please upload a smaller file." });
        }
        const result = await pool.query(`INSERT INTO job_applicants (full_name, email, phone, position, message, resume_data_url, resume_file_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`, [fullName.trim(), email.trim(), phone?.trim() || null, position.trim(),
            message?.trim() || null, resumeDataUrl || null, resumeFileName || null]);
        const applicant = result.rows[0];
        // Notify admin
        const adminEmail = process.env.NMD_ADMIN_EMAIL || "nmdpowash@gmail.com";
        await sendEmail({
            to: adminEmail,
            subject: `New job application: ${fullName} — ${position}`,
            html: buildNmdEmailTemplate({
                title: "New Job Application",
                heading: "Someone applied to join the NMD team!",
                message: `Name: ${fullName}\nEmail: ${email}\nPhone: ${phone || "Not provided"}\nPosition: ${position}\n\nMessage:\n${message || "No message provided"}\n\n${resumeFileName ? `Resume attached: ${resumeFileName}` : "No resume uploaded."}`,
                buttonText: "View Applicants",
                buttonUrl: `${process.env.FRONTEND_URL || "https://nmdpowash.com"}/applicants`,
                footerNote: "Clean Results. Reliable Service. Every Time."
            }),
            text: `New application from ${fullName} for ${position}. Email: ${email}`
        });
        // Confirm to applicant
        await sendEmail({
            to: email,
            subject: "We received your application — NMD Pressure Washing",
            html: buildNmdEmailTemplate({
                title: "Application Received",
                heading: "Thanks for applying!",
                message: `Hi ${fullName},\n\nWe've received your application for the ${position} position at NMD Pressure Washing Services LLC.\n\nWe'll review your application and reach out if you're a good fit. Thank you for your interest in joining our team!`,
                footerNote: "Clean Results. Reliable Service. Every Time."
            }),
            text: `Hi ${fullName}, we received your application for ${position} at NMD Pressure Washing.`
        });
        return res.status(201).json({ success: true, applicantId: applicant.id });
    }
    catch (error) {
        console.error("applicant submit error", error);
        return res.status(500).json({ error: "Server error" });
    }
});
// Admin — list all applicants
router.get("/", requireAuth, requireRole("admin"), async (_req, res) => {
    try {
        const result = await pool.query(`SELECT * FROM job_applicants ORDER BY created_at DESC`);
        return res.json({ applicants: result.rows.map(mapApplicant) });
    }
    catch (error) {
        console.error("applicants list error", error);
        return res.status(500).json({ error: "Server error" });
    }
});
// Admin — update status / notes
router.patch("/:id", requireAuth, requireRole("admin"), async (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminNotes } = req.body;
        // Check current state
        const current = await pool.query("SELECT * FROM job_applicants WHERE id = $1 LIMIT 1", [id]);
        if (current.rows.length === 0)
            return res.status(404).json({ error: "Applicant not found" });
        const applicant = current.rows[0];
        // If changing to hired and no user account exists yet, create one
        if (status === "hired" && !applicant.user_id) {
            const tempPassword = crypto.randomBytes(16).toString("hex");
            const passwordHash = await bcrypt.hash(tempPassword, 12);
            const nameParts = applicant.full_name.trim().split(/\s+/);
            // Create employee user
            const userResult = await pool.query(`INSERT INTO users (email, password_hash, display_name, role, phone, date_joined, must_change_password)
         VALUES ($1, $2, $3, 'employee', $4, CURRENT_DATE, true)
         ON CONFLICT (email) DO UPDATE SET role = 'employee', must_change_password = true
         RETURNING id`, [applicant.email.toLowerCase(), passwordHash, applicant.full_name.trim(), applicant.phone]);
            const userId = userResult.rows[0].id;
            // Generate onboarding token (7 day expiry)
            const onboardToken = crypto.randomBytes(48).toString("hex");
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            await pool.query("INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)", [userId, onboardToken, expiresAt]);
            // Link applicant to user
            await pool.query("UPDATE job_applicants SET user_id = $1 WHERE id = $2", [userId, id]);
            // Send onboarding email
            const frontendUrl = process.env.FRONTEND_URL || "https://nmdpowash.com";
            const onboardUrl = frontendUrl + "/employee/onboard?token=" + onboardToken;
            try {
                await sendEmail({
                    to: applicant.email,
                    subject: "Welcome to NMD Pressure Washing — Complete Your Setup",
                    html: buildNmdEmailTemplate({
                        title: "You're Hired!",
                        heading: "Welcome to the NMD Team!",
                        message: "Hi " + applicant.full_name + ",\n\nCongratulations! You've been hired as part of the NMD Pressure Washing team.\n\nClick the button below to set up your password and profile image. This link expires in 7 days.",
                        buttonText: "Complete Onboarding",
                        buttonUrl: onboardUrl,
                        footerNote: "Clean Results. Reliable Service. Every Time."
                    }),
                    text: "Welcome to NMD! Set up your account here: " + onboardUrl
                });
            }
            catch (emailErr) {
                console.error("Onboarding email error:", emailErr);
            }
        }
        const result = await pool.query(`UPDATE job_applicants
       SET status = COALESCE($2, status), admin_notes = COALESCE($3, admin_notes)
       WHERE id = $1 RETURNING *`, [id, status ?? null, adminNotes ?? null]);
        return res.json({ applicant: mapApplicant(result.rows[0]) });
    }
    catch (error) {
        console.error("applicant update error", error);
        return res.status(500).json({ error: "Server error" });
    }
});
// Admin — delete applicant
router.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`DELETE FROM job_applicants WHERE id = $1 RETURNING id`, [id]);
        if (result.rows.length === 0)
            return res.status(404).json({ error: "Applicant not found" });
        return res.json({ deleted: true });
    }
    catch (error) {
        console.error("applicant delete error", error);
        return res.status(500).json({ error: "Server error" });
    }
});
export default router;

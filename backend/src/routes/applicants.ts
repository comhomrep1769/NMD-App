import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { buildNmdEmailTemplate, sendEmail } from "../services/email.js";

const router = Router();

function mapApplicant(row: any) {
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
  };
}

// Public — submit application
router.post("/", async (req, res) => {
  try {
    const { fullName, email, phone, position, message, resumeDataUrl, resumeFileName } = req.body as {
      fullName?: string; email?: string; phone?: string; position?: string;
      message?: string; resumeDataUrl?: string; resumeFileName?: string;
    };

    if (!fullName || !email || !position) {
      return res.status(400).json({ error: "Full name, email, and position are required." });
    }

    if (resumeDataUrl && resumeDataUrl.length > 10_000_000) {
      return res.status(400).json({ error: "Resume file is too large. Please upload a smaller file." });
    }

    const result = await pool.query(
      `INSERT INTO job_applicants (full_name, email, phone, position, message, resume_data_url, resume_file_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [fullName.trim(), email.trim(), phone?.trim() || null, position.trim(),
       message?.trim() || null, resumeDataUrl || null, resumeFileName || null]
    );

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
  } catch (error) {
    console.error("applicant submit error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

// Admin — list all applicants
router.get("/", requireAuth, requireRole("admin"), async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM job_applicants ORDER BY created_at DESC`
    );
    return res.json({ applicants: result.rows.map(mapApplicant) });
  } catch (error) {
    console.error("applicants list error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

// Admin — update status / notes
router.patch("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body as {
      status?: "new" | "reviewed" | "interview" | "hired" | "rejected";
      adminNotes?: string;
    };

    const result = await pool.query(
      `UPDATE job_applicants
       SET status = COALESCE($2, status), admin_notes = COALESCE($3, admin_notes)
       WHERE id = $1 RETURNING *`,
      [id, status ?? null, adminNotes ?? null]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: "Applicant not found" });
    return res.json({ applicant: mapApplicant(result.rows[0]) });
  } catch (error) {
    console.error("applicant update error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

// Admin — delete applicant
router.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`DELETE FROM job_applicants WHERE id = $1 RETURNING id`, [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Applicant not found" });
    return res.json({ deleted: true });
  } catch (error) {
    console.error("applicant delete error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
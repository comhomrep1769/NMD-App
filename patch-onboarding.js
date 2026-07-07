const fs = require('fs')
const path = require('path')
const ROOT = 'C:/Dev/NMD-App'

// ── PATCH applicants.ts ──────────────────────────────────────────────────────
const appFile = path.join(ROOT, 'backend/src/routes/applicants.ts')
let app = fs.readFileSync(appFile, 'utf8')
const appCRLF = app.includes('\r\n')
app = app.replace(/\r\n/g, '\n')

// 1. Add crypto import
app = app.replace(
  'import { buildNmdEmailTemplate, sendEmail } from "../services/email.js";',
  'import { buildNmdEmailTemplate, sendEmail } from "../services/email.js";\nimport bcrypt from "bcryptjs";\nimport crypto from "crypto";'
)
console.log('1. imports added')

// 2. Add user_id to mapApplicant
app = app.replace(
  'adminNotes: row.admin_notes,\n    createdAt: row.created_at,',
  'adminNotes: row.admin_notes,\n    createdAt: row.created_at,\n    userId: row.user_id,\n    onboardingComplete: row.onboarding_complete ?? false,'
)
console.log('2. mapApplicant updated')

// 3. Replace the PATCH handler entirely
const oldPatch = `// Admin — update status / notes
router.patch("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body as {
      status?: "new" | "reviewed" | "interview" | "hired" | "rejected";
      adminNotes?: string;
    };

    const result = await pool.query(
      \`UPDATE job_applicants
       SET status = COALESCE($2, status), admin_notes = COALESCE($3, admin_notes)
       WHERE id = $1 RETURNING *\`,
      [id, status ?? null, adminNotes ?? null]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: "Applicant not found" });
    return res.json({ applicant: mapApplicant(result.rows[0]) });
  } catch (error) {
    console.error("applicant update error", error);
    return res.status(500).json({ error: "Server error" });
  }
});`

const newPatch = `// Admin — update status / notes
router.patch("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body as {
      status?: "new" | "reviewed" | "interview" | "hired" | "rejected";
      adminNotes?: string;
    };

    // Check current state
    const current = await pool.query("SELECT * FROM job_applicants WHERE id = $1 LIMIT 1", [id]);
    if (current.rows.length === 0) return res.status(404).json({ error: "Applicant not found" });
    const applicant = current.rows[0];

    // If changing to hired and no user account exists yet, create one
    if (status === "hired" && !applicant.user_id) {
      const tempPassword = crypto.randomBytes(16).toString("hex");
      const passwordHash = await bcrypt.hash(tempPassword, 12);
      const nameParts = applicant.full_name.trim().split(/\\s+/);

      // Create employee user
      const userResult = await pool.query(
        \`INSERT INTO users (email, password_hash, display_name, role, phone, date_joined, must_change_password)
         VALUES ($1, $2, $3, 'employee', $4, CURRENT_DATE, true)
         ON CONFLICT (email) DO UPDATE SET role = 'employee', must_change_password = true
         RETURNING id\`,
        [applicant.email.toLowerCase(), passwordHash, applicant.full_name.trim(), applicant.phone]
      );
      const userId = userResult.rows[0].id;

      // Generate onboarding token (7 day expiry)
      const onboardToken = crypto.randomBytes(48).toString("hex");
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await pool.query(
        "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)",
        [userId, onboardToken, expiresAt]
      );

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
            message: "Hi " + applicant.full_name + ",\\n\\nCongratulations! You've been hired as part of the NMD Pressure Washing team.\\n\\nClick the button below to set up your password and profile image. This link expires in 7 days.",
            buttonText: "Complete Onboarding",
            buttonUrl: onboardUrl,
            footerNote: "Clean Results. Reliable Service. Every Time."
          }),
          text: "Welcome to NMD! Set up your account here: " + onboardUrl
        });
      } catch (emailErr) {
        console.error("Onboarding email error:", emailErr);
      }
    }

    const result = await pool.query(
      \`UPDATE job_applicants
       SET status = COALESCE($2, status), admin_notes = COALESCE($3, admin_notes)
       WHERE id = $1 RETURNING *\`,
      [id, status ?? null, adminNotes ?? null]
    );

    return res.json({ applicant: mapApplicant(result.rows[0]) });
  } catch (error) {
    console.error("applicant update error", error);
    return res.status(500).json({ error: "Server error" });
  }
});`

if (!app.includes(oldPatch)) {
  console.error('ERROR: PATCH handler not found in applicants.ts')
  process.exit(1)
}
app = app.replace(oldPatch, newPatch)
console.log('3. PATCH handler replaced')

const finalApp = appCRLF ? app.replace(/\n/g, '\r\n') : app
fs.writeFileSync(appFile, finalApp, 'utf8')
console.log('applicants.ts patched')

// ── PATCH auth.ts — add onboard endpoint ─────────────────────────────────────
const authFile = path.join(ROOT, 'backend/src/routes/auth.ts')
let auth = fs.readFileSync(authFile, 'utf8')
const authCRLF = auth.includes('\r\n')
auth = auth.replace(/\r\n/g, '\n')

const onboardRoute = `
// ── Employee onboarding (set password + profile image via token) ──
router.post("/onboard", async (req, res) => {
  try {
    const { token, password, profileImageUrl } = req.body as {
      token?: string; password?: string; profileImageUrl?: string;
    };

    if (!token || !password || password.length < 8) {
      return res.status(400).json({ error: "Valid token and password (min 8 chars) are required." });
    }

    const tokenResult = await pool.query(
      "SELECT * FROM password_reset_tokens WHERE token = $1 AND used_at IS NULL AND expires_at > NOW() LIMIT 1",
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ error: "This link is invalid or has expired. Please contact NMD for a new one." });
    }

    const tokenRow = tokenResult.rows[0];
    const hashed = await bcrypt.hash(password, 12);

    // Update password, clear must_change_password flag, optionally set avatar
    if (profileImageUrl) {
      await pool.query(
        "UPDATE users SET password_hash = $1, must_change_password = false, profile_image_url = $2, updated_at = NOW() WHERE id = $3",
        [hashed, profileImageUrl, tokenRow.user_id]
      );
    } else {
      await pool.query(
        "UPDATE users SET password_hash = $1, must_change_password = false, updated_at = NOW() WHERE id = $2",
        [hashed, tokenRow.user_id]
      );
    }

    // Mark token as used
    await pool.query("UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1", [tokenRow.id]);

    // Update applicant onboarding status
    await pool.query(
      "UPDATE job_applicants SET onboarding_complete = true WHERE user_id = $1",
      [tokenRow.user_id]
    );

    return res.json({ ok: true });
  } catch (error) {
    console.error("onboard error", error);
    return res.status(500).json({ error: "Server error" });
  }
});
`

auth = auth.replace('\nexport default router;', onboardRoute + '\nexport default router;')
console.log('4. onboard route added to auth.ts')

const finalAuth = authCRLF ? auth.replace(/\n/g, '\r\n') : auth
fs.writeFileSync(authFile, finalAuth, 'utf8')
console.log('auth.ts patched')

console.log('\nAll backend patches done!')

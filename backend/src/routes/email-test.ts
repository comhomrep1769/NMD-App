import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { buildNmdEmailTemplate, sendEmail } from "../services/email.js";

const router = Router();

router.post("/send-test", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { to } = req.body as {
      to?: string;
    };

    if (!to) {
      return res.status(400).json({
        error: "Test email recipient is required"
      });
    }

    const html = buildNmdEmailTemplate({
      title: "NMD Email Test",
      message: `
        <p>This is a test email from the NMD app.</p>
        <p>If you received this, Resend is connected correctly.</p>
      `,
      footer: "NMD Pressure Washing Services LLC"
    });

    const result = await sendEmail({
      to,
      subject: "NMD Email Test",
      html,
      text: "This is a test email from the NMD app."
    });

    return res.json({
      ok: true,
      result
    });
  } catch (error) {
    console.error("email test error", error);
    return res.status(500).json({
      error: "Server error"
    });
  }
});

export default router;

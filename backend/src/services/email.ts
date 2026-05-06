import { Resend } from "resend";

const emailEnabled = process.env.EMAIL_ENABLED === "true";
const resendApiKey = process.env.RESEND_API_KEY || "";
const fromEmail =
  process.env.RESEND_FROM_EMAIL ||
  "NMD Pressure Washing <quotes@mail.nmdpowash.com>";

const resend = resendApiKey ? new Resend(resendApiKey) : null;

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendEmail({ to, subject, html, text }: SendEmailInput) {
  if (!emailEnabled || !resend || !resendApiKey) {
    console.log("Email disabled or missing Resend config:", {
      to,
      subject
    });

    return {
      skipped: true,
      reason: "Email disabled or missing Resend config"
    };
  }

  try {
    const result = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
      text
    });

    return {
      skipped: false,
      result
    };
  } catch (error) {
    console.error("Resend email error", error);

    return {
      skipped: false,
      error: "Email failed to send"
    };
  }
}

export function buildNmdEmailTemplate({
  title,
  message,
  actionLabel,
  actionUrl,
  footer
}: {
  title: string;
  message: string;
  actionLabel?: string;
  actionUrl?: string;
  footer?: string;
}) {
  const button =
    actionLabel && actionUrl
      ? `
        <p style="margin:24px 0;">
          <a href="${actionUrl}" style="background:#16a34a;color:#ffffff;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:bold;display:inline-block;">
            ${actionLabel}
          </a>
        </p>
      `
      : "";

  return `
    <div style="font-family:Arial,sans-serif;background:#f6f8f7;padding:24px;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:16px;padding:24px;border:1px solid #dbe5dd;">
        <h1 style="margin:0 0 12px;color:#0f3d2e;">${title}</h1>

        <div style="font-size:16px;line-height:1.6;color:#1f2937;">
          ${message}
        </div>

        ${button}

        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />

        <p style="font-size:13px;color:#6b7280;margin:0;">
          ${footer || "NMD Pressure Washing Services LLC • No More Dirt"}
        </p>
      </div>
    </div>
  `;
}

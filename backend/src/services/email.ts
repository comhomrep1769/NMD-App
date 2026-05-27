import { Resend } from "resend";

type SendEmailInput = {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
};

type BuildNmdEmailTemplateInput = {
  title?: string;
  heading?: string;
  preheader?: string;
  body?: string;
  message?: string;
  buttonText?: string;
  buttonUrl?: string;
  actionLabel?: string;
  actionUrl?: string;
  actionText?: string;
  actionHref?: string;
  footerNote?: string;
  footer?: string;
};

function escapeHtml(value: string) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function paragraphsFromText(value: string) {
  return String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p style="margin:0 0 14px;color:#334155;font-size:15px;line-height:1.6;">${escapeHtml(line)}</p>`)
    .join("");
}

export function buildNmdEmailTemplate(input: BuildNmdEmailTemplateInput | string) {
  const config: BuildNmdEmailTemplateInput =
    typeof input === "string"
      ? { title: "NMD Pressure Washing Services", heading: "NMD Pressure Washing Services", body: input }
      : input;

  const title = config.title || "NMD Pressure Washing Services";
  const heading = config.heading || title;
  const body = config.body || config.message || "";
  const buttonText = config.buttonText || config.actionLabel || config.actionText || "";
  const buttonUrl = config.buttonUrl || config.actionUrl || config.actionHref || "";
  const footerNote = config.footerNote || config.footer || "Thank you for choosing NMD Pressure Washing Services — No More Dirt.";

  const buttonHtml = buttonText && buttonUrl
    ? `<div style="margin:24px 0;text-align:center;"><a href="${escapeHtml(buttonUrl)}" style="display:inline-block;background:linear-gradient(135deg,#1f6132,#124d83);color:#ffffff;text-decoration:none;font-weight:800;padding:14px 24px;border-radius:12px;font-size:15px;">${escapeHtml(buttonText)}</a></div>`
    : "";

  return `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${escapeHtml(title)}</title></head><body style="margin:0;padding:0;background:#eef7ff;font-family:Arial,sans-serif;"><div style="display:none;max-height:0;overflow:hidden;color:transparent;">${escapeHtml(config.preheader || heading)}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef7ff;padding:28px 12px;"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid rgba(37,99,235,.18);border-radius:18px;overflow:hidden;box-shadow:0 20px 48px rgba(15,89,150,.14);"><tr><td style="padding:28px 24px 20px;background:linear-gradient(135deg,#1f6132,#124d83);text-align:center;"><img src="https://nmdpowash.com/nmd-logo-email.png" alt="NMD Pressure Washing Services" width="120" style="display:block;margin:0 auto 14px;height:auto;" /><h1 style="margin:0;font-size:22px;line-height:1.3;color:#ffffff;font-weight:800;">${escapeHtml(heading)}</h1></td></tr><tr><td style="padding:26px;">${paragraphsFromText(body)}${buttonHtml}</td></tr><tr><td style="padding:18px 26px;background:#f8fbff;border-top:1px solid rgba(37,99,235,.12);"><p style="margin:0;color:#64748b;font-size:13px;line-height:1.5;">${escapeHtml(footerNote)}</p></td></tr></table></td></tr></table></body></html>`;
}

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY || "";
  if (!apiKey) return null;
  return new Resend(apiKey);
}

export async function sendEmail(input: SendEmailInput) {
  const resend = getResendClient();
  if (!resend) {
    console.warn("RESEND_API_KEY is not set. Email was skipped.", { to: input.to, subject: input.subject });
    return { skipped: true, reason: "RESEND_API_KEY is not set." };
  }
  const from = input.from || process.env.RESEND_FROM_EMAIL || "NMD Pressure Washing <onboarding@resend.dev>";
  const result = await resend.emails.send({
    from, to: input.to, subject: input.subject,
    html: input.html || input.text || "", text: input.text
  });
  return { skipped: false, result };
}

export async function sendClientQuoteEmail(input: {
  to: string; clientName: string;
  quoteNumber?: number | string; message?: string; quoteUrl?: string;
}) {
  const message = input.message || "Your quote is ready for review.";
  return sendEmail({
    to: input.to,
    subject: `NMD Quote${input.quoteNumber ? ` #${input.quoteNumber}` : ""}`,
    html: buildNmdEmailTemplate({
      title: "NMD Quote",
      heading: `Quote${input.quoteNumber ? ` #${input.quoteNumber}` : ""}`,
      body: `Hello ${input.clientName || "there"},\n\n${message}`,
      actionLabel: input.quoteUrl ? "View Quote" : undefined,
      actionUrl: input.quoteUrl
    }),
    text: `Hello ${input.clientName || "there"},\n\n${message}\n\nThank you,\nNMD Pressure Washing Services`
  });
}

export async function sendClientInvoiceEmail(input: {
  to: string; clientName: string;
  invoiceNumber?: number | string; message?: string; paymentUrl?: string;
}) {
  const message = input.message || "Your invoice is ready.";
  return sendEmail({
    to: input.to,
    subject: `NMD Invoice${input.invoiceNumber ? ` #${input.invoiceNumber}` : ""}`,
    html: buildNmdEmailTemplate({
      title: "NMD Invoice",
      heading: `Invoice${input.invoiceNumber ? ` #${input.invoiceNumber}` : ""}`,
      body: `Hello ${input.clientName || "there"},\n\n${message}`,
      actionLabel: input.paymentUrl ? "Pay Invoice" : undefined,
      actionUrl: input.paymentUrl
    }),
    text: `Hello ${input.clientName || "there"},\n\n${message}\n\nThank you,\nNMD Pressure Washing Services`
  });
}

export async function sendEmployeeOnboardingEmail(input: {
  to: string; displayName: string;
  temporaryPassword?: string; portalUrl?: string;
}) {
  const body = [`Hello ${input.displayName || "there"},`, "", "Your employee portal account has been created.", input.temporaryPassword ? `Temporary password: ${input.temporaryPassword}` : "", "Please log in through the employee portal."].filter(Boolean).join("\n");
  return sendEmail({
    to: input.to,
    subject: "Your NMD Employee Portal Account",
    html: buildNmdEmailTemplate({
      title: "NMD Employee Portal", heading: "Employee Portal Account", body,
      actionLabel: input.portalUrl ? "Open Employee Portal" : undefined, actionUrl: input.portalUrl
    }),
    text: body
  });
}

export async function sendPasswordResetEmail(input: {
  to: string; displayName?: string;
  resetUrl?: string; temporaryPassword?: string;
}) {
  const body = [`Hello ${input.displayName || "there"},`, "", "A password reset was requested for your NMD account.", input.temporaryPassword ? `Temporary password: ${input.temporaryPassword}` : "", input.resetUrl ? "Use the button below to continue." : ""].filter(Boolean).join("\n");
  return sendEmail({
    to: input.to,
    subject: "NMD Password Reset",
    html: buildNmdEmailTemplate({
      title: "NMD Password Reset", heading: "Password Reset", body,
      actionLabel: input.resetUrl ? "Reset Password" : undefined, actionUrl: input.resetUrl
    }),
    text: body
  });
}

export default { buildNmdEmailTemplate, sendEmail, sendClientQuoteEmail, sendClientInvoiceEmail, sendEmployeeOnboardingEmail, sendPasswordResetEmail };

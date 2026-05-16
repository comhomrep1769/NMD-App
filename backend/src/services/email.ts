import { Resend } from "resend";

type SendEmailInput = {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
};

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY || "";

  if (!apiKey) {
    return null;
  }

  return new Resend(apiKey);
}

export async function sendEmail(input: SendEmailInput) {
  const resend = getResendClient();

  if (!resend) {
    console.warn("RESEND_API_KEY is not set. Email was skipped.", {
      to: input.to,
      subject: input.subject
    });

    return {
      skipped: true,
      reason: "RESEND_API_KEY is not set."
    };
  }

  const from =
    input.from ||
    process.env.RESEND_FROM_EMAIL ||
    "NMD Pressure Washing <onboarding@resend.dev>";

  const result = await resend.emails.send({
    from,
    to: input.to,
    subject: input.subject,
    html: input.html || input.text || "",
    text: input.text
  });

  return {
    skipped: false,
    result
  };
}

export async function sendClientQuoteEmail(input: {
  to: string;
  clientName: string;
  quoteNumber?: number | string;
  message?: string;
}) {
  return sendEmail({
    to: input.to,
    subject: `NMD Quote${input.quoteNumber ? ` #${input.quoteNumber}` : ""}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>NMD Pressure Washing Services</h2>
        <p>Hello ${input.clientName || "there"},</p>
        <p>${input.message || "Your quote is ready for review."}</p>
        <p>Thank you,<br/>NMD Pressure Washing Services</p>
      </div>
    `,
    text: `Hello ${input.clientName || "there"},\n\n${
      input.message || "Your quote is ready for review."
    }\n\nThank you,\nNMD Pressure Washing Services`
  });
}

export async function sendEmployeeOnboardingEmail(input: {
  to: string;
  displayName: string;
  temporaryPassword?: string;
}) {
  return sendEmail({
    to: input.to,
    subject: "Your NMD Employee Portal Account",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>NMD Employee Portal</h2>
        <p>Hello ${input.displayName || "there"},</p>
        <p>Your employee portal account has been created.</p>
        ${
          input.temporaryPassword
            ? `<p><strong>Temporary password:</strong> ${input.temporaryPassword}</p>`
            : ""
        }
        <p>Please log in through the employee portal.</p>
      </div>
    `,
    text: `Hello ${input.displayName || "there"},\n\nYour employee portal account has been created.${
      input.temporaryPassword
        ? `\nTemporary password: ${input.temporaryPassword}`
        : ""
    }\n\nPlease log in through the employee portal.`
  });
}

export default {
  sendEmail,
  sendClientQuoteEmail,
  sendEmployeeOnboardingEmail
};

import React from "react";
import { apiFetch } from "../api";

export default function EmailTestPage() {
  const [to, setTo] = React.useState("nmdpowash@gmail.com");
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState("");
  const [error, setError] = React.useState("");

  const sendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess("");
    setError("");

    if (!to.trim()) {
      setError("Enter an email address first.");
      return;
    }

    try {
      setLoading(true);

      const data = await apiFetch<{ ok: boolean; result: unknown }>(
        "/api/email-test/send-test",
        {
          method: "POST",
          body: JSON.stringify({
            to: to.trim()
          })
        }
      );

      if (data.ok) {
        setSuccess("Test email sent. Check the inbox and spam folder.");
      } else {
        setError("Email test did not return OK.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send test email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pageGrid">
      <section className="panel">
        <h2 className="panelTitle">Email Test</h2>

        <p className="brandSubtitle">
          Use this page to confirm Resend is connected before we automate quote,
          invoice, request, and payment emails.
        </p>

        {success && <div className="listCard">{success}</div>}
        {error && <div className="errorBox">{error}</div>}

        <form className="formGrid" onSubmit={sendTestEmail}>
          <input
            className="textInput"
            placeholder="Send test email to"
            type="email"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />

          <button className="primaryButton" type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send Test Email"}
          </button>
        </form>
      </section>

      <section className="panel">
        <h2 className="panelTitle">Current Email Setup</h2>

        <div className="cardsGrid">
          <div className="quoteCard">
            <div className="quoteNumber">Sender Domain</div>
            <div className="cardLine">mail.nmdpowash.com</div>
          </div>

          <div className="quoteCard">
            <div className="quoteNumber">From Address</div>
            <div className="cardLine">
              NMD Pressure Washing &lt;quotes@mail.nmdpowash.com&gt;
            </div>
          </div>

          <div className="quoteCard">
            <div className="quoteNumber">Backend ENV Needed</div>
            <div className="cardLine">RESEND_API_KEY</div>
            <div className="cardLine">RESEND_FROM_EMAIL</div>
            <div className="cardLine">EMAIL_ENABLED=true</div>
          </div>
        </div>
      </section>
    </div>
  );
}

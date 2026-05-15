import React from "react";
import { apiFetch } from "../api";
import type { Quote, QuoteStatus } from "../types";

function statusLabel(status: QuoteStatus) {
  if (status === "draft") return "Being Prepared";
  if (status === "sent") return "Sent";
  if (status === "accepted") return "Accepted";
  if (status === "declined") return "Declined";
  if (status === "expired") return "Expired";
  return status;
}

function statusClass(status: QuoteStatus) {
  if (status === "draft") return "status-pending_admin_approval";
  if (status === "sent") return "status-approved";
  if (status === "accepted") return "status-paid";
  if (status === "declined") return "status-rejected";
  return `status-${status}`;
}

function buildGuruQuoteExplanation(quote: Quote) {
  const total = Number(quote.total || 0).toFixed(2);

  if (quote.status === "draft") {
    return `Quote #${quote.quoteNumber} is currently being prepared by NMD. The current total shown is $${total}, but this may still need final admin review before it is officially sent. Review the service type and wait for NMD to confirm the final version.`;
  }

  if (quote.status === "sent") {
    return `Quote #${quote.quoteNumber} has been sent or is ready for your review. The quoted total is $${total}. This is the amount NMD is presenting for the listed service scope unless changes are requested or the job details change.`;
  }

  if (quote.status === "accepted") {
    return `Quote #${quote.quoteNumber} has been accepted. The accepted total is $${total}. NMD may now convert this into an invoice, schedule the job, or continue the service workflow.`;
  }

  if (quote.status === "declined") {
    return `Quote #${quote.quoteNumber} was declined. The previous total was $${total}. You may need to request an updated quote or contact NMD if you want to revise the service scope.`;
  }

  if (quote.status === "expired") {
    return `Quote #${quote.quoteNumber} has expired. The old total was $${total}, but pricing may need to be reviewed again before NMD can honor or recreate the quote.`;
  }

  return `Quote #${quote.quoteNumber} has a current total of $${total}. Review the quote status and contact NMD if anything looks incorrect.`;
}

export default function ClientQuotesPage() {
  const [quotes, setQuotes] = React.useState<Quote[]>([]);
  const [filter, setFilter] = React.useState<"all" | QuoteStatus>("all");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [explanationQuoteId, setExplanationQuoteId] = React.useState<string | null>(null);

  const loadQuotes = React.useCallback(async () => {
    setError("");

    try {
      const data = await apiFetch<{ quotes: Quote[] }>("/api/client-quotes/my-quotes");
      setQuotes(data.quotes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load your quotes");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadQuotes();
  }, [loadQuotes]);

  const visibleQuotes = quotes.filter((quote) => {
    if (filter === "all") return true;
    return quote.status === filter;
  });

  const draftQuotes = quotes.filter((quote) => quote.status === "draft");
  const sentQuotes = quotes.filter((quote) => quote.status === "sent");
  const acceptedQuotes = quotes.filter((quote) => quote.status === "accepted");

  const totalQuoteValue = quotes.reduce((sum, quote) => sum + Number(quote.total || 0), 0);

  if (loading) {
    return (
      <section className="panel">
        <h2 className="panelTitle">My Quotes</h2>
        <div className="listCard">Loading your quotes...</div>
      </section>
    );
  }

  return (
    <div className="pageGrid">
      <section className="panel">
        <div className="panelHeader">
          <div>
            <h2 className="panelTitle">My Quotes</h2>
            <p className="brandSubtitle">
              View official NMD quotes connected to your account.
            </p>
          </div>
        </div>

        {error && <div className="errorBox">{error}</div>}

        <div className="listCard">
          Guru estimates are preliminary. Quotes shown here are the quote records NMD is preparing, sending, or reviewing.
        </div>

        <div className="statsGrid" style={{ marginTop: 16 }}>
          <div className="statCard">
            <div className="statLabel">Total Quotes</div>
            <div className="statValue">{quotes.length}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Being Prepared</div>
            <div className="statValue">{draftQuotes.length}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Sent</div>
            <div className="statValue">{sentQuotes.length}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Accepted</div>
            <div className="statValue">{acceptedQuotes.length}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Quote Value</div>
            <div className="statValue">${totalQuoteValue.toFixed(2)}</div>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panelHeader">
          <div>
            <h2 className="panelTitle">Quote History</h2>
            <p className="brandSubtitle">
              Official send/accept/payment actions will keep getting connected as the client portal expands.
            </p>
          </div>
        </div>

        <div className="buttonRow" style={{ marginBottom: 16 }}>
          <button
            className={filter === "all" ? "primaryButton" : "secondaryButton"}
            type="button"
            onClick={() => setFilter("all")}
          >
            All
          </button>

          <button
            className={filter === "draft" ? "primaryButton" : "secondaryButton"}
            type="button"
            onClick={() => setFilter("draft")}
          >
            Being Prepared
          </button>

          <button
            className={filter === "sent" ? "primaryButton" : "secondaryButton"}
            type="button"
            onClick={() => setFilter("sent")}
          >
            Sent
          </button>

          <button
            className={filter === "accepted" ? "primaryButton" : "secondaryButton"}
            type="button"
            onClick={() => setFilter("accepted")}
          >
            Accepted
          </button>

          <button
            className={filter === "declined" ? "primaryButton" : "secondaryButton"}
            type="button"
            onClick={() => setFilter("declined")}
          >
            Declined
          </button>
        </div>

        <div className="cardsGrid">
          {visibleQuotes.map((quote) => {
            const explanationOpen = explanationQuoteId === quote.id;

            return (
              <div key={quote.id} className="quoteCard">
                <div className="quoteTopRow">
                  <div className="quoteNumber">Quote #{quote.quoteNumber}</div>
                  <span className={`statusBadge ${statusClass(quote.status)}`}>
                    {statusLabel(quote.status)}
                  </span>
                </div>

                <div className="buttonRow" style={{ marginBottom: 12 }}>
                  <button
                    className="secondaryButton"
                    type="button"
                    onClick={() => setExplanationQuoteId(explanationOpen ? null : quote.id)}
                  >
                    {explanationOpen ? "Hide Guru Explanation" : "Ask Guru To Explain"}
                  </button>
                </div>

                {explanationOpen && (
                  <div className="assignBox" style={{ marginBottom: 12 }}>
                    <div className="assignTitle">Guru Explanation</div>
                    <div className="cardLine">{buildGuruQuoteExplanation(quote)}</div>
                  </div>
                )}

                <div className="cardLine">
                  <strong>Service:</strong> {quote.serviceType || "—"}
                </div>

                <div className="cardLine">
                  <strong>Total:</strong> ${Number(quote.total || 0).toFixed(2)}
                </div>

                <div className="cardLine">
                  <strong>Status:</strong> {statusLabel(quote.status)}
                </div>

                <div className="cardLine">
                  <strong>Created:</strong>{" "}
                  {quote.createdAt ? new Date(quote.createdAt).toLocaleString() : "—"}
                </div>

                <div className="listCard" style={{ marginTop: 10 }}>
                  {quote.status === "draft" &&
                    "NMD is preparing this quote. It is not final until officially sent."}
                  {quote.status === "sent" &&
                    "This quote has been sent or is ready for client review."}
                  {quote.status === "accepted" &&
                    "This quote has been accepted and may be converted into an invoice/job."}
                  {quote.status === "declined" && "This quote was declined."}
                  {quote.status === "expired" && "This quote has expired."}
                </div>
              </div>
            );
          })}

          {visibleQuotes.length === 0 && (
            <div className="listCard">No quotes found for this filter.</div>
          )}
        </div>
      </section>
    </div>
  );
}

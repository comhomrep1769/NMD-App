import React from "react";
import { apiFetch } from "../api";
import type { GuruEstimate, Invoice, PageKey, POSPayment, Quote } from "../types";

type DashboardPageProps = {
  quotes: Quote[];
  invoices: Invoice[];
  onNavigate: (page: PageKey) => void;
};

export default function DashboardPage({
  quotes,
  invoices,
  onNavigate
}: DashboardPageProps) {
  const [posPayments, setPosPayments] = React.useState<POSPayment[]>([]);
  const [guruEstimates, setGuruEstimates] = React.useState<GuruEstimate[]>([]);
  const [posError, setPosError] = React.useState("");
  const [guruError, setGuruError] = React.useState("");

  React.useEffect(() => {
    apiFetch<{ payments: POSPayment[] }>("/api/pos/payments")
      .then((data) => {
        setPosPayments(data.payments);
      })
      .catch((err) => {
        setPosError(err instanceof Error ? err.message : "Could not load POS alerts");
      });

    apiFetch<{ estimates: GuruEstimate[] }>("/api/guru/estimates")
      .then((data) => {
        setGuruEstimates(data.estimates);
      })
      .catch((err) => {
        setGuruError(err instanceof Error ? err.message : "Could not load Guru estimates");
      });
  }, []);

  const quotesSent = quotes.filter((quote) => quote.status === "sent").length;
  const quotesAccepted = quotes.filter((quote) => quote.status === "accepted").length;
  const invoicesSent = invoices.filter((invoice) => invoice.status === "unpaid").length;
  const invoicesPaid = invoices.filter((invoice) => invoice.status === "paid").length;

  const unpaidTotal = invoices
    .filter((invoice) => invoice.status === "unpaid")
    .reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);

  const paidTotal = invoices
    .filter((invoice) => invoice.status === "paid")
    .reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);

  const pendingCashPayments = posPayments.filter(
    (payment) => payment.status === "pending_admin_approval"
  );

  const pendingCashTotal = pendingCashPayments.reduce(
    (sum, payment) => sum + Number(payment.totalCollected || 0),
    0
  );

  const approvedPosPayments = posPayments.filter(
    (payment) => payment.status === "approved" || payment.status === "paid"
  );

  const approvedPosTotal = approvedPosPayments.reduce(
    (sum, payment) => sum + Number(payment.totalCollected || 0),
    0
  );

  const cardCollectedTotal = approvedPosPayments
    .filter((payment) => payment.paymentMethod === "card_link")
    .reduce((sum, payment) => sum + Number(payment.totalCollected || 0), 0);

  const cashCollectedTotal = approvedPosPayments
    .filter((payment) => payment.paymentMethod === "cash")
    .reduce((sum, payment) => sum + Number(payment.totalCollected || 0), 0);

  const salesTaxTrackedTotal = approvedPosPayments.reduce(
    (sum, payment) => sum + Number(payment.salesTaxAmount || 0),
    0
  );

  const guruNeedsReview = guruEstimates.filter(
    (estimate) => estimate.status === "needs_review"
  );

  const guruPotentialLow = guruNeedsReview.reduce(
    (sum, estimate) => sum + Number(estimate.preliminaryEstimateLow || 0),
    0
  );

  const guruPotentialHigh = guruNeedsReview.reduce(
    (sum, estimate) => sum + Number(estimate.preliminaryEstimateHigh || 0),
    0
  );

  const recentPendingCash = pendingCashPayments.slice(0, 4);
  const recentGuruEstimates = guruNeedsReview.slice(0, 4);

  return (
    <div className="pageGrid">
      <section className="panel">
        <div className="panelHeader">
          <div>
            <h2 className="panelTitle">Admin Dashboard</h2>
            <p className="brandSubtitle">
              NMD operations, Guru estimates, quoting, scheduling, payments, bookkeeping, and team controls.
            </p>
          </div>
        </div>

        {posError && <div className="errorBox">{posError}</div>}
        {guruError && <div className="errorBox">{guruError}</div>}

        {guruNeedsReview.length > 0 && (
          <div className="errorBox">
            {guruNeedsReview.length} Guru estimate
            {guruNeedsReview.length === 1 ? "" : "s"} need review.
            Potential range: ${guruPotentialLow.toFixed(2)} - ${guruPotentialHigh.toFixed(2)}
          </div>
        )}

        {pendingCashPayments.length > 0 && (
          <div className="errorBox">
            {pendingCashPayments.length} cash payment
            {pendingCashPayments.length === 1 ? "" : "s"} need admin approval.
            Pending total: ${pendingCashTotal.toFixed(2)}
          </div>
        )}

        <div className="statsGrid">
          <div className="statCard">
            <div className="statLabel">Guru Estimates</div>
            <div className="statValue">{guruNeedsReview.length}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Guru Potential High</div>
            <div className="statValue">${guruPotentialHigh.toFixed(2)}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Quotes Sent</div>
            <div className="statValue">{quotesSent}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Quotes Accepted</div>
            <div className="statValue">{quotesAccepted}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Invoices Sent</div>
            <div className="statValue">{invoicesSent}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Invoices Paid</div>
            <div className="statValue">{invoicesPaid}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Unpaid Balance</div>
            <div className="statValue">${unpaidTotal.toFixed(2)}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Paid Collected</div>
            <div className="statValue">${paidTotal.toFixed(2)}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Pending Cash Approval</div>
            <div className="statValue">{pendingCashPayments.length}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Pending Cash Total</div>
            <div className="statValue">${pendingCashTotal.toFixed(2)}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">POS Collected</div>
            <div className="statValue">${approvedPosTotal.toFixed(2)}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Sales Tax Tracked</div>
            <div className="statValue">${salesTaxTrackedTotal.toFixed(2)}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Card Collected</div>
            <div className="statValue">${cardCollectedTotal.toFixed(2)}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Cash Approved</div>
            <div className="statValue">${cashCollectedTotal.toFixed(2)}</div>
          </div>
        </div>
      </section>

      {guruNeedsReview.length > 0 && (
        <section className="panel">
          <div className="panelHeader">
            <div>
              <h2 className="panelTitle">Guru Estimates Need Review</h2>
              <p className="brandSubtitle">
                Client preliminary estimates created through Guru.
              </p>
            </div>

            <button
              className="primaryButton"
              type="button"
              onClick={() => onNavigate("guru-estimates")}
            >
              Review Estimates
            </button>
          </div>

          <div className="cardsGrid">
            {recentGuruEstimates.map((estimate) => (
              <button
                key={estimate.id}
                className="quoteCard"
                type="button"
                onClick={() => onNavigate("guru-estimates")}
                style={{ textAlign: "left" }}
              >
                <div className="quoteTopRow">
                  <div className="quoteNumber">{estimate.clientName || "Client"}</div>
                  <span className="statusBadge status-pending_admin_approval">
                    Needs Review
                  </span>
                </div>

                <div className="cardLine">
                  <strong>Service:</strong> {estimate.serviceType || "—"}
                </div>

                <div className="cardLine">
                  <strong>Range:</strong> ${estimate.preliminaryEstimateLow.toFixed(2)} - $
                  {estimate.preliminaryEstimateHigh.toFixed(2)}
                </div>

                <div className="cardLine">
                  <strong>Address:</strong> {estimate.address || "—"}
                </div>

                <div className="cardLine">
                  <strong>Submitted:</strong>{" "}
                  {estimate.createdAt ? new Date(estimate.createdAt).toLocaleString() : "—"}
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {pendingCashPayments.length > 0 && (
        <section className="panel">
          <div className="panelHeader">
            <div>
              <h2 className="panelTitle">Cash Approval Alerts</h2>
              <p className="brandSubtitle">
                Review cash photo proof and approve or reject submitted cash collections.
              </p>
            </div>

            <button className="primaryButton" type="button" onClick={() => onNavigate("pos")}>
              Review POS
            </button>
          </div>

          <div className="cardsGrid">
            {recentPendingCash.map((payment) => (
              <button
                key={payment.id}
                className="quoteCard"
                type="button"
                onClick={() => onNavigate("pos")}
                style={{ textAlign: "left" }}
              >
                <div className="quoteTopRow">
                  <div className="quoteNumber">{payment.clientName}</div>
                  <span className="statusBadge status-pending_admin_approval">
                    Pending
                  </span>
                </div>

                <div className="cardLine">
                  <strong>Total:</strong> ${payment.totalCollected.toFixed(2)}
                </div>

                <div className="cardLine">
                  <strong>Sales Tax:</strong> ${payment.salesTaxAmount.toFixed(2)}
                </div>

                <div className="cardLine">
                  <strong>Collected By:</strong> {payment.collectedByName || "—"}
                </div>

                <div className="cardLine">
                  <strong>Submitted:</strong>{" "}
                  {payment.createdAt ? new Date(payment.createdAt).toLocaleString() : "—"}
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="panel">
        <h2 className="panelTitle">Operations</h2>

        <div className="cardsGrid">
          <button
            className="quoteCard"
            type="button"
            onClick={() => onNavigate("guru-estimates")}
            style={{ textAlign: "left" }}
          >
            <div className="quoteNumber">Guru Estimates</div>
            <div className="cardLine">
              Review client Guru estimate requests, approve details, and prepare official quotes.
            </div>
            {guruNeedsReview.length > 0 && (
              <div className="errorBox" style={{ marginTop: 10 }}>
                {guruNeedsReview.length} estimate review pending
              </div>
            )}
          </button>

          <button
            className="quoteCard"
            type="button"
            onClick={() => onNavigate("schedule")}
            style={{ textAlign: "left" }}
          >
            <div className="quoteNumber">Jobs & Schedule</div>
            <div className="cardLine">
              View scheduled jobs, employee schedules, recurring jobs, and service calendar.
            </div>
          </button>

          <button
            className="quoteCard"
            type="button"
            onClick={() => onNavigate("clients")}
            style={{ textAlign: "left" }}
          >
            <div className="quoteNumber">Clients & Requests</div>
            <div className="cardLine">
              Manage clients, quote requests, uploaded photos, waiver signatures, and intake details.
            </div>
          </button>

          <button
            className="quoteCard"
            type="button"
            onClick={() => onNavigate("quotes")}
            style={{ textAlign: "left" }}
          >
            <div className="quoteNumber">Quotes & Invoices</div>
            <div className="cardLine">
              Create quotes, convert accepted quotes, send invoices, track payments, and manage pricing.
            </div>
          </button>

          <button
            className="quoteCard"
            type="button"
            onClick={() => onNavigate("expenses")}
            style={{ textAlign: "left" }}
          >
            <div className="quoteNumber">Bookkeeping</div>
            <div className="cardLine">
              Expenses, mileage, reimbursements, payroll prep, tax tracking, cash flow, and profit/loss.
            </div>
          </button>

          <button
            className="quoteCard"
            type="button"
            onClick={() => onNavigate("employees")}
            style={{ textAlign: "left" }}
          >
            <div className="quoteNumber">Team</div>
            <div className="cardLine">
              Employees, pay rates, time clock, availability, equipment, schedules, and performance.
            </div>
          </button>

          <button
            className="quoteCard"
            type="button"
            onClick={() => onNavigate("treatments")}
            style={{ textAlign: "left" }}
          >
            <div className="quoteNumber">Knowledge Base</div>
            <div className="cardLine">
              Treatments, chemical guidance, tips, surface warnings, ratios, and field notes.
            </div>
          </button>

          <button
            className="quoteCard"
            type="button"
            onClick={() => onNavigate("pos")}
            style={{ textAlign: "left" }}
          >
            <div className="quoteNumber">Payments / POS</div>
            <div className="cardLine">
              Card payment links, cash tracking, cash proof approval, sales tax tracking, and future Tap to Pay.
            </div>
            {pendingCashPayments.length > 0 && (
              <div className="errorBox" style={{ marginTop: 10 }}>
                {pendingCashPayments.length} cash approval pending
              </div>
            )}
          </button>

          <button
            className="quoteCard"
            type="button"
            onClick={() => onNavigate("chat")}
            style={{ textAlign: "left" }}
          >
            <div className="quoteNumber">Chat</div>
            <div className="cardLine">
              Company chat, admin-employee chats, client messages, unread alerts, archive/delete controls.
            </div>
          </button>

          <button
            className="quoteCard"
            type="button"
            onClick={() => onNavigate("email")}
            style={{ textAlign: "left" }}
          >
            <div className="quoteNumber">Settings</div>
            <div className="cardLine">
              Email test, app setup, notification checks, and future admin configuration.
            </div>
          </button>
        </div>
      </section>
    </div>
  );
}

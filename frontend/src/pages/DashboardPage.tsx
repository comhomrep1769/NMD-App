import React from "react";
import { apiFetch } from "../api";
import type { Invoice, PageKey, POSPayment, Quote } from "../types";

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
  const [posError, setPosError] = React.useState("");

  React.useEffect(() => {
    apiFetch<{ payments: POSPayment[] }>("/api/pos/payments")
      .then((data) => {
        setPosPayments(data.payments);
      })
      .catch((err) => {
        setPosError(err instanceof Error ? err.message : "Could not load POS alerts");
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

  const recentPendingCash = pendingCashPayments.slice(0, 4);

  return (
    <div className="pageGrid">
      <section className="panel">
        <div className="panelHeader">
          <div>
            <h2 className="panelTitle">Admin Dashboard</h2>
            <p className="brandSubtitle">
              NMD operations, quoting, scheduling, payments, bookkeeping, and team controls.
            </p>
          </div>
        </div>

        {posError && <div className="errorBox">{posError}</div>}

        {pendingCashPayments.length > 0 && (
          <div className="errorBox">
            {pendingCashPayments.length} cash payment
            {pendingCashPayments.length === 1 ? "" : "s"} need admin approval.
            Pending total: ${pendingCashTotal.toFixed(2)}
          </div>
        )}

        <div className="statsGrid">
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

      <section className="panel">
        <h2 className="panelTitle">Payment Collection Workflow</h2>

        <div className="cardsGrid">
          <div className="quoteCard">
            <div className="quoteNumber">After Service Completion</div>
            <div className="cardLine">
              Admin or employee can collect payment after invoice is sent.
            </div>
          </div>

          <div className="quoteCard">
            <div className="quoteNumber">Email Payment Link</div>
            <div className="cardLine">
              Client receives a Stripe invoice/payment link by email.
            </div>
          </div>

          <div className="quoteCard">
            <div className="quoteNumber">Cash</div>
            <div className="cardLine">
              Employee records cash collected and uploads a photo for admin approval.
            </div>
          </div>

          <div className="quoteCard">
            <div className="quoteNumber">Tap To Pay</div>
            <div className="cardLine">
              Future Stripe Terminal layer for debit/credit card contactless payments.
            </div>
          </div>

          <div className="quoteCard">
            <div className="quoteNumber">Sales Tax</div>
            <div className="cardLine">
              Tax tracking feeds quotes, invoices, POS records, bookkeeping, and reports.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

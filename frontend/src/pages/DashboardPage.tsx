import React from "react";
import type { Invoice, PageKey, Quote } from "../types";

export default function DashboardPage({
  quotes,
  invoices,
  onNavigate
}: {
  quotes: Quote[];
  invoices: Invoice[];
  onNavigate: (page: PageKey) => void;
}) {
  const quotesSent = quotes.filter((quote) => quote.status === "sent").length;
  const quotesAccepted = quotes.filter((quote) => quote.status === "accepted").length;
  const invoicesSent = invoices.filter((invoice) => invoice.status === "sent").length;
  const invoicesPaid = invoices.filter((invoice) => invoice.status === "paid").length;

  const totalQuoteValue = quotes.reduce((sum, quote) => sum + Number(quote.total || 0), 0);
  const totalInvoiceValue = invoices.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);
  const paidInvoiceValue = invoices
    .filter((invoice) => invoice.status === "paid")
    .reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);

  return (
    <div className="pageGrid">
      <section className="panel">
        <div className="panelHeader">
          <div>
            <h2 className="panelTitle">Admin Dashboard</h2>
            <p className="brandSubtitle">
              NMD operations overview for quotes, invoices, Guru estimates, scheduling, payments, and job management.
            </p>
          </div>
        </div>

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
            <div className="statLabel">Quote Value</div>
            <div className="statValue">${totalQuoteValue.toFixed(2)}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Invoice Value</div>
            <div className="statValue">${totalInvoiceValue.toFixed(2)}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Paid Collected</div>
            <div className="statValue">${paidInvoiceValue.toFixed(2)}</div>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panelHeader">
          <div>
            <h2 className="panelTitle">Guru Operations Center</h2>
            <p className="brandSubtitle">
              Use Guru shortcuts to move faster through estimates, quoting, pricing, payments, and scheduling.
            </p>
          </div>
        </div>

        <div className="cardsGrid">
          <button
            className="quoteCard"
            type="button"
            onClick={() => onNavigate("guru-estimates")}
            style={{ textAlign: "left", cursor: "pointer" }}
          >
            <div className="quoteTopRow">
              <div className="quoteNumber">Guru Estimate Review</div>
              <span className="statusBadge status-pending_admin_approval">Review</span>
            </div>
            <div className="cardLine">
              Review client Guru estimates, uploaded photos, risk notes, preliminary ranges, and convert approved requests into quote drafts.
            </div>
          </button>

          <button
            className="quoteCard"
            type="button"
            onClick={() => onNavigate("quotes")}
            style={{ textAlign: "left", cursor: "pointer" }}
          >
            <div className="quoteTopRow">
              <div className="quoteNumber">Quotes</div>
              <span className="statusBadge status-approved">Draft / Send</span>
            </div>
            <div className="cardLine">
              Create, review, edit, and send official quote documents after Guru estimate intake.
            </div>
          </button>

          <button
            className="quoteCard"
            type="button"
            onClick={() => onNavigate("pricing")}
            style={{ textAlign: "left", cursor: "pointer" }}
          >
            <div className="quoteTopRow">
              <div className="quoteNumber">Pricing Reference</div>
              <span className="statusBadge status-paid">Admin Only</span>
            </div>
            <div className="cardLine">
              Open NMD Job Pricing references for service minimums, square-foot pricing, specialty restoration, and quote guidance.
            </div>
          </button>

          <button
            className="quoteCard"
            type="button"
            onClick={() => onNavigate("pos")}
            style={{ textAlign: "left", cursor: "pointer" }}
          >
            <div className="quoteTopRow">
              <div className="quoteNumber">Payments / POS</div>
              <span className="statusBadge status-approved">Collect</span>
            </div>
            <div className="cardLine">
              Record cash payments, access Stripe payment flows, and prepare future Tap to Pay/card collection workflows.
            </div>
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="panelHeader">
          <div>
            <h2 className="panelTitle">Quick Actions</h2>
            <p className="brandSubtitle">
              Common admin actions grouped for faster desktop and mobile use.
            </p>
          </div>
        </div>

        <div className="buttonRow">
          <button className="primaryButton" type="button" onClick={() => onNavigate("clients")}>
            Clients
          </button>

          <button className="secondaryButton" type="button" onClick={() => onNavigate("schedule")}>
            Schedule
          </button>

          <button className="secondaryButton" type="button" onClick={() => onNavigate("invoices")}>
            Invoices
          </button>

          <button className="secondaryButton" type="button" onClick={() => onNavigate("employees")}>
            Employees
          </button>

          <button className="secondaryButton" type="button" onClick={() => onNavigate("expenses")}>
            Expenses
          </button>

          <button className="secondaryButton" type="button" onClick={() => onNavigate("mileage")}>
            Mileage
          </button>

          <button className="secondaryButton" type="button" onClick={() => onNavigate("recurring")}>
            Recurring
          </button>

          <button className="secondaryButton" type="button" onClick={() => onNavigate("treatments")}>
            Treatments
          </button>
        </div>
      </section>
    </div>
  );
}

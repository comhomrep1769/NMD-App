import React from "react";
import type { AuthUserRole, Invoice, PageKey, Quote } from "../types";

function isSuperAdmin(role?: AuthUserRole) {
  return role === "superadmin";
}

export default function DashboardPage({
  quotes,
  invoices,
  onNavigate,
  role = "admin"
}: {
  quotes: Quote[];
  invoices: Invoice[];
  onNavigate: (page: PageKey) => void;
  role?: AuthUserRole;
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

  const ownerMode = isSuperAdmin(role);

  return (
    <div className="pageGrid">
      <section className="panel">
        <div className="panelHeader">
          <div>
            <h2 className="panelTitle">
              {ownerMode ? "Super Admin Dashboard" : "Admin Dashboard"}
            </h2>
            <p className="brandSubtitle">
              {ownerMode
                ? "Owner-level NMD overview for operations, Guru estimates, cash flow, teams, pricing, payments, and business controls."
                : "NMD operations overview for quotes, invoices, Guru estimates, scheduling, payments, and job management."}
            </p>
          </div>
        </div>

        {ownerMode && (
          <div className="listCard" style={{ marginBottom: 16 }}>
            Super Admin has owner-level visibility across admins, employees, clients, estimates,
            quotes, invoices, schedules, payments, expenses, mileage, recurring services, and Guru workflows.
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

          {ownerMode && (
            <div className="statCard">
              <div className="statLabel">Owner Mode</div>
              <div className="statValue">Active</div>
            </div>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panelHeader">
          <div>
            <h2 className="panelTitle">
              {ownerMode ? "Owner Guru Operations Center" : "Guru Operations Center"}
            </h2>
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
              <span className="statusBadge status-pending_admin_approval">
                {ownerMode ? "Owner Review" : "Review"}
              </span>
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
              <span className="statusBadge status-paid">
                {ownerMode ? "Owner Control" : "Admin Only"}
              </span>
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

          {ownerMode && (
            <>
              <button
                className="quoteCard"
                type="button"
                onClick={() => onNavigate("expenses")}
                style={{ textAlign: "left", cursor: "pointer" }}
              >
                <div className="quoteTopRow">
                  <div className="quoteNumber">Owner Bookkeeping</div>
                  <span className="statusBadge status-approved">Expenses</span>
                </div>
                <div className="cardLine">
                  Review expense records, reimbursement categories, receipts, notes, and business cost tracking.
                </div>
              </button>

              <button
                className="quoteCard"
                type="button"
                onClick={() => onNavigate("employees")}
                style={{ textAlign: "left", cursor: "pointer" }}
              >
                <div className="quoteTopRow">
                  <div className="quoteNumber">Team Control</div>
                  <span className="statusBadge status-paid">Permissions</span>
                </div>
                <div className="cardLine">
                  Manage employees, admins, pay rates, date joined, role visibility, and future Super Admin permissions.
                </div>
              </button>
            </>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panelHeader">
          <div>
            <h2 className="panelTitle">Quick Actions</h2>
            <p className="brandSubtitle">
              Common {ownerMode ? "owner and admin" : "admin"} actions grouped for faster desktop and mobile use.
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

          {ownerMode && (
            <>
              <button className="secondaryButton" type="button" onClick={() => onNavigate("payroll")}>
                Payroll
              </button>

              <button className="secondaryButton" type="button" onClick={() => onNavigate("email")}>
                Email Test
              </button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

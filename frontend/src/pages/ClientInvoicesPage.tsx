import React from "react";

const invoiceCards = [
  {
    title: "Unpaid Invoices",
    value: "0",
    text: "Invoices needing payment will show here with secure payment links."
  },
  {
    title: "Paid Invoices",
    value: "0",
    text: "Completed payments and invoice history."
  },
  {
    title: "Fees / Adjustments",
    value: "0",
    text: "Cancellation, rescheduling, or additional approved fee invoices."
  }
];

export default function ClientInvoicesPage() {
  return (
    <div className="pageGrid">
      <section className="clientHeroPanel">
        <div className="clientHeroContent">
          <span className="clientEyebrow">My Invoices</span>
          <h1>Review invoices and payment status.</h1>
          <p>
            Client invoices will show final service totals, tax/fees when applicable,
            due status, payment links, and paid history.
          </p>

          <div className="clientHeroActions">
            <a className="primaryButton" href="/client/request-service">
              Request New Service
            </a>
            <a className="secondaryButton" href="/client">
              Back to Client Portal
            </a>
          </div>
        </div>

        <div className="clientStatusCard">
          <div className="statLabel">Payments</div>
          <div className="clientStatusTitle">Stripe-ready workflow</div>
          <p>
            Final invoices can connect to Stripe payment links, cash records, and admin
            payment approval workflows.
          </p>
        </div>
      </section>

      <section className="panel">
        <div className="statsGrid">
          {invoiceCards.map((item) => (
            <div key={item.title} className="statCard">
              <div className="statLabel">{item.title}</div>
              <div className="statValue">{item.value}</div>
              <p className="cardLine">{item.text}</p>
            </div>
          ))}
        </div>

        <div className="listCard">
          No client invoices are loaded yet. Invoice records will connect to the admin
          invoice builder, PDF template, Stripe payment links, and payment history.
        </div>
      </section>
    </div>
  );
}

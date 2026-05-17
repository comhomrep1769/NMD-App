import React from "react";
import PhotoGalleryPanel from "../components/PhotoGalleryPanel";

const invoiceStats = [
  {
    title: "Invoices Sent",
    value: "0",
    text: "Invoices delivered to clients."
  },
  {
    title: "Invoices Paid",
    value: "0",
    text: "Paid invoices and completed payment records."
  },
  {
    title: "Unpaid",
    value: "0",
    text: "Invoices still awaiting payment."
  },
  {
    title: "Cash Payments",
    value: "0",
    text: "Cash records needing photo proof/admin approval."
  }
];

const invoiceWorkflowCards = [
  {
    title: "Separate Invoice PDF",
    text: "Invoice documents should be separate from quotes and labeled INVOICE."
  },
  {
    title: "Stripe Payment Links",
    text: "Final invoices can include secure Stripe card payment links."
  },
  {
    title: "Cash Recording",
    text: "Cash payments can be recorded with employee photo proof and admin approval."
  },
  {
    title: "Tax + Fees",
    text: "State/local tax, service-based taxability, card fees, cancellation fees, and totals should calculate before sending."
  }
];

export default function InvoicesPage() {
  return (
    <div className="pageGrid">
      <section className="clientHeroPanel">
        <div className="clientHeroContent">
          <span className="clientEyebrow">Invoices</span>
          <h1>Create, send, collect, and track final invoices.</h1>
          <p>
            Invoices should include final job pricing, tax, payment method, Stripe
            payment links, paid/unpaid status, cash proof, PDF download, and client
            email delivery.
          </p>

          <div className="clientHeroActions">
            <a className="primaryButton" href="/quotes">
              Quotes
            </a>
            <a className="secondaryButton" href="/clients">
              Clients
            </a>
            <a className="secondaryButton" href="/photos">
              Payment Photos
            </a>
          </div>
        </div>

        <div className="clientStatusCard">
          <div className="statLabel">Invoice Template</div>
          <div className="clientStatusTitle">INVOICE only</div>
          <p>
            Invoice and quote documents stay separate. Invoices are final job billing
            records and can connect to Stripe.
          </p>
        </div>
      </section>

      <section className="panel">
        <div className="statsGrid">
          {invoiceStats.map((stat) => (
            <div key={stat.title} className="statCard">
              <div className="statLabel">{stat.title}</div>
              <div className="statValue">{stat.value}</div>
              <p className="cardLine">{stat.text}</p>
            </div>
          ))}
        </div>

        <div className="cardsGrid" style={{ marginTop: 16 }}>
          {invoiceWorkflowCards.map((card) => (
            <article key={card.title} className="quoteCard">
              <div className="quoteNumber">{card.title}</div>
              <p className="cardLine">{card.text}</p>
            </article>
          ))}
        </div>

        <div className="listCard">
          Invoice builder backend and PDF rendering will connect here next: Save Draft,
          Preview PDF, Send Invoice, Download PDF, Stripe payment link, cash proof,
          tax/fee calculations, and payment status.
        </div>
      </section>

      <PhotoGalleryPanel
        role="admin"
        title="Invoice / Payment Photo Records"
        subtitle="Review cash payment proof, job completion photos, and invoice-related records."
      />
    </div>
  );
}

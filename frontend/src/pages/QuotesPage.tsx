import React from "react";
import PhotoGalleryPanel from "../components/PhotoGalleryPanel";

const quoteStats = [
  {
    title: "Quotes Sent",
    value: "0",
    text: "Official quotes emailed or sent to clients."
  },
  {
    title: "Quotes Accepted",
    value: "0",
    text: "Quotes accepted by clients and ready for scheduling/invoicing."
  },
  {
    title: "Draft Quotes",
    value: "0",
    text: "Saved quote drafts waiting for admin review."
  },
  {
    title: "Needs Follow-Up",
    value: "0",
    text: "Quotes that may need Guru/client follow-up."
  }
];

const quoteWorkflowCards = [
  {
    title: "Live Quote Preview",
    text: "Admin quote inputs should update the actual customer-facing quote template in real time."
  },
  {
    title: "Separate Quote PDF",
    text: "Quote documents should be separate from invoices and labeled QUOTE."
  },
  {
    title: "Send Quote",
    text: "Send quote emails separately from invoices using the Send Quote action."
  },
  {
    title: "Convert to Invoice",
    text: "Accepted quotes should convert into invoices without losing the quote record."
  }
];

export default function QuotesPage() {
  return (
    <div className="pageGrid">
      <section className="clientHeroPanel">
        <div className="clientHeroContent">
          <span className="clientEyebrow">Quotes</span>
          <h1>Create, preview, send, and track customer quotes.</h1>
          <p>
            Quotes should include client information, job details, services, treatments,
            notes, pricing, tax, totals, PDF preview, email sending, and conversion into
            invoices after approval.
          </p>

          <div className="clientHeroActions">
            <a className="primaryButton" href="/requests">
              Review Requests
            </a>
            <a className="secondaryButton" href="/clients">
              Clients
            </a>
            <a className="secondaryButton" href="/invoices">
              Invoices
            </a>
          </div>
        </div>

        <div className="clientStatusCard">
          <div className="statLabel">Quote Template</div>
          <div className="clientStatusTitle">QUOTE only</div>
          <p>
            Quote and invoice templates stay separate. Quotes are not invoices until
            accepted and converted.
          </p>
        </div>
      </section>

      <section className="panel">
        <div className="statsGrid">
          {quoteStats.map((stat) => (
            <div key={stat.title} className="statCard">
              <div className="statLabel">{stat.title}</div>
              <div className="statValue">{stat.value}</div>
              <p className="cardLine">{stat.text}</p>
            </div>
          ))}
        </div>

        <div className="cardsGrid" style={{ marginTop: 16 }}>
          {quoteWorkflowCards.map((card) => (
            <article key={card.title} className="quoteCard">
              <div className="quoteNumber">{card.title}</div>
              <p className="cardLine">{card.text}</p>
            </article>
          ))}
        </div>

        <div className="listCard">
          Quote builder backend and PDF rendering will connect here next: Save Draft,
          Preview PDF, Send Quote, Download PDF, tax calculation, and quote-to-invoice conversion.
        </div>
      </section>

      <PhotoGalleryPanel
        role="admin"
        title="Quote Photo References"
        subtitle="Use client photos and job-site images to support quote review and pricing decisions."
      />
    </div>
  );
}

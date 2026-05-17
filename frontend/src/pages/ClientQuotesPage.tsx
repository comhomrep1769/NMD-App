import React from "react";

const quoteCards = [
  {
    title: "Pending Quotes",
    value: "0",
    text: "Quotes waiting for review or customer approval."
  },
  {
    title: "Accepted Quotes",
    value: "0",
    text: "Quotes accepted and ready to schedule or convert to invoice."
  },
  {
    title: "Expired / Archived",
    value: "0",
    text: "Past quotes kept for client history and admin records."
  }
];

export default function ClientQuotesPage() {
  return (
    <div className="pageGrid">
      <section className="clientHeroPanel">
        <div className="clientHeroContent">
          <span className="clientEyebrow">My Quotes</span>
          <h1>Review your NMD quotes.</h1>
          <p>
            Official quotes will show service details, pricing, notes, waiver requirements,
            tax/fees when applicable, and approval actions.
          </p>

          <div className="clientHeroActions">
            <a className="primaryButton" href="/client/request-service">
              Request Quote
            </a>
            <a className="secondaryButton" href="/client">
              Client Portal
            </a>
          </div>
        </div>

        <div className="clientStatusCard">
          <div className="statLabel">Quote Workflow</div>
          <div className="clientStatusTitle">Estimate → Quote → Invoice</div>
          <p>
            NMD estimates are reviewed by admin before an official quote is sent.
          </p>
        </div>
      </section>

      <section className="panel">
        <div className="statsGrid">
          {quoteCards.map((item) => (
            <div key={item.title} className="statCard">
              <div className="statLabel">{item.title}</div>
              <div className="statValue">{item.value}</div>
              <p className="cardLine">{item.text}</p>
            </div>
          ))}
        </div>

        <div className="listCard">
          No client quotes are loaded yet. Quotes will connect to the admin quote builder,
          PDF preview, email sending, and quote-to-invoice conversion.
        </div>
      </section>
    </div>
  );
}

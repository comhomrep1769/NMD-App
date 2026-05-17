import React from "react";

const estimateStatuses = [
  {
    title: "Draft Estimate",
    text: "Client requests and Guru-assisted estimates will appear here before admin review.",
    value: "0"
  },
  {
    title: "Needs Review",
    text: "Estimates waiting for Admin or Super Admin approval.",
    value: "0"
  },
  {
    title: "Converted to Quote",
    text: "Approved estimates converted into formal quotes.",
    value: "0"
  }
];

export default function ClientEstimatesPage() {
  return (
    <div className="pageGrid">
      <section className="clientHeroPanel">
        <div className="clientHeroContent">
          <span className="clientEyebrow">Client Estimates</span>
          <h1>Preliminary estimates before official quotes.</h1>
          <p>
            Estimates help NMD understand the service, surface, staining, access,
            photos, and scheduling needs before creating an official quote.
          </p>

          <div className="clientHeroActions">
            <a className="primaryButton" href="/client/request-service">
              Request New Estimate
            </a>
            <a className="secondaryButton" href="/client">
              Back to Client Portal
            </a>
          </div>
        </div>

        <div className="clientStatusCard">
          <div className="statLabel">Important</div>
          <div className="clientStatusTitle">Estimates are preliminary</div>
          <p>
            Final pricing is confirmed after admin review, quote approval, photos,
            site details, and any required waiver acknowledgments.
          </p>
        </div>
      </section>

      <section className="panel">
        <div className="statsGrid">
          {estimateStatuses.map((item) => (
            <div key={item.title} className="statCard">
              <div className="statLabel">{item.title}</div>
              <div className="statValue">{item.value}</div>
              <p className="cardLine">{item.text}</p>
            </div>
          ))}
        </div>

        <div className="listCard">
          No client estimates are loaded yet. Estimate records will connect to Guru intake,
          uploaded photos, service request details, admin review, and quote conversion.
        </div>
      </section>
    </div>
  );
}

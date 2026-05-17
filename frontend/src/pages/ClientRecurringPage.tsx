import React from "react";

const recurringServices = [
  {
    title: "Trash Can Cleaning",
    cadence: "Monthly",
    price: "$10/month target",
    text: "Recurring trash/garbage can cleaning subscription with automatic reminders and future billing support."
  },
  {
    title: "Exterior Maintenance",
    cadence: "Monthly / Quarterly",
    price: "Custom",
    text: "Recurring home exterior maintenance for house washing, driveway cleaning, patio cleaning, or roof checkups."
  },
  {
    title: "Commercial Maintenance",
    cadence: "Weekly / Monthly",
    price: "Custom",
    text: "Recurring storefront, sidewalk, drive-thru, dumpster pad, or property management cleaning."
  }
];

export default function ClientRecurringPage() {
  return (
    <div className="pageGrid">
      <section className="clientHeroPanel">
        <div className="clientHeroContent">
          <span className="clientEyebrow">My Recurring Services</span>
          <h1>Keep your service on schedule.</h1>
          <p>
            Manage recurring cleaning options, request subscription-style services, and
            track upcoming maintenance visits from the client portal.
          </p>

          <div className="clientHeroActions">
            <a className="primaryButton" href="/client/request-service">
              Request Recurring Service
            </a>
            <a className="secondaryButton" href="/client">
              Client Portal
            </a>
          </div>
        </div>

        <div className="clientStatusCard">
          <div className="statLabel">Recurring Control</div>
          <div className="clientStatusTitle">Opt in / opt out</div>
          <p>
            Clients should be able to opt into recurring service and opt out any time,
            with clear scheduling and billing controls.
          </p>
        </div>
      </section>

      <section className="panel">
        <div className="cardsGrid">
          {recurringServices.map((service) => (
            <article key={service.title} className="quoteCard">
              <div className="quoteTopRow">
                <div>
                  <div className="quoteNumber">{service.title}</div>
                  <div className="cardLine">{service.cadence}</div>
                </div>

                <span className="statusBadge status-approved">{service.price}</span>
              </div>

              <p className="cardLine">{service.text}</p>

              <div className="buttonRow" style={{ marginTop: 12 }}>
                <a className="secondaryButton" href="/client/request-service">
                  Request Setup
                </a>
              </div>
            </article>
          ))}
        </div>

        <div className="listCard">
          No active recurring services are loaded yet. Future recurring records should
          connect to scheduling, reminders, Stripe billing, and client opt-out controls.
        </div>
      </section>
    </div>
  );
}

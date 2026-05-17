import React from "react";

const recurringOptions = [
  {
    title: "Trash Can Cleaning",
    price: "$10/month starting target",
    text: "Recurring trash/garbage can cleaning subscription. Final pricing can be adjusted after market review."
  },
  {
    title: "Monthly Exterior Maintenance",
    price: "Custom",
    text: "Recurring house, driveway, walkway, storefront, HOA, or commercial maintenance."
  },
  {
    title: "Commercial Maintenance",
    price: "Custom",
    text: "Scheduled cleaning for storefronts, sidewalks, dumpster pads, drive-thrus, and property managers."
  }
];

export default function RecurringPage() {
  return (
    <div className="pageGrid">
      <section className="clientHeroPanel">
        <div className="clientHeroContent">
          <span className="clientEyebrow">Recurring Services</span>
          <h1>Keep your property on a cleaning schedule.</h1>
          <p>
            Recurring services help clients avoid buildup, keep curb appeal, and schedule
            cleaning before surfaces become heavily stained.
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
          <div className="statLabel">Subscription Control</div>
          <div className="clientStatusTitle">Opt in or out</div>
          <p>
            Clients should be able to opt into automatic scheduling and billing, with
            the ability to opt out at any time.
          </p>
        </div>
      </section>

      <section className="panel">
        <div className="cardsGrid">
          {recurringOptions.map((item) => (
            <article key={item.title} className="quoteCard">
              <div className="quoteTopRow">
                <div className="quoteNumber">{item.title}</div>
                <span className="statusBadge status-approved">{item.price}</span>
              </div>

              <p className="cardLine">{item.text}</p>

              <div className="buttonRow" style={{ marginTop: 12 }}>
                <a className="secondaryButton" href="/client/request-service">
                  Request Option
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

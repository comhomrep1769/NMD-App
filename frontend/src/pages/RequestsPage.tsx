import React from "react";
import PhotoGalleryPanel from "../components/PhotoGalleryPanel";

const requestStats = [
  {
    title: "New Requests",
    value: "0",
    text: "Client requests waiting for admin review."
  },
  {
    title: "Photo Supported",
    value: "0",
    text: "Requests containing uploaded property photos."
  },
  {
    title: "Needs Quote",
    value: "0",
    text: "Reviewed requests ready for quote creation."
  },
  {
    title: "High Review",
    value: "0",
    text: "Requests with treatment, roof, oxidation, rust, or liability risk."
  }
];

const reviewCards = [
  {
    title: "Surface / Stain Review",
    text: "Identify concrete, roof, siding, pavers, wood, rust, oil, oxidation, or specialty treatment needs."
  },
  {
    title: "Photo Review",
    text: "Review property photos, close-up stains, access issues, and pre-existing damage notes."
  },
  {
    title: "Scheduling Review",
    text: "Review preferred dates, job duration, travel route, weather, and employee availability."
  },
  {
    title: "Quote Preparation",
    text: "Convert approved requests into quote drafts with treatment notes, pricing, tax, and client disclaimers."
  }
];

export default function RequestsPage() {
  return (
    <div className="pageGrid">
      <section className="clientHeroPanel">
        <div className="clientHeroContent">
          <span className="clientEyebrow">Service Requests</span>
          <h1>Review client requests before quotes and scheduling.</h1>
          <p>
            Admins can review client service details, property photos, preferred
            scheduling, treatment needs, liability concerns, and convert requests into
            estimates, quotes, or scheduled jobs.
          </p>

          <div className="clientHeroActions">
            <a className="primaryButton" href="/quotes">
              Create Quote
            </a>
            <a className="secondaryButton" href="/schedule">
              Open Calendar
            </a>
            <a className="secondaryButton" href="/photos">
              Review Photos
            </a>
          </div>
        </div>

        <div className="clientStatusCard">
          <div className="statLabel">Guru Ready</div>
          <div className="clientStatusTitle">Warm lead intake</div>
          <p>
            These request fields will connect to Guru estimate intake and admin review
            before official quotes are sent.
          </p>
        </div>
      </section>

      <section className="panel">
        <div className="statsGrid">
          {requestStats.map((stat) => (
            <div key={stat.title} className="statCard">
              <div className="statLabel">{stat.title}</div>
              <div className="statValue">{stat.value}</div>
              <p className="cardLine">{stat.text}</p>
            </div>
          ))}
        </div>

        <div className="cardsGrid" style={{ marginTop: 16 }}>
          {reviewCards.map((card) => (
            <article key={card.title} className="quoteCard">
              <div className="quoteNumber">{card.title}</div>
              <p className="cardLine">{card.text}</p>
            </article>
          ))}
        </div>

        <div className="listCard">
          Request records will connect to client submissions, uploaded property photos,
          Guru preliminary estimates, admin review, quote conversion, and calendar scheduling.
        </div>
      </section>

      <PhotoGalleryPanel
        role="admin"
        title="Request Photo Review"
        subtitle="Review client-submitted property photos and pre-existing damage notes tied to service requests."
      />
    </div>
  );
}

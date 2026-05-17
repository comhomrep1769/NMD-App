import React from "react";

const pricingSections = [
  {
    title: "Residential Pricing",
    text: "House washing, roof cleaning, driveway/sidewalk cleaning, patios, decks, pool cages, pavers, sealing, and gutter cleaning."
  },
  {
    title: "Commercial Pricing",
    text: "Storefronts, exterior buildings, parking lots, parking garages, dumpster pads, sidewalks, drive-thrus, graffiti, and property management/HOA maintenance."
  },
  {
    title: "Industrial Pricing",
    text: "Heavy equipment, warehouse floors, loading docks, tanks, silos, fleet washing, and construction equipment cleaning."
  },
  {
    title: "Specialty Restoration",
    text: "Rust removal, oxidation-sensitive siding, oil/grease, graffiti, red clay, painted/coated surfaces, and high-risk treatment work."
  }
];

const quickReferences = [
  {
    service: "Rust Removal",
    range: "$125–$800+",
    note: "Specialty restoration. Heavy irrigation rust or exposed aggregate can price higher."
  },
  {
    service: "Portable Restroom Cleaning",
    range: "$50–$150/unit",
    note: "Routine units lower, emergency/deep/high-use service higher."
  },
  {
    service: "Luxury Restroom Trailer",
    range: "$150–$300/visit",
    note: "Depends on size, use, access, and condition."
  },
  {
    service: "Public Restroom Cleaning",
    range: "$0.15–$1.00/sq ft",
    note: "Deep cleaning, intensive work, and minimum service fees apply."
  },
  {
    service: "Trash Can Cleaning",
    range: "$10/month target",
    note: "Starting recurring subscription target unless market research supports more."
  },
  {
    service: "Mileage Reimbursement",
    range: "$0.60/mile default",
    note: "Admin-adjustable rate for employee reimbursement and tax tracking."
  }
];

export default function PricingPage() {
  return (
    <div className="pageGrid">
      <section className="clientHeroPanel">
        <div className="clientHeroContent">
          <span className="clientEyebrow">NMD Job Pricing</span>
          <h1>Admin-only pricing reference and quote strategy.</h1>
          <p>
            Use this page for pricing structures, square-foot references, service
            minimums, upsells, chemical/material costs, labor estimates, and quote
            guidance while building client quotes.
          </p>

          <div className="clientHeroActions">
            <a className="primaryButton" href="/quotes">
              Create Quote
            </a>
            <a className="secondaryButton" href="/treatments">
              Treatments
            </a>
            <a className="secondaryButton" href="/requests">
              Requests
            </a>
          </div>
        </div>

        <div className="clientStatusCard">
          <div className="statLabel">Admin Only</div>
          <div className="clientStatusTitle">Pricing is not employee/client public</div>
          <p>
            Treatments can be viewed by employees, but pricing reference stays admin-only
            for quote control and profit protection.
          </p>
        </div>
      </section>

      <section className="panel">
        <div className="cardsGrid">
          {pricingSections.map((section) => (
            <article key={section.title} className="quoteCard">
              <div className="quoteNumber">{section.title}</div>
              <p className="cardLine">{section.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panelHeader">
          <div>
            <h2 className="panelTitle">Quick Pricing References</h2>
            <p className="brandSubtitle">
              Starter reference values for admin quoting. Final pricing should account
              for access, severity, risk, time, materials, travel, and profit margin.
            </p>
          </div>
        </div>

        <div className="cardsGrid" style={{ marginTop: 16 }}>
          {quickReferences.map((item) => (
            <article key={item.service} className="quoteCard">
              <div className="quoteTopRow">
                <div className="quoteNumber">{item.service}</div>
                <span className="statusBadge status-approved">{item.range}</span>
              </div>

              <p className="cardLine">{item.note}</p>
            </article>
          ))}
        </div>

        <div className="listCard">
          Future pricing system should support service category, surface type, condition
          severity, square-foot pricing, flat rates, subscription pricing, chemical cost,
          labor/time estimates, notes, quote guidance, and Guru profit protection alerts.
        </div>
      </section>
    </div>
  );
}

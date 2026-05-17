import React from "react";
import {
  nmdServiceCategories,
  searchNmdServices,
  type NmdServiceCategoryKey,
  type NmdServiceItem
} from "../utils/nmdServicesCatalog";

function ServiceCard({ service, onRequest }: { service: NmdServiceItem; onRequest?: (service: NmdServiceItem) => void }) {
  return (
    <article className="quoteCard serviceCatalogCard">
      <div className="quoteTopRow">
        <div>
          <div className="quoteNumber">{service.title}</div>
          <div className="cardLine">{service.shortDescription}</div>
        </div>

        <span className="statusBadge status-approved">
          {service.category}
        </span>
      </div>

      <p className="cardLine">{service.fullDescription}</p>

      <div className="assignBox">
        <div className="assignTitle">Common Treatment Links</div>
        <div className="clientServicePills" style={{ justifyContent: "flex-start" }}>
          {service.commonTreatments.map((treatment) => (
            <span key={treatment} className="clientServicePill">
              {treatment}
            </span>
          ))}
        </div>
      </div>

      {service.photoHelpful && (
        <div className="assignBox">
          <div className="assignTitle">Photos Help With Estimates</div>
          <div className="cardLine">{service.estimateNotes}</div>
        </div>
      )}

      <div className="buttonRow" style={{ marginTop: 12 }}>
        <button
          className="primaryButton"
          type="button"
          onClick={() => onRequest?.(service)}
        >
          Request This Service
        </button>
      </div>
    </article>
  );
}

export default function ServicesCatalog({
  onRequestService
}: {
  onRequestService?: (service: NmdServiceItem) => void;
}) {
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState<NmdServiceCategoryKey | "all">("all");

  const visibleServices = searchNmdServices(search, category);

  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <h2 className="panelTitle">NMD Services</h2>
          <p className="brandSubtitle">
            Residential, commercial, and industrial cleaning services organized for
            client requests, estimates, quotes, and Guru intake.
          </p>
        </div>
      </div>

      <div className="formGrid" style={{ marginTop: 16 }}>
        <label className="fieldLabel">
          Search Services
          <input
            className="textInput"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search: roof, pavers, driveway, dumpster pad, fleet..."
          />
        </label>

        <label className="fieldLabel">
          Category
          <select
            className="textInput"
            value={category}
            onChange={(event) => setCategory(event.target.value as NmdServiceCategoryKey | "all")}
          >
            <option value="all">All Services</option>
            {nmdServiceCategories.map((entry) => (
              <option key={entry.key} value={entry.key}>
                {entry.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="statsGrid" style={{ marginTop: 16 }}>
        {nmdServiceCategories.map((entry) => (
          <button
            key={entry.key}
            className={category === entry.key ? "primaryButton" : "secondaryButton"}
            type="button"
            onClick={() => setCategory(entry.key)}
            style={{
              minHeight: 88,
              display: "grid",
              justifyItems: "start",
              textAlign: "left",
              whiteSpace: "normal"
            }}
          >
            <strong>{entry.title}</strong>
            <span style={{ fontSize: 13, opacity: 0.82 }}>{entry.subtitle}</span>
          </button>
        ))}
      </div>

      <div className="cardsGrid" style={{ marginTop: 16 }}>
        {visibleServices.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            onRequest={onRequestService}
          />
        ))}

        {visibleServices.length === 0 && (
          <div className="listCard">
            No services match your current search. Clear search or choose another category.
          </div>
        )}
      </div>
    </section>
  );
}

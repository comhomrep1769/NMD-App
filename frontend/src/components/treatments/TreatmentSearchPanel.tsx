import React from "react";
import type { TreatmentItem } from "../../types";
import TreatmentCard from "./TreatmentCard";

export default function TreatmentSearchPanel({
  search,
  setSearch,
  categoryFilter,
  setCategoryFilter,
  riskFilter,
  setRiskFilter,
  categories,
  visibleTreatments,
  selectedTreatment,
  setSelectedId
}: {
  search: string;
  setSearch: (value: string) => void;
  categoryFilter: string;
  setCategoryFilter: (value: string) => void;
  riskFilter: string;
  setRiskFilter: (value: string) => void;
  categories: string[];
  visibleTreatments: TreatmentItem[];
  selectedTreatment: TreatmentItem | null;
  setSelectedId: (id: string) => void;
}) {
  const hasTreatments = visibleTreatments.length > 0;

  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <h2 className="panelTitle">Search Treatments</h2>
          <p className="brandSubtitle">
            Search approved treatment records by surface, chemical, dilution, stain type,
            category, safety note, or field instruction.
          </p>
        </div>

        <div className="buttonRow">
          <button
            className="secondaryButton"
            type="button"
            onClick={() => {
              setSearch("");
              setCategoryFilter("all");
              setRiskFilter("all");
            }}
          >
            Clear Search
          </button>
        </div>
      </div>

      <div className="formGrid">
        <label className="fieldLabel">
          Search Treatment Records
          <input
            className="textInput"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search: roof, rust, concrete, SH, oxidation, plants, wood..."
          />
        </label>

        <label className="fieldLabel">
          Category
          <select
            className="textInput"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className="fieldLabel">
          Risk Level
          <select
            className="textInput"
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
          >
            <option value="all">All Risk Levels</option>
            <option value="Standard">Standard</option>
            <option value="Moderate">Moderate</option>
            <option value="High Review">High Review</option>
          </select>
        </label>
      </div>

      {!hasTreatments && (
        <div className="errorBox" style={{ marginTop: 16 }}>
          No treatment records are available for this search. Admin or Super Admin needs to
          seed defaults or upload treatment records before employees will see data here.
        </div>
      )}

      {selectedTreatment && (
        <div className="listCard" style={{ marginTop: 16 }}>
          <strong>Selected treatment:</strong> {selectedTreatment.name}{" "}
          <span style={{ opacity: 0.75 }}>
            — click another card below to open its details.
          </span>
        </div>
      )}

      <div className="cardsGrid" style={{ marginTop: 16 }}>
        {visibleTreatments.map((treatment) => (
          <TreatmentCard
            key={treatment.id}
            treatment={treatment}
            active={selectedTreatment?.id === treatment.id}
            onSelect={() => setSelectedId(treatment.id)}
          />
        ))}
      </div>
    </section>
  );
}

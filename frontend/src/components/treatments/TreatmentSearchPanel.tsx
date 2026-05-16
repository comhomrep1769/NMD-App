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
  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <h2 className="panelTitle">Search Treatments</h2>
          <p className="brandSubtitle">
            Filter by category, surface, chemical, stain type, risk level, or safety concern.
          </p>
        </div>
      </div>

      <div className="formGrid">
        <input
          className="textInput"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search: roof, rust, concrete, SH, oxidation, plants..."
        />

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
      </div>

      <div className="cardsGrid" style={{ marginTop: 16 }}>
        {visibleTreatments.map((treatment) => (
          <TreatmentCard
            key={treatment.id}
            treatment={treatment}
            active={selectedTreatment?.id === treatment.id}
            onSelect={() => setSelectedId(treatment.id)}
          />
        ))}

        {visibleTreatments.length === 0 && (
          <div className="listCard">No treatments found for this search/filter.</div>
        )}
      </div>
    </section>
  );
}

import React from "react";
import type { TreatmentItem } from "../../types";
import { getTreatmentRiskLevel } from "../../utils/treatmentHelpers";

type CategoryCount = {
  category: string;
  count: number;
};

function getCategoryCounts(treatments: TreatmentItem[]): CategoryCount[] {
  const map = new Map<string, number>();

  treatments.forEach((treatment) => {
    const category = treatment.category || "General";
    map.set(category, (map.get(category) || 0) + 1);
  });

  return Array.from(map.entries())
    .map(([category, count]) => ({
      category,
      count
    }))
    .sort((a, b) => a.category.localeCompare(b.category));
}

function getRiskCount(treatments: TreatmentItem[], riskLevel: string) {
  return treatments.filter((item) => getTreatmentRiskLevel(item) === riskLevel).length;
}

export default function TreatmentCategorySidebar({
  treatments,
  selectedCategory,
  selectedRisk,
  onCategoryChange,
  onRiskChange
}: {
  treatments: TreatmentItem[];
  selectedCategory: string;
  selectedRisk: string;
  onCategoryChange: (category: string) => void;
  onRiskChange: (risk: string) => void;
}) {
  const categories = getCategoryCounts(treatments);

  const standardCount = getRiskCount(treatments, "Standard");
  const moderateCount = getRiskCount(treatments, "Moderate");
  const highReviewCount = getRiskCount(treatments, "High Review");

  const noData = treatments.length === 0;

  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <h2 className="panelTitle">Treatment Filters</h2>
          <p className="brandSubtitle">
            Filter employee-visible treatment records by category and risk level.
          </p>
        </div>
      </div>

      {noData && (
        <div className="errorBox" style={{ marginTop: 16 }}>
          No treatment records are loaded yet. Admin or Super Admin must seed defaults or
          upload treatment data before filters will show options.
        </div>
      )}

      <div className="assignBox" style={{ marginTop: 16 }}>
        <div className="assignTitle">Categories</div>

        <div style={{ display: "grid", gap: 10 }}>
          <button
            className={selectedCategory === "all" ? "primaryButton" : "secondaryButton"}
            type="button"
            onClick={() => onCategoryChange("all")}
            style={{ justifyContent: "space-between" }}
          >
            <span>All Categories</span>
            <span>{treatments.length}</span>
          </button>

          {categories.map((item) => (
            <button
              key={item.category}
              className={
                selectedCategory === item.category ? "primaryButton" : "secondaryButton"
              }
              type="button"
              onClick={() => onCategoryChange(item.category)}
              style={{ justifyContent: "space-between" }}
            >
              <span>{item.category}</span>
              <span>{item.count}</span>
            </button>
          ))}

          {!noData && categories.length === 0 && (
            <div className="listCard">No categories found.</div>
          )}
        </div>
      </div>

      <div className="assignBox">
        <div className="assignTitle">Risk Levels</div>

        <div style={{ display: "grid", gap: 10 }}>
          <button
            className={selectedRisk === "all" ? "primaryButton" : "secondaryButton"}
            type="button"
            onClick={() => onRiskChange("all")}
            style={{ justifyContent: "space-between" }}
          >
            <span>All Risk Levels</span>
            <span>{treatments.length}</span>
          </button>

          <button
            className={selectedRisk === "Standard" ? "primaryButton" : "secondaryButton"}
            type="button"
            onClick={() => onRiskChange("Standard")}
            style={{ justifyContent: "space-between" }}
            disabled={standardCount === 0}
          >
            <span>Standard</span>
            <span>{standardCount}</span>
          </button>

          <button
            className={selectedRisk === "Moderate" ? "primaryButton" : "secondaryButton"}
            type="button"
            onClick={() => onRiskChange("Moderate")}
            style={{ justifyContent: "space-between" }}
            disabled={moderateCount === 0}
          >
            <span>Moderate</span>
            <span>{moderateCount}</span>
          </button>

          <button
            className={
              selectedRisk === "High Review" ? "primaryButton" : "secondaryButton"
            }
            type="button"
            onClick={() => onRiskChange("High Review")}
            style={{ justifyContent: "space-between" }}
            disabled={highReviewCount === 0}
          >
            <span>High Review</span>
            <span>{highReviewCount}</span>
          </button>
        </div>
      </div>

      <div className="assignBox">
        <div className="assignTitle">Employee Note</div>
        <div className="cardLine">
          Employees can view treatment records, cases, SH calculator, Guru treatment search,
          and field guidance. Uploading, editing, deleting, plan building, and saved plans are
          Admin/Super Admin tools.
        </div>
      </div>
    </section>
  );
}

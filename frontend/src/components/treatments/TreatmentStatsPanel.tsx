import React from "react";
import type { TreatmentItem } from "../../types";
import { getTreatmentRiskLevel, uniqueTreatmentCategories } from "../../utils/treatmentHelpers";

export default function TreatmentStatsPanel({
  treatments,
  visibleTreatments,
  adminAccess
}: {
  treatments: TreatmentItem[];
  visibleTreatments: TreatmentItem[];
  adminAccess: boolean;
}) {
  const categories = uniqueTreatmentCategories(treatments);

  const highRiskCount = treatments.filter(
    (treatment) => getTreatmentRiskLevel(treatment) === "High Review"
  ).length;

  const specialtyCount = treatments.filter((treatment) =>
    ["Specialty Restoration", "Risk / Liability", "Commercial", "Stain Removal"].includes(
      treatment.category
    )
  ).length;

  return (
    <div className="statsGrid" style={{ marginTop: 16 }}>
      <div className="statCard">
        <div className="statLabel">Treatments</div>
        <div className="statValue">{treatments.length}</div>
      </div>

      <div className="statCard">
        <div className="statLabel">Categories</div>
        <div className="statValue">{categories.length}</div>
      </div>

      <div className="statCard">
        <div className="statLabel">Visible</div>
        <div className="statValue">{visibleTreatments.length}</div>
      </div>

      <div className="statCard">
        <div className="statLabel">High Review</div>
        <div className="statValue">{highRiskCount}</div>
      </div>

      <div className="statCard">
        <div className="statLabel">Specialty</div>
        <div className="statValue">{specialtyCount}</div>
      </div>

      <div className="statCard">
        <div className="statLabel">Access</div>
        <div className="statValue" style={{ fontSize: 18 }}>
          {adminAccess ? "Manage" : "View"}
        </div>
      </div>
    </div>
  );
}

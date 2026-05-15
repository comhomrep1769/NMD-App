import React from "react";
import type { TreatmentItem } from "../../types";
import {
  getRiskBadgeClass,
  getTreatmentRiskLevel
} from "../../utils/treatmentHelpers";

export default function TreatmentCard({
  treatment,
  active,
  onSelect
}: {
  treatment: TreatmentItem;
  active: boolean;
  onSelect: () => void;
}) {
  const risk = getTreatmentRiskLevel(treatment);

  return (
    <button
      className="quoteCard"
      type="button"
      onClick={onSelect}
      style={{
        textAlign: "left",
        cursor: "pointer",
        borderColor: active ? "rgba(56, 189, 248, 0.7)" : undefined
      }}
    >
      <div className="quoteTopRow">
        <div className="quoteNumber">{treatment.name}</div>
        <span className="statusBadge status-approved">
          {treatment.category || "General"}
        </span>
      </div>

      <div className="buttonRow" style={{ marginBottom: 8 }}>
        <span className={getRiskBadgeClass(risk)}>{risk}</span>
      </div>

      <div className="cardLine">
        <strong>Chemical:</strong> {treatment.chemical || "—"}
      </div>

      <div className="cardLine">
        <strong>Dilution:</strong> {treatment.dilutionRatio || "—"}
      </div>

      <div className="cardLine">
        <strong>Surfaces:</strong>{" "}
        {treatment.surfaceTypes?.length ? treatment.surfaceTypes.join(", ") : "—"}
      </div>
    </button>
  );
}

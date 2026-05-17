import React from "react";
import type { TreatmentItem } from "../../types";
import { getTreatmentRiskLevel } from "../../utils/treatmentHelpers";

function riskBadgeClass(riskLevel: string) {
  if (riskLevel === "High Review") return "statusBadge status-pending_admin_approval";
  if (riskLevel === "Moderate") return "statusBadge status-approved";
  return "statusBadge status-paid";
}

function formatSurfaces(surfaces: string[] | null | undefined) {
  if (!surfaces || surfaces.length === 0) return "No surfaces listed";
  return surfaces.join(", ");
}

function shortText(value: string | null | undefined, fallback = "No details added yet.") {
  const text = String(value || "").trim();

  if (!text) return fallback;

  if (text.length <= 155) return text;

  return `${text.slice(0, 155).trim()}...`;
}

export default function TreatmentCard({
  treatment,
  active,
  onSelect
}: {
  treatment: TreatmentItem;
  active: boolean;
  onSelect: () => void;
}) {
  const riskLevel = getTreatmentRiskLevel(treatment);

  return (
    <button
      className="quoteCard"
      type="button"
      onClick={onSelect}
      style={{
        textAlign: "left",
        cursor: "pointer",
        borderColor: active ? "rgba(37, 99, 235, 0.75)" : undefined,
        boxShadow: active ? "0 18px 42px rgba(37, 99, 235, 0.18)" : undefined
      }}
    >
      <div className="quoteTopRow">
        <div>
          <div className="quoteNumber">{treatment.name || "Untitled Treatment"}</div>
          <div className="cardLine">
            <strong>Category:</strong> {treatment.category || "General"}
          </div>
        </div>

        <span className={riskBadgeClass(riskLevel)}>{riskLevel}</span>
      </div>

      <div className="cardLine">
        <strong>Surfaces:</strong> {formatSurfaces(treatment.surfaceTypes)}
      </div>

      <div className="cardLine">
        <strong>Chemical:</strong> {treatment.chemical || "Not listed"}
      </div>

      <div className="cardLine">
        <strong>Dilution:</strong> {treatment.dilutionRatio || "Not listed"}
      </div>

      <div className="assignBox" style={{ marginTop: 12 }}>
        <div className="assignTitle">Use Case</div>
        <div className="cardLine">{shortText(treatment.useCase)}</div>
      </div>

      <div className="assignBox">
        <div className="assignTitle">Safety</div>
        <div className="cardLine">{shortText(treatment.safetyNotes)}</div>
      </div>

      <div className="buttonRow" style={{ marginTop: 12 }}>
        <span className={active ? "primaryButton" : "secondaryButton"}>
          {active ? "Selected" : "Open Details"}
        </span>
      </div>
    </button>
  );
}

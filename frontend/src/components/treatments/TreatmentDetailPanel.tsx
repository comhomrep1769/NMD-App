import React from "react";
import type { TreatmentItem } from "../../types";
import {
  buildGuruTreatmentSummary,
  getTreatmentRiskLevel
} from "../../utils/treatmentHelpers";

export default function TreatmentDetailPanel({
  treatment,
  adminAccess,
  onEdit,
  onDelete
}: {
  treatment: TreatmentItem;
  adminAccess: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const risk = getTreatmentRiskLevel(treatment);

  const copyGuruSummary = async () => {
    const summary = buildGuruTreatmentSummary(treatment);

    try {
      await navigator.clipboard.writeText(summary);
      window.alert("Treatment summary copied for Guru/client/job notes.");
    } catch {
      window.alert(summary);
    }
  };

  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <h2 className="panelTitle">{treatment.name}</h2>
          <p className="brandSubtitle">
            {treatment.category || "General"} • Treatment guidance and field workflow
          </p>
        </div>

        <div className="buttonRow">
          <button className="secondaryButton" type="button" onClick={copyGuruSummary}>
            Copy Guru Summary
          </button>

          {adminAccess && (
            <>
              <button className="primaryButton" type="button" onClick={onEdit}>
                Edit
              </button>

              <button className="secondaryButton" type="button" onClick={onDelete}>
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      <div className="statsGrid">
        <div className="statCard">
          <div className="statLabel">Category</div>
          <div className="statValue" style={{ fontSize: 18 }}>
            {treatment.category || "General"}
          </div>
        </div>

        <div className="statCard">
          <div className="statLabel">Risk</div>
          <div className="statValue" style={{ fontSize: 18 }}>
            {risk}
          </div>
        </div>

        <div className="statCard">
          <div className="statLabel">Surfaces</div>
          <div className="statValue" style={{ fontSize: 18 }}>
            {treatment.surfaceTypes?.length || 0}
          </div>
        </div>

        <div className="statCard">
          <div className="statLabel">Chemical</div>
          <div className="statValue" style={{ fontSize: 18 }}>
            {treatment.chemical ? "Listed" : "None"}
          </div>
        </div>
      </div>

      <div className="assignBox" style={{ marginTop: 16 }}>
        <div className="assignTitle">Surface Types</div>
        <div className="buttonRow">
          {(treatment.surfaceTypes || []).map((surface) => (
            <span key={surface} className="statusBadge status-approved">
              {surface}
            </span>
          ))}

          {(!treatment.surfaceTypes || treatment.surfaceTypes.length === 0) && (
            <div className="cardLine">No surface types listed.</div>
          )}
        </div>
      </div>

      <div className="assignBox">
        <div className="assignTitle">Chemical / Product</div>
        <div className="cardLine">{treatment.chemical || "—"}</div>
      </div>

      <div className="assignBox">
        <div className="assignTitle">Dilution Ratio</div>
        <div className="cardLine">{treatment.dilutionRatio || "—"}</div>
      </div>

      <div className="assignBox">
        <div className="assignTitle">Use Case</div>
        <div className="cardLine">{treatment.useCase || "—"}</div>
      </div>

      <div className="assignBox">
        <div className="assignTitle">Instructions</div>
        <div className="cardLine">{treatment.instructions || "—"}</div>
      </div>

      <div className="assignBox">
        <div className="assignTitle">Safety Notes</div>
        <div className="cardLine">{treatment.safetyNotes || "—"}</div>
      </div>

      <div className="assignBox">
        <div className="assignTitle">Cost / Pricing Reference</div>
        <div className="cardLine">{treatment.costReference || "—"}</div>
      </div>

      {treatment.purchaseLink && (
        <div className="assignBox">
          <div className="assignTitle">Purchase Link</div>
          <a
            className="primaryButton"
            href={treatment.purchaseLink}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-flex",
              width: "fit-content",
              textDecoration: "none"
            }}
          >
            Open Product Link
          </a>
        </div>
      )}
    </section>
  );
}

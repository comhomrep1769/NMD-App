import React from "react";
import type { TreatmentItem } from "../../types";
import { getTreatmentRiskLevel } from "../../utils/treatmentHelpers";

function riskBadgeClass(riskLevel: string) {
  if (riskLevel === "High Review") return "statusBadge status-pending_admin_approval";
  if (riskLevel === "Moderate") return "statusBadge status-approved";
  return "statusBadge status-paid";
}

function formatSurfaces(surfaces: string[] | null | undefined) {
  if (!surfaces || surfaces.length === 0) return "—";
  return surfaces.join(", ");
}

function buildTreatmentCopyText(treatment: TreatmentItem) {
  const riskLevel = getTreatmentRiskLevel(treatment);

  return [
    `Treatment: ${treatment.name || "Untitled Treatment"}`,
    `Category: ${treatment.category || "General"}`,
    `Risk Level: ${riskLevel}`,
    `Surfaces: ${formatSurfaces(treatment.surfaceTypes)}`,
    `Chemical / Product: ${treatment.chemical || "—"}`,
    `Dilution Ratio: ${treatment.dilutionRatio || "—"}`,
    `Use Case: ${treatment.useCase || "—"}`,
    `Safety Notes: ${treatment.safetyNotes || "—"}`,
    `Instructions: ${treatment.instructions || "—"}`,
    `Purchase Link: ${treatment.purchaseLink || "—"}`,
    `Cost / Pricing Reference: ${treatment.costReference || "—"}`
  ].join("\n");
}

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
  const [success, setSuccess] = React.useState("");

  const riskLevel = getTreatmentRiskLevel(treatment);

  const copyTreatment = async () => {
    const text = buildTreatmentCopyText(treatment);

    try {
      await navigator.clipboard.writeText(text);
      setSuccess("Treatment guidance copied.");
    } catch {
      window.alert(text);
    }
  };

  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <h2 className="panelTitle">Treatment Details</h2>
          <p className="brandSubtitle">
            Field-ready treatment guidance connected to the selected treatment record.
          </p>
        </div>

        <div className="buttonRow">
          <button className="primaryButton" type="button" onClick={copyTreatment}>
            Copy Treatment
          </button>

          {adminAccess && (
            <>
              <button className="secondaryButton" type="button" onClick={onEdit}>
                Edit
              </button>

              <button className="dangerButton" type="button" onClick={onDelete}>
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {success && <div className="listCard">{success}</div>}

      <div className="quoteCard" style={{ marginTop: 16 }}>
        <div className="quoteTopRow">
          <div>
            <div className="quoteNumber">{treatment.name || "Untitled Treatment"}</div>
            <div className="cardLine">
              <strong>Category:</strong> {treatment.category || "General"}
            </div>
          </div>

          <span className={riskBadgeClass(riskLevel)}>{riskLevel}</span>
        </div>

        <div className="assignBox">
          <div className="assignTitle">Surface Types</div>
          <div className="cardLine">{formatSurfaces(treatment.surfaceTypes)}</div>
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
          <div className="cardLine" style={{ whiteSpace: "pre-wrap" }}>
            {treatment.useCase || "—"}
          </div>
        </div>

        <div className="assignBox">
          <div className="assignTitle">Safety Notes</div>
          <div className="cardLine" style={{ whiteSpace: "pre-wrap" }}>
            {treatment.safetyNotes || "—"}
          </div>
        </div>

        <div className="assignBox">
          <div className="assignTitle">Instructions</div>
          <div className="cardLine" style={{ whiteSpace: "pre-wrap" }}>
            {treatment.instructions || "—"}
          </div>
        </div>

        <div className="assignBox">
          <div className="assignTitle">Cost / Pricing Reference</div>
          <div className="cardLine" style={{ whiteSpace: "pre-wrap" }}>
            {treatment.costReference || "—"}
          </div>
        </div>

        {treatment.purchaseLink && (
          <div className="assignBox">
            <div className="assignTitle">Purchase / Product Link</div>
            <div className="cardLine">
              <a href={treatment.purchaseLink} target="_blank" rel="noreferrer">
                {treatment.purchaseLink}
              </a>
            </div>
          </div>
        )}

        <div className="errorBox" style={{ marginTop: 14 }}>
          Treatment guidance is a field reference. Follow company policy, product labels,
          PPE requirements, test spots, customer approval, and Admin/Super Admin direction
          for high-risk surfaces or chemicals.
        </div>
      </div>
    </section>
  );
}

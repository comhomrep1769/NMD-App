import React from "react";
import type { TreatmentItem } from "../../types";
import type { TreatmentCase } from "../../types/treatmentCases";
import type { TreatmentPlan } from "../../types/treatmentPlans";
import { getHighestPlanRisk } from "../../types/treatmentPlans";
import {
  copyTreatmentPlan,
  downloadTreatmentPlan,
  printTreatmentPlan
} from "../../utils/treatmentPlanHelpers";
import { treatmentCaseRiskBadgeClass } from "../../types/treatmentCases";

export default function TreatmentPlanPreview({
  plan,
  treatments,
  cases,
  onClose
}: {
  plan: TreatmentPlan;
  treatments: TreatmentItem[];
  cases: TreatmentCase[];
  onClose: () => void;
}) {
  const risk = getHighestPlanRisk(cases);

  const copyPlan = async () => {
    const copied = await copyTreatmentPlan({
      plan,
      treatments,
      cases
    });

    if (copied) {
      window.alert("Treatment plan copied.");
    }
  };

  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <h2 className="panelTitle">Treatment Plan Preview</h2>
          <p className="brandSubtitle">
            Review, copy, download, or print this treatment plan for job notes.
          </p>
        </div>

        <div className="buttonRow">
          <button className="primaryButton" type="button" onClick={copyPlan}>
            Copy Plan
          </button>

          <button
            className="secondaryButton"
            type="button"
            onClick={() =>
              downloadTreatmentPlan({
                plan,
                treatments,
                cases
              })
            }
          >
            Download TXT
          </button>

          <button
            className="secondaryButton"
            type="button"
            onClick={() =>
              printTreatmentPlan({
                plan,
                treatments,
                cases
              })
            }
          >
            Print
          </button>

          <button className="secondaryButton" type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      <div className="statsGrid">
        <div className="statCard">
          <div className="statLabel">Job</div>
          <div className="statValue" style={{ fontSize: 18 }}>
            {plan.jobName || "Untitled"}
          </div>
        </div>

        <div className="statCard">
          <div className="statLabel">Risk</div>
          <div className="statValue" style={{ fontSize: 18 }}>
            {risk}
          </div>
        </div>

        <div className="statCard">
          <div className="statLabel">Treatments</div>
          <div className="statValue">{treatments.length}</div>
        </div>

        <div className="statCard">
          <div className="statLabel">Cases</div>
          <div className="statValue">{cases.length}</div>
        </div>
      </div>

      <div className="assignBox" style={{ marginTop: 16 }}>
        <div className="assignTitle">Job Details</div>
        <div className="cardLine">
          <strong>Client:</strong> {plan.clientName || "—"}
        </div>
        <div className="cardLine">
          <strong>Address:</strong> {plan.serviceAddress || "—"}
        </div>
        <div className="cardLine">
          <strong>Surface:</strong> {plan.surfaceType || "—"}
        </div>
        <div className="cardLine">
          <strong>Condition:</strong> {plan.conditionLevel || "—"}
        </div>
        <div className="cardLine">
          <strong>Notes:</strong> {plan.notes || "—"}
        </div>
      </div>

      <div className="assignBox">
        <div className="assignTitle">Selected Treatments</div>

        {treatments.length === 0 && (
          <div className="cardLine">No treatments selected.</div>
        )}

        {treatments.map((treatment) => (
          <div key={treatment.id} className="listCard" style={{ marginTop: 10 }}>
            <div className="quoteTopRow">
              <div className="quoteNumber">{treatment.name}</div>
              <span className="statusBadge status-approved">
                {treatment.category || "General"}
              </span>
            </div>

            <div className="cardLine">
              <strong>Chemical:</strong> {treatment.chemical || "—"}
            </div>

            <div className="cardLine">
              <strong>Dilution:</strong> {treatment.dilutionRatio || "—"}
            </div>

            <div className="cardLine">
              <strong>Safety:</strong> {treatment.safetyNotes || "—"}
            </div>
          </div>
        ))}
      </div>

      <div className="assignBox">
        <div className="assignTitle">Selected Cases</div>

        {cases.length === 0 && <div className="cardLine">No cases selected.</div>}

        {cases.map((item) => (
          <div key={item.id} className="listCard" style={{ marginTop: 10 }}>
            <div className="quoteTopRow">
              <div className="quoteNumber">{item.title}</div>
              <span className={treatmentCaseRiskBadgeClass(item.riskLevel)}>
                {item.riskLevel || "Standard"}
              </span>
            </div>

            <div className="cardLine">
              <strong>Mix:</strong> {item.recommendedMix || "—"}
            </div>

            <div className="cardLine">
              <strong>Steps:</strong> {item.stepByStep || "—"}
            </div>

            <div className="cardLine">
              <strong>Customer Expectation:</strong>{" "}
              {item.customerExpectation || "—"}
            </div>
          </div>
        ))}
      </div>

      <div className="errorBox">
        Field reminder: test spots, PPE, plant protection, runoff control, surface
        verification, and customer expectation documentation should happen before work starts.
      </div>
    </section>
  );
}

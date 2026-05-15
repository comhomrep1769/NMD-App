import React from "react";
import type { TreatmentItem } from "../../types";
import type { TreatmentCaseFormState } from "../../types/treatmentCases";

export default function TreatmentCaseForm({
  form,
  treatments,
  saving,
  onChange,
  onSubmit,
  onCancel
}: {
  form: TreatmentCaseFormState;
  treatments: TreatmentItem[];
  saving: boolean;
  onChange: (field: keyof TreatmentCaseFormState, value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  onCancel: () => void;
}) {
  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <h2 className="panelTitle">{form.id ? "Edit Treatment Case" : "Add Treatment Case"}</h2>
          <p className="brandSubtitle">
            Build case-based guidance for Guru, employees, and admin quoting.
          </p>
        </div>

        <button className="secondaryButton" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>

      <form className="formGrid" onSubmit={onSubmit}>
        <label className="fieldLabel">
          Linked Treatment
          <select
            className="textInput"
            value={form.treatmentId}
            onChange={(e) => onChange("treatmentId", e.target.value)}
          >
            <option value="">No linked treatment</option>
            {treatments.map((treatment) => (
              <option key={treatment.id} value={treatment.id}>
                {treatment.category} • {treatment.name}
              </option>
            ))}
          </select>
        </label>

        <label className="fieldLabel">
          Case Title
          <input
            className="textInput"
            value={form.title}
            onChange={(e) => onChange("title", e.target.value)}
            placeholder="Example: Heavy irrigation rust on concrete"
          />
        </label>

        <label className="fieldLabel">
          Risk Level
          <select
            className="textInput"
            value={form.riskLevel}
            onChange={(e) => onChange("riskLevel", e.target.value)}
          >
            <option value="Standard">Standard</option>
            <option value="Moderate">Moderate</option>
            <option value="High Review">High Review</option>
          </select>
        </label>

        <label className="fieldLabel">
          Surface Type
          <input
            className="textInput"
            value={form.surfaceType}
            onChange={(e) => onChange("surfaceType", e.target.value)}
            placeholder="Concrete, pavers, stucco, wood, roof..."
          />
        </label>

        <label className="fieldLabel">
          Condition Level
          <input
            className="textInput"
            value={form.conditionLevel}
            onChange={(e) => onChange("conditionLevel", e.target.value)}
            placeholder="Light, moderate, heavy, severe, damaged..."
          />
        </label>

        <label className="fieldLabel">
          Problem Type
          <input
            className="textInput"
            value={form.problemType}
            onChange={(e) => onChange("problemType", e.target.value)}
            placeholder="Rust, algae, oil, oxidation, coating damage..."
          />
        </label>

        <label className="fieldLabel">
          Recommended Mix
          <textarea
            className="textInput"
            rows={3}
            value={form.recommendedMix}
            onChange={(e) => onChange("recommendedMix", e.target.value)}
            placeholder="Mix or chemical guidance..."
          />
        </label>

        <label className="fieldLabel">
          Dwell Time
          <input
            className="textInput"
            value={form.dwellTime}
            onChange={(e) => onChange("dwellTime", e.target.value)}
            placeholder="Example: 5–10 minutes, do not allow to dry"
          />
        </label>

        <label className="fieldLabel">
          Tools Needed
          <textarea
            className="textInput"
            rows={3}
            value={form.toolsNeeded}
            onChange={(e) => onChange("toolsNeeded", e.target.value)}
            placeholder="Sprayer, PPE, brush, surface cleaner, ladder..."
          />
        </label>

        <label className="fieldLabel">
          Step By Step
          <textarea
            className="textInput"
            rows={5}
            value={form.stepByStep}
            onChange={(e) => onChange("stepByStep", e.target.value)}
            placeholder="Numbered field workflow..."
          />
        </label>

        <label className="fieldLabel">
          Safety Checklist
          <textarea
            className="textInput"
            rows={4}
            value={form.safetyChecklist}
            onChange={(e) => onChange("safetyChecklist", e.target.value)}
            placeholder="PPE, runoff, plant protection, test spots, liability notes..."
          />
        </label>

        <label className="fieldLabel">
          Pricing Note
          <textarea
            className="textInput"
            rows={3}
            value={form.pricingNote}
            onChange={(e) => onChange("pricingNote", e.target.value)}
            placeholder="Minimums, specialty pricing, add-on guidance..."
          />
        </label>

        <label className="fieldLabel">
          Customer Expectation
          <textarea
            className="textInput"
            rows={3}
            value={form.customerExpectation}
            onChange={(e) => onChange("customerExpectation", e.target.value)}
            placeholder="What should be explained to the client?"
          />
        </label>

        <div className="buttonRow">
          <button className="primaryButton" type="submit" disabled={saving}>
            {saving ? "Saving..." : form.id ? "Save Case" : "Create Case"}
          </button>

          <button className="secondaryButton" type="button" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}

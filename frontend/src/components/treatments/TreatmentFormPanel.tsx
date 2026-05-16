import React from "react";
import type { TreatmentForm } from "../../utils/treatmentHelpers";

export default function TreatmentFormPanel({
  form,
  saving,
  onChange,
  onSubmit,
  onCancel
}: {
  form: TreatmentForm;
  saving: boolean;
  onChange: (field: keyof TreatmentForm, value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  onCancel: () => void;
}) {
  return (
    <section className="panel treatmentFormPanel">
      <div className="panelHeader">
        <div>
          <h2 className="panelTitle">
            {form.id ? "Edit Treatment" : "Add Treatment"}
          </h2>
          <p className="brandSubtitle">
            Admin/Super Admin can manage treatment records used by employees and Guru.
          </p>
        </div>

        <button className="secondaryButton" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>

      <form className="formGrid treatmentFormGrid" onSubmit={onSubmit}>
        <label className="fieldLabel">
          Treatment Name
          <input
            className="textInput"
            value={form.name}
            onChange={(e) => onChange("name", e.target.value)}
            placeholder="Example: Rust Stain Removal"
          />
        </label>

        <label className="fieldLabel">
          Category
          <input
            className="textInput"
            value={form.category}
            onChange={(e) => onChange("category", e.target.value)}
            placeholder="Example: Specialty Restoration"
          />
        </label>

        <label className="fieldLabel treatmentWideField">
          Surface Types
          <input
            className="textInput"
            value={form.surfaceTypes}
            onChange={(e) => onChange("surfaceTypes", e.target.value)}
            placeholder="Comma separated: concrete, pavers, stucco"
          />
        </label>

        <label className="fieldLabel">
          Chemical / Product
          <input
            className="textInput"
            value={form.chemical}
            onChange={(e) => onChange("chemical", e.target.value)}
            placeholder="Example: F9 BARC, oxalic acid, SH"
          />
        </label>

        <label className="fieldLabel">
          Dilution Ratio
          <input
            className="textInput"
            value={form.dilutionRatio}
            onChange={(e) => onChange("dilutionRatio", e.target.value)}
            placeholder="Example: 6–8 oz per gallon"
          />
        </label>

        <label className="fieldLabel treatmentWideField">
          Use Case
          <textarea
            className="textInput"
            rows={3}
            value={form.useCase}
            onChange={(e) => onChange("useCase", e.target.value)}
            placeholder="What problem does this treatment solve?"
          />
        </label>

        <label className="fieldLabel treatmentWideField">
          Safety Notes
          <textarea
            className="textInput"
            rows={3}
            value={form.safetyNotes}
            onChange={(e) => onChange("safetyNotes", e.target.value)}
            placeholder="PPE, plant protection, runoff, customer expectation notes..."
          />
        </label>

        <label className="fieldLabel treatmentWideField">
          Instructions
          <textarea
            className="textInput"
            rows={4}
            value={form.instructions}
            onChange={(e) => onChange("instructions", e.target.value)}
            placeholder="Step-by-step field workflow..."
          />
        </label>

        <label className="fieldLabel treatmentWideField">
          Purchase Link Optional
          <input
            className="textInput"
            value={form.purchaseLink}
            onChange={(e) => onChange("purchaseLink", e.target.value)}
            placeholder="https://..."
          />
        </label>

        <label className="fieldLabel treatmentWideField">
          Cost / Pricing Reference
          <textarea
            className="textInput"
            rows={3}
            value={form.costReference}
            onChange={(e) => onChange("costReference", e.target.value)}
            placeholder="Material cost, pricing note, add-on guidance..."
          />
        </label>

        <div className="buttonRow treatmentWideField">
          <button className="primaryButton" type="submit" disabled={saving}>
            {saving ? "Saving..." : form.id ? "Save Treatment" : "Create Treatment"}
          </button>

          <button className="secondaryButton" type="button" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}

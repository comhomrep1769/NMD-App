import React from "react";
import {
  addChemicalItem,
  emptyChemicalForm,
  type ChemicalForm
} from "../../utils/chemicalListStorage";

export default function ChemicalManualAddAdminPanel() {
  const [form, setForm] = React.useState<ChemicalForm>(emptyChemicalForm);
  const [success, setSuccess] = React.useState("");
  const [error, setError] = React.useState("");

  const updateForm = (field: keyof ChemicalForm, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const addChemical = (event: React.FormEvent) => {
    event.preventDefault();

    setSuccess("");
    setError("");

    if (!form.chemicalName.trim()) {
      setError("Chemical name is required.");
      return;
    }

    const result = addChemicalItem(form);

    setSuccess(
      result.mode === "created"
        ? `Chemical added: ${result.item.chemicalName}`
        : `Chemical updated: ${result.item.chemicalName}`
    );

    setForm(emptyChemicalForm);
  };

  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <h2 className="panelTitle">Add Chemical</h2>
          <p className="brandSubtitle">
            Manually add a chemical name and purchase link. Extra use-case and warning
            fields can be filled now or enriched later.
          </p>
        </div>
      </div>

      {error && <div className="errorBox">{error}</div>}

      {success && (
        <div className="listCard" style={{ borderColor: "rgba(34, 197, 94, 0.65)" }}>
          {success}
        </div>
      )}

      <div className="errorBox">
        <strong>Fast input format:</strong> Chemical name + purchase link is enough.
        Category, use cases, safety notes, damage warnings, and notes are optional.
      </div>

      <form className="formGrid" onSubmit={addChemical} style={{ marginTop: 16 }}>
        <label className="fieldLabel">
          Chemical Name
          <input
            className="textInput"
            value={form.chemicalName}
            onChange={(e) => updateForm("chemicalName", e.target.value)}
            placeholder="Example: Oxalic Acid"
          />
        </label>

        <label className="fieldLabel">
          Purchase Link
          <input
            className="textInput"
            value={form.purchaseLink}
            onChange={(e) => updateForm("purchaseLink", e.target.value)}
            placeholder="https://www.amazon.com/..."
          />
        </label>

        <label className="fieldLabel">
          Category
          <input
            className="textInput"
            value={form.category}
            onChange={(e) => updateForm("category", e.target.value)}
            placeholder="Soft wash, degreaser, rust removal, wood restoration..."
          />
        </label>

        <label className="fieldLabel">
          Primary Use Cases
          <textarea
            className="textInput"
            rows={3}
            value={form.primaryUseCases}
            onChange={(e) => updateForm("primaryUseCases", e.target.value)}
            placeholder="What surfaces, stains, or treatments should this chemical be used for?"
          />
        </label>

        <label className="fieldLabel">
          Safety Notes
          <textarea
            className="textInput"
            rows={3}
            value={form.safetyNotes}
            onChange={(e) => updateForm("safetyNotes", e.target.value)}
            placeholder="PPE, plant protection, runoff, mixing warnings..."
          />
        </label>

        <label className="fieldLabel">
          Damage Warnings
          <textarea
            className="textInput"
            rows={3}
            value={form.damageWarnings}
            onChange={(e) => updateForm("damageWarnings", e.target.value)}
            placeholder="What can this damage if used wrong?"
          />
        </label>

        <label className="fieldLabel">
          Notes
          <textarea
            className="textInput"
            rows={3}
            value={form.notes}
            onChange={(e) => updateForm("notes", e.target.value)}
            placeholder="Cheapest source, dilution reminder, admin review note..."
          />
        </label>

        <div className="buttonRow">
          <button className="primaryButton" type="submit">
            Add Chemical
          </button>

          <button
            className="secondaryButton"
            type="button"
            onClick={() => setForm(emptyChemicalForm)}
          >
            Clear Form
          </button>
        </div>
      </form>
    </section>
  );
}

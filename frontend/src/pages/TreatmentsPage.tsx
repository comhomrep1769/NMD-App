import React from "react";
import { apiFetch } from "../api";
import type { AuthUserRole, TreatmentItem } from "../types";
import { isAdminRole } from "../utils/roles";
import {
  emptyTreatmentForm,
  exportTreatmentsToCsv,
  formToTreatmentPayload,
  getTreatmentRiskLevel,
  normalizeTreatment,
  treatmentMatchesSearch,
  treatmentToForm,
  uniqueTreatmentCategories,
  type TreatmentForm
} from "../utils/treatmentHelpers";
import DilutionCalculator from "../components/treatments/DilutionCalculator";
import TreatmentCard from "../components/treatments/TreatmentCard";
import TreatmentDetailPanel from "../components/treatments/TreatmentDetailPanel";

export default function TreatmentsPage({ role }: { role: AuthUserRole }) {
  const adminAccess = isAdminRole(role);

  const [treatments, setTreatments] = React.useState<TreatmentItem[]>([]);
  const [search, setSearch] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("all");
  const [riskFilter, setRiskFilter] = React.useState("all");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<TreatmentForm>(emptyTreatmentForm);
  const [showForm, setShowForm] = React.useState(false);
  const [showCalculator, setShowCalculator] = React.useState(true);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [seeding, setSeeding] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  const loadTreatments = React.useCallback(async () => {
    setError("");

    try {
      const data = await apiFetch<{ treatments: TreatmentItem[] }>("/api/treatments");
      setTreatments((data.treatments || []).map(normalizeTreatment));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load treatments.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadTreatments();
  }, [loadTreatments]);

  const categories = uniqueTreatmentCategories(treatments);

  const visibleTreatments = treatments.filter((treatment) => {
    const matchesCategory =
      categoryFilter === "all" || treatment.category === categoryFilter;

    const risk = getTreatmentRiskLevel(treatment);
    const matchesRisk = riskFilter === "all" || risk === riskFilter;

    return matchesCategory && matchesRisk && treatmentMatchesSearch(treatment, search);
  });

  const selectedTreatment =
    treatments.find((treatment) => treatment.id === selectedId) ||
    visibleTreatments[0] ||
    null;

  React.useEffect(() => {
    if (!selectedId && visibleTreatments[0]) {
      setSelectedId(visibleTreatments[0].id);
    }
  }, [selectedId, visibleTreatments]);

  const updateForm = (field: keyof TreatmentForm, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const startCreate = () => {
    setForm(emptyTreatmentForm);
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  const startEdit = (treatment: TreatmentItem) => {
    setForm(treatmentToForm(treatment));
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  const cancelForm = () => {
    setForm(emptyTreatmentForm);
    setShowForm(false);
    setError("");
  };

  const seedTreatments = async () => {
    setError("");
    setSuccess("");
    setSeeding(true);

    try {
      const data = await apiFetch<{
        message: string;
        treatments: TreatmentItem[];
      }>("/api/treatments/seed", {
        method: "POST"
      });

      setTreatments((data.treatments || []).map(normalizeTreatment));
      setSuccess(data.message || "Treatment database seeded.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to seed treatments.");
    } finally {
      setSeeding(false);
    }
  };

  const saveTreatment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!adminAccess) {
      setError("Only Admin or Super Admin can manage treatments.");
      return;
    }

    if (!form.name.trim()) {
      setError("Treatment name is required.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    const payload = formToTreatmentPayload(form);

    try {
      if (form.id) {
        const data = await apiFetch<{ treatment: TreatmentItem }>(
          `/api/treatments/${form.id}`,
          {
            method: "PATCH",
            body: JSON.stringify(payload)
          }
        );

        const updated = normalizeTreatment(data.treatment);

        setTreatments((prev) =>
          prev.map((treatment) => (treatment.id === updated.id ? updated : treatment))
        );

        setSelectedId(updated.id);
        setSuccess("Treatment updated.");
      } else {
        const data = await apiFetch<{ treatment: TreatmentItem }>("/api/treatments", {
          method: "POST",
          body: JSON.stringify(payload)
        });

        const created = normalizeTreatment(data.treatment);

        setTreatments((prev) =>
          [...prev, created].sort((a, b) =>
            `${a.category}-${a.name}`.localeCompare(`${b.category}-${b.name}`)
          )
        );

        setSelectedId(created.id);
        setSuccess("Treatment created.");
      }

      setForm(emptyTreatmentForm);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save treatment.");
    } finally {
      setSaving(false);
    }
  };

  const deleteTreatment = async (treatment: TreatmentItem) => {
    if (!adminAccess) {
      setError("Only Admin or Super Admin can delete treatments.");
      return;
    }

    const ok = window.confirm(`Delete treatment "${treatment.name}"?`);
    if (!ok) return;

    setError("");
    setSuccess("");

    try {
      await apiFetch(`/api/treatments/${treatment.id}`, {
        method: "DELETE"
      });

      setTreatments((prev) => prev.filter((item) => item.id !== treatment.id));
      setSelectedId(null);
      setSuccess("Treatment deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete treatment.");
    }
  };

  const highRiskCount = treatments.filter(
    (treatment) => getTreatmentRiskLevel(treatment) === "High Review"
  ).length;

  const specialtyCount = treatments.filter((treatment) =>
    ["Specialty Restoration", "Risk / Liability", "Commercial", "Stain Removal"].includes(
      treatment.category
    )
  ).length;

  if (loading) {
    return (
      <section className="panel">
        <h2 className="panelTitle">Treatment Options & Cases</h2>
        <div className="listCard">Loading treatment database...</div>
      </section>
    );
  }

  return (
    <div className="pageGrid">
      <section className="panel">
        <div className="panelHeader">
          <div>
            <h2 className="panelTitle">Treatment Options & Cases</h2>
            <p className="brandSubtitle">
              Search chemical usage, dilution ratios, safety notes, surfaces, cases, and field instructions.
            </p>
          </div>

          <div className="buttonRow">
            {adminAccess && (
              <>
                <button className="primaryButton" type="button" onClick={startCreate}>
                  Add Treatment
                </button>

                <button
                  className="secondaryButton"
                  type="button"
                  onClick={seedTreatments}
                  disabled={seeding}
                >
                  {seeding ? "Seeding..." : "Seed Defaults"}
                </button>
              </>
            )}

            <button
              className="secondaryButton"
              type="button"
              onClick={() => setShowCalculator((prev) => !prev)}
            >
              {showCalculator ? "Hide Calculator" : "Show Calculator"}
            </button>

            <button
              className="secondaryButton"
              type="button"
              onClick={() => exportTreatmentsToCsv(visibleTreatments)}
              disabled={visibleTreatments.length === 0}
            >
              Export Visible CSV
            </button>
          </div>
        </div>

        {error && <div className="errorBox">{error}</div>}

        {success && <div className="listCard">{success}</div>}

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
      </section>

      {showCalculator && (
        <DilutionCalculator onClose={() => setShowCalculator(false)} />
      )}

      {showForm && adminAccess && (
        <section className="panel">
          <div className="panelHeader">
            <div>
              <h2 className="panelTitle">
                {form.id ? "Edit Treatment" : "Add Treatment"}
              </h2>
              <p className="brandSubtitle">
                Admin/Super Admin can manage treatment records used by employees and Guru.
              </p>
            </div>

            <button className="secondaryButton" type="button" onClick={cancelForm}>
              Cancel
            </button>
          </div>

          <form className="formGrid" onSubmit={saveTreatment}>
            <label className="fieldLabel">
              Treatment Name
              <input
                className="textInput"
                value={form.name}
                onChange={(e) => updateForm("name", e.target.value)}
                placeholder="Example: Rust Stain Removal"
              />
            </label>

            <label className="fieldLabel">
              Category
              <input
                className="textInput"
                value={form.category}
                onChange={(e) => updateForm("category", e.target.value)}
                placeholder="Example: Specialty Restoration"
              />
            </label>

            <label className="fieldLabel">
              Surface Types
              <input
                className="textInput"
                value={form.surfaceTypes}
                onChange={(e) => updateForm("surfaceTypes", e.target.value)}
                placeholder="Comma separated: concrete, pavers, stucco"
              />
            </label>

            <label className="fieldLabel">
              Chemical / Product
              <input
                className="textInput"
                value={form.chemical}
                onChange={(e) => updateForm("chemical", e.target.value)}
                placeholder="Example: F9 BARC, oxalic acid, SH"
              />
            </label>

            <label className="fieldLabel">
              Dilution Ratio
              <input
                className="textInput"
                value={form.dilutionRatio}
                onChange={(e) => updateForm("dilutionRatio", e.target.value)}
                placeholder="Example: 6–8 oz per gallon"
              />
            </label>

            <label className="fieldLabel">
              Use Case
              <textarea
                className="textInput"
                rows={3}
                value={form.useCase}
                onChange={(e) => updateForm("useCase", e.target.value)}
                placeholder="What problem does this treatment solve?"
              />
            </label>

            <label className="fieldLabel">
              Safety Notes
              <textarea
                className="textInput"
                rows={3}
                value={form.safetyNotes}
                onChange={(e) => updateForm("safetyNotes", e.target.value)}
                placeholder="PPE, plant protection, runoff, customer expectation notes..."
              />
            </label>

            <label className="fieldLabel">
              Instructions
              <textarea
                className="textInput"
                rows={4}
                value={form.instructions}
                onChange={(e) => updateForm("instructions", e.target.value)}
                placeholder="Step-by-step field workflow..."
              />
            </label>

            <label className="fieldLabel">
              Purchase Link Optional
              <input
                className="textInput"
                value={form.purchaseLink}
                onChange={(e) => updateForm("purchaseLink", e.target.value)}
                placeholder="https://..."
              />
            </label>

            <label className="fieldLabel">
              Cost / Pricing Reference
              <textarea
                className="textInput"
                rows={3}
                value={form.costReference}
                onChange={(e) => updateForm("costReference", e.target.value)}
                placeholder="Material cost, pricing note, add-on guidance..."
              />
            </label>

            <div className="buttonRow">
              <button className="primaryButton" type="submit" disabled={saving}>
                {saving ? "Saving..." : form.id ? "Save Treatment" : "Create Treatment"}
              </button>

              <button className="secondaryButton" type="button" onClick={cancelForm}>
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="panel">
        <div className="panelHeader">
          <div>
            <h2 className="panelTitle">Search Treatments</h2>
            <p className="brandSubtitle">
              Filter by category, surface, chemical, stain type, risk level, or safety concern.
            </p>
          </div>
        </div>

        <div className="formGrid">
          <input
            className="textInput"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search: roof, rust, concrete, SH, oxidation, plants..."
          />

          <select
            className="textInput"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            className="textInput"
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
          >
            <option value="all">All Risk Levels</option>
            <option value="Standard">Standard</option>
            <option value="Moderate">Moderate</option>
            <option value="High Review">High Review</option>
          </select>
        </div>

        <div className="cardsGrid" style={{ marginTop: 16 }}>
          {visibleTreatments.map((treatment) => (
            <TreatmentCard
              key={treatment.id}
              treatment={treatment}
              active={selectedTreatment?.id === treatment.id}
              onSelect={() => setSelectedId(treatment.id)}
            />
          ))}

          {visibleTreatments.length === 0 && (
            <div className="listCard">No treatments found for this search/filter.</div>
          )}
        </div>
      </section>

      {selectedTreatment && (
        <TreatmentDetailPanel
          treatment={selectedTreatment}
          adminAccess={adminAccess}
          onEdit={() => startEdit(selectedTreatment)}
          onDelete={() => deleteTreatment(selectedTreatment)}
        />
      )}
    </div>
  );
}

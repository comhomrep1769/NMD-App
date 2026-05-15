import React from "react";
import { apiFetch } from "../api";
import type { AuthUserRole, TreatmentItem } from "../types";
import { isAdminRole } from "../utils/roles";

type TreatmentForm = {
  id: string | null;
  name: string;
  category: string;
  surfaceTypes: string;
  chemical: string;
  dilutionRatio: string;
  useCase: string;
  safetyNotes: string;
  instructions: string;
  purchaseLink: string;
  costReference: string;
};

type DilutionMode = "percent" | "ounces";

const emptyForm: TreatmentForm = {
  id: null,
  name: "",
  category: "General",
  surfaceTypes: "",
  chemical: "",
  dilutionRatio: "",
  useCase: "",
  safetyNotes: "",
  instructions: "",
  purchaseLink: "",
  costReference: ""
};

function normalizeTreatment(item: TreatmentItem): TreatmentItem {
  return {
    ...item,
    surfaceTypes: Array.isArray(item.surfaceTypes) ? item.surfaceTypes : [],
    chemical: item.chemical || "",
    dilutionRatio: item.dilutionRatio || "",
    useCase: item.useCase || "",
    safetyNotes: item.safetyNotes || "",
    instructions: item.instructions || "",
    purchaseLink: item.purchaseLink || "",
    costReference: item.costReference || "",
    createdAt: item.createdAt || "",
    updatedAt: item.updatedAt || ""
  };
}

function treatmentToForm(treatment: TreatmentItem): TreatmentForm {
  return {
    id: treatment.id,
    name: treatment.name || "",
    category: treatment.category || "General",
    surfaceTypes: Array.isArray(treatment.surfaceTypes)
      ? treatment.surfaceTypes.join(", ")
      : "",
    chemical: treatment.chemical || "",
    dilutionRatio: treatment.dilutionRatio || "",
    useCase: treatment.useCase || "",
    safetyNotes: treatment.safetyNotes || "",
    instructions: treatment.instructions || "",
    purchaseLink: treatment.purchaseLink || "",
    costReference: treatment.costReference || ""
  };
}

function formToPayload(form: TreatmentForm) {
  return {
    name: form.name.trim(),
    category: form.category.trim() || "General",
    surfaceTypes: form.surfaceTypes
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    chemical: form.chemical.trim(),
    dilutionRatio: form.dilutionRatio.trim(),
    useCase: form.useCase.trim(),
    safetyNotes: form.safetyNotes.trim(),
    instructions: form.instructions.trim(),
    purchaseLink: form.purchaseLink.trim(),
    costReference: form.costReference.trim()
  };
}

function uniqueCategories(treatments: TreatmentItem[]) {
  const categories = new Set<string>();

  treatments.forEach((treatment) => {
    if (treatment.category) categories.add(treatment.category);
  });

  return Array.from(categories).sort((a, b) => a.localeCompare(b));
}

function includesSearch(treatment: TreatmentItem, search: string) {
  if (!search.trim()) return true;

  const q = search.toLowerCase();

  return [
    treatment.name,
    treatment.category,
    treatment.chemical,
    treatment.dilutionRatio,
    treatment.useCase,
    treatment.safetyNotes,
    treatment.instructions,
    treatment.costReference,
    ...(treatment.surfaceTypes || [])
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(q);
}

function safeNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function calculatePercentMix({
  targetPercent,
  sourcePercent,
  totalGallons
}: {
  targetPercent: number;
  sourcePercent: number;
  totalGallons: number;
}) {
  if (sourcePercent <= 0 || totalGallons <= 0 || targetPercent <= 0) {
    return {
      chemicalGallons: 0,
      waterGallons: totalGallons,
      chemicalOunces: 0,
      waterOunces: totalGallons * 128
    };
  }

  const chemicalGallons = (targetPercent / sourcePercent) * totalGallons;
  const cappedChemicalGallons = Math.min(Math.max(chemicalGallons, 0), totalGallons);
  const waterGallons = Math.max(totalGallons - cappedChemicalGallons, 0);

  return {
    chemicalGallons: cappedChemicalGallons,
    waterGallons,
    chemicalOunces: cappedChemicalGallons * 128,
    waterOunces: waterGallons * 128
  };
}

function calculateOunceMix({
  ouncesPerGallon,
  totalGallons
}: {
  ouncesPerGallon: number;
  totalGallons: number;
}) {
  const chemicalOunces = Math.max(ouncesPerGallon, 0) * Math.max(totalGallons, 0);
  const totalOunces = Math.max(totalGallons, 0) * 128;
  const waterOunces = Math.max(totalOunces - chemicalOunces, 0);

  return {
    chemicalOunces,
    waterOunces,
    chemicalGallons: chemicalOunces / 128,
    waterGallons: waterOunces / 128
  };
}

function formatNumber(value: number) {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0
  });
}

function getTreatmentRiskLevel(treatment: TreatmentItem) {
  const text = [
    treatment.name,
    treatment.category,
    treatment.chemical,
    treatment.useCase,
    treatment.safetyNotes,
    treatment.instructions
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    text.includes("roof") ||
    text.includes("rust") ||
    text.includes("oxidation") ||
    text.includes("new concrete") ||
    text.includes("painted") ||
    text.includes("restaurant") ||
    text.includes("grease") ||
    text.includes("stucco")
  ) {
    return "High Review";
  }

  if (
    text.includes("wood") ||
    text.includes("paver") ||
    text.includes("plant") ||
    text.includes("degreaser")
  ) {
    return "Moderate";
  }

  return "Standard";
}

function getRiskBadgeClass(risk: string) {
  if (risk === "High Review") return "statusBadge status-pending_admin_approval";
  if (risk === "Moderate") return "statusBadge status-approved";
  return "statusBadge status-paid";
}

export default function TreatmentsPage({ role }: { role: AuthUserRole }) {
  const adminAccess = isAdminRole(role);

  const [treatments, setTreatments] = React.useState<TreatmentItem[]>([]);
  const [search, setSearch] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("all");
  const [riskFilter, setRiskFilter] = React.useState("all");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<TreatmentForm>(emptyForm);
  const [showForm, setShowForm] = React.useState(false);
  const [showCalculator, setShowCalculator] = React.useState(true);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [seeding, setSeeding] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  const [dilutionMode, setDilutionMode] = React.useState<DilutionMode>("percent");
  const [sourcePercent, setSourcePercent] = React.useState("10");
  const [targetPercent, setTargetPercent] = React.useState("1");
  const [totalGallons, setTotalGallons] = React.useState("5");
  const [ouncesPerGallon, setOuncesPerGallon] = React.useState("8");

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

  const categories = uniqueCategories(treatments);

  const visibleTreatments = treatments.filter((treatment) => {
    const matchesCategory =
      categoryFilter === "all" || treatment.category === categoryFilter;

    const risk = getTreatmentRiskLevel(treatment);
    const matchesRisk = riskFilter === "all" || risk === riskFilter;

    return matchesCategory && matchesRisk && includesSearch(treatment, search);
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
    setForm(emptyForm);
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
    setForm(emptyForm);
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

    const payload = formToPayload(form);

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

      setForm(emptyForm);
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

  const percentMix = calculatePercentMix({
    targetPercent: safeNumber(targetPercent),
    sourcePercent: safeNumber(sourcePercent),
    totalGallons: safeNumber(totalGallons)
  });

  const ounceMix = calculateOunceMix({
    ouncesPerGallon: safeNumber(ouncesPerGallon),
    totalGallons: safeNumber(totalGallons)
  });

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

          {adminAccess && (
            <div className="buttonRow">
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

              <button
                className="secondaryButton"
                type="button"
                onClick={() => setShowCalculator((prev) => !prev)}
              >
                {showCalculator ? "Hide Calculator" : "Show Calculator"}
              </button>
            </div>
          )}
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
        <section className="panel">
          <div className="panelHeader">
            <div>
              <h2 className="panelTitle">Dilution Calculator</h2>
              <p className="brandSubtitle">
                Quick field calculator for SH percent mixes and oz-per-gallon product mixes.
              </p>
            </div>
          </div>

          <div className="buttonRow" style={{ marginBottom: 16 }}>
            <button
              className={dilutionMode === "percent" ? "primaryButton" : "secondaryButton"}
              type="button"
              onClick={() => setDilutionMode("percent")}
            >
              Percent Mix
            </button>

            <button
              className={dilutionMode === "ounces" ? "primaryButton" : "secondaryButton"}
              type="button"
              onClick={() => setDilutionMode("ounces")}
            >
              Oz Per Gallon
            </button>
          </div>

          {dilutionMode === "percent" && (
            <>
              <div className="formGrid">
                <label className="fieldLabel">
                  Source Strength %
                  <input
                    className="textInput"
                    inputMode="decimal"
                    value={sourcePercent}
                    onChange={(e) => setSourcePercent(e.target.value)}
                    placeholder="Example: 10"
                  />
                </label>

                <label className="fieldLabel">
                  Target On-Surface %
                  <input
                    className="textInput"
                    inputMode="decimal"
                    value={targetPercent}
                    onChange={(e) => setTargetPercent(e.target.value)}
                    placeholder="Example: 1"
                  />
                </label>

                <label className="fieldLabel">
                  Total Mix Gallons
                  <input
                    className="textInput"
                    inputMode="decimal"
                    value={totalGallons}
                    onChange={(e) => setTotalGallons(e.target.value)}
                    placeholder="Example: 5"
                  />
                </label>
              </div>

              <div className="statsGrid" style={{ marginTop: 16 }}>
                <div className="statCard">
                  <div className="statLabel">Chemical</div>
                  <div className="statValue">{formatNumber(percentMix.chemicalGallons)} gal</div>
                </div>

                <div className="statCard">
                  <div className="statLabel">Water</div>
                  <div className="statValue">{formatNumber(percentMix.waterGallons)} gal</div>
                </div>

                <div className="statCard">
                  <div className="statLabel">Chemical Oz</div>
                  <div className="statValue">{formatNumber(percentMix.chemicalOunces)} oz</div>
                </div>

                <div className="statCard">
                  <div className="statLabel">Water Oz</div>
                  <div className="statValue">{formatNumber(percentMix.waterOunces)} oz</div>
                </div>
              </div>
            </>
          )}

          {dilutionMode === "ounces" && (
            <>
              <div className="formGrid">
                <label className="fieldLabel">
                  Ounces Product Per Gallon
                  <input
                    className="textInput"
                    inputMode="decimal"
                    value={ouncesPerGallon}
                    onChange={(e) => setOuncesPerGallon(e.target.value)}
                    placeholder="Example: 8"
                  />
                </label>

                <label className="fieldLabel">
                  Total Mix Gallons
                  <input
                    className="textInput"
                    inputMode="decimal"
                    value={totalGallons}
                    onChange={(e) => setTotalGallons(e.target.value)}
                    placeholder="Example: 5"
                  />
                </label>
              </div>

              <div className="statsGrid" style={{ marginTop: 16 }}>
                <div className="statCard">
                  <div className="statLabel">Product</div>
                  <div className="statValue">{formatNumber(ounceMix.chemicalOunces)} oz</div>
                </div>

                <div className="statCard">
                  <div className="statLabel">Water</div>
                  <div className="statValue">{formatNumber(ounceMix.waterOunces)} oz</div>
                </div>

                <div className="statCard">
                  <div className="statLabel">Product Gal</div>
                  <div className="statValue">{formatNumber(ounceMix.chemicalGallons)} gal</div>
                </div>

                <div className="statCard">
                  <div className="statLabel">Water Gal</div>
                  <div className="statValue">{formatNumber(ounceMix.waterGallons)} gal</div>
                </div>
              </div>
            </>
          )}

          <div className="listCard" style={{ marginTop: 16 }}>
            Calculator is a field helper only. Always follow product label, company policy,
            surface testing, PPE, runoff control, plant protection, and admin-approved treatment guidance.
          </div>
        </section>
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
              Employees can quickly filter by category, surface, chemical, stain type, risk level, or safety concern.
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
          {visibleTreatments.map((treatment) => {
            const active = selectedTreatment?.id === treatment.id;
            const risk = getTreatmentRiskLevel(treatment);

            return (
              <button
                key={treatment.id}
                className="quoteCard"
                type="button"
                onClick={() => setSelectedId(treatment.id)}
                style={{
                  textAlign: "left",
                  cursor: "pointer",
                  borderColor: active ? "rgba(56, 189, 248, 0.7)" : undefined
                }}
              >
                <div className="quoteTopRow">
                  <div className="quoteNumber">{treatment.name}</div>
                  <span className="statusBadge status-approved">
                    {treatment.category}
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
                  {treatment.surfaceTypes?.length
                    ? treatment.surfaceTypes.join(", ")
                    : "—"}
                </div>
              </button>
            );
          })}

          {visibleTreatments.length === 0 && (
            <div className="listCard">No treatments found for this search/filter.</div>
          )}
        </div>
      </section>

      {selectedTreatment && (
        <section className="panel">
          <div className="panelHeader">
            <div>
              <h2 className="panelTitle">{selectedTreatment.name}</h2>
              <p className="brandSubtitle">
                {selectedTreatment.category} • Treatment guidance and field workflow
              </p>
            </div>

            {adminAccess && (
              <div className="buttonRow">
                <button
                  className="primaryButton"
                  type="button"
                  onClick={() => startEdit(selectedTreatment)}
                >
                  Edit
                </button>

                <button
                  className="secondaryButton"
                  type="button"
                  onClick={() => deleteTreatment(selectedTreatment)}
                >
                  Delete
                </button>
              </div>
            )}
          </div>

          <div className="statsGrid">
            <div className="statCard">
              <div className="statLabel">Category</div>
              <div className="statValue" style={{ fontSize: 18 }}>
                {selectedTreatment.category || "General"}
              </div>
            </div>

            <div className="statCard">
              <div className="statLabel">Risk</div>
              <div className="statValue" style={{ fontSize: 18 }}>
                {getTreatmentRiskLevel(selectedTreatment)}
              </div>
            </div>

            <div className="statCard">
              <div className="statLabel">Surfaces</div>
              <div className="statValue" style={{ fontSize: 18 }}>
                {selectedTreatment.surfaceTypes?.length || 0}
              </div>
            </div>

            <div className="statCard">
              <div className="statLabel">Chemical</div>
              <div className="statValue" style={{ fontSize: 18 }}>
                {selectedTreatment.chemical ? "Listed" : "None"}
              </div>
            </div>
          </div>

          <div className="assignBox" style={{ marginTop: 16 }}>
            <div className="assignTitle">Surface Types</div>
            <div className="buttonRow">
              {(selectedTreatment.surfaceTypes || []).map((surface) => (
                <span key={surface} className="statusBadge status-approved">
                  {surface}
                </span>
              ))}

              {(!selectedTreatment.surfaceTypes ||
                selectedTreatment.surfaceTypes.length === 0) && (
                <div className="cardLine">No surface types listed.</div>
              )}
            </div>
          </div>

          <div className="assignBox">
            <div className="assignTitle">Chemical / Product</div>
            <div className="cardLine">{selectedTreatment.chemical || "—"}</div>
          </div>

          <div className="assignBox">
            <div className="assignTitle">Dilution Ratio</div>
            <div className="cardLine">{selectedTreatment.dilutionRatio || "—"}</div>
          </div>

          <div className="assignBox">
            <div className="assignTitle">Use Case</div>
            <div className="cardLine">{selectedTreatment.useCase || "—"}</div>
          </div>

          <div className="assignBox">
            <div className="assignTitle">Instructions</div>
            <div className="cardLine">{selectedTreatment.instructions || "—"}</div>
          </div>

          <div className="assignBox">
            <div className="assignTitle">Safety Notes</div>
            <div className="cardLine">{selectedTreatment.safetyNotes || "—"}</div>
          </div>

          <div className="assignBox">
            <div className="assignTitle">Cost / Pricing Reference</div>
            <div className="cardLine">{selectedTreatment.costReference || "—"}</div>
          </div>

          {selectedTreatment.purchaseLink && (
            <div className="assignBox">
              <div className="assignTitle">Purchase Link</div>
              <a
                className="primaryButton"
                href={selectedTreatment.purchaseLink}
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
      )}
    </div>
  );
}

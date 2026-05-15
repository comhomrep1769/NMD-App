import React from "react";
import { apiFetch } from "../../api";
import type { TreatmentItem } from "../../types";
import {
  buildTreatmentCaseSummary,
  caseToForm,
  emptyTreatmentCaseForm,
  formToTreatmentCasePayload,
  normalizeTreatmentCase,
  treatmentCaseMatchesSearch,
  treatmentCaseRiskBadgeClass,
  type TreatmentCase,
  type TreatmentCaseFormState
} from "../../types/treatmentCases";
import TreatmentCaseForm from "./TreatmentCaseForm";

function exportCasesToCsv(cases: TreatmentCase[]) {
  const headers = [
    "Title",
    "Treatment",
    "Surface",
    "Condition",
    "Problem",
    "Recommended Mix",
    "Dwell Time",
    "Tools",
    "Steps",
    "Safety",
    "Pricing",
    "Customer Expectation",
    "Risk"
  ];

  const rows = cases.map((item) => [
    item.title,
    item.treatmentName || "",
    item.surfaceType || "",
    item.conditionLevel || "",
    item.problemType || "",
    item.recommendedMix || "",
    item.dwellTime || "",
    item.toolsNeeded || "",
    item.stepByStep || "",
    item.safetyChecklist || "",
    item.pricingNote || "",
    item.customerExpectation || "",
    item.riskLevel || "Standard"
  ]);

  const csv = [headers, ...rows]
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell).replace(/"/g, '""');
          return `"${value}"`;
        })
        .join(",")
    )
    .join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8"
  });

  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `nmd-treatment-cases-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

export default function TreatmentCasesPanel({
  treatments,
  selectedTreatmentId,
  adminAccess
}: {
  treatments: TreatmentItem[];
  selectedTreatmentId: string | null;
  adminAccess: boolean;
}) {
  const [cases, setCases] = React.useState<TreatmentCase[]>([]);
  const [search, setSearch] = React.useState("");
  const [riskFilter, setRiskFilter] = React.useState("all");
  const [linkedOnly, setLinkedOnly] = React.useState(false);
  const [showForm, setShowForm] = React.useState(false);
  const [form, setForm] = React.useState<TreatmentCaseFormState>(emptyTreatmentCaseForm);
  const [expandedCaseId, setExpandedCaseId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  const loadCases = React.useCallback(async () => {
    setError("");

    try {
      const data = await apiFetch<{ cases: TreatmentCase[] }>("/api/treatments/cases");
      setCases((data.cases || []).map(normalizeTreatmentCase));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load treatment cases.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadCases();
  }, [loadCases]);

  const visibleCases = cases.filter((item) => {
    const matchesSearch = treatmentCaseMatchesSearch(item, search);
    const matchesRisk = riskFilter === "all" || item.riskLevel === riskFilter;
    const matchesTreatment =
      !linkedOnly || !selectedTreatmentId || item.treatmentId === selectedTreatmentId;

    return matchesSearch && matchesRisk && matchesTreatment;
  });

  const highReviewCount = cases.filter((item) => item.riskLevel === "High Review").length;
  const linkedCount = cases.filter((item) => Boolean(item.treatmentId)).length;

  const startCreate = () => {
    setForm({
      ...emptyTreatmentCaseForm,
      treatmentId: selectedTreatmentId || ""
    });
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  const startEdit = (item: TreatmentCase) => {
    setForm(caseToForm(item));
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  const cancelForm = () => {
    setForm(emptyTreatmentCaseForm);
    setShowForm(false);
    setError("");
  };

  const updateForm = (field: keyof TreatmentCaseFormState, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const saveCase = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!adminAccess) {
      setError("Only Admin or Super Admin can manage treatment cases.");
      return;
    }

    if (!form.title.trim()) {
      setError("Case title is required.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    const payload = formToTreatmentCasePayload(form);

    try {
      if (form.id) {
        const data = await apiFetch<{ case: TreatmentCase }>(
          `/api/treatments/cases/${form.id}`,
          {
            method: "PATCH",
            body: JSON.stringify(payload)
          }
        );

        const updated = normalizeTreatmentCase(data.case);

        setCases((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        setExpandedCaseId(updated.id);
        setSuccess("Treatment case updated.");
      } else {
        const data = await apiFetch<{ case: TreatmentCase }>("/api/treatments/cases", {
          method: "POST",
          body: JSON.stringify(payload)
        });

        const created = normalizeTreatmentCase(data.case);

        setCases((prev) =>
          [...prev, created].sort((a, b) => a.title.localeCompare(b.title))
        );
        setExpandedCaseId(created.id);
        setSuccess("Treatment case created.");
      }

      setForm(emptyTreatmentCaseForm);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save treatment case.");
    } finally {
      setSaving(false);
    }
  };

  const deleteCase = async (item: TreatmentCase) => {
    if (!adminAccess) {
      setError("Only Admin or Super Admin can delete treatment cases.");
      return;
    }

    const ok = window.confirm(`Delete treatment case "${item.title}"?`);
    if (!ok) return;

    setError("");
    setSuccess("");

    try {
      await apiFetch(`/api/treatments/cases/${item.id}`, {
        method: "DELETE"
      });

      setCases((prev) => prev.filter((caseItem) => caseItem.id !== item.id));
      setExpandedCaseId(null);
      setSuccess("Treatment case deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete treatment case.");
    }
  };

  const copyCase = async (item: TreatmentCase) => {
    const summary = buildTreatmentCaseSummary(item);

    try {
      await navigator.clipboard.writeText(summary);
      setSuccess("Treatment case copied for Guru/job notes.");
    } catch {
      window.alert(summary);
    }
  };

  if (loading) {
    return (
      <section className="panel">
        <h2 className="panelTitle">Treatment Cases</h2>
        <div className="listCard">Loading treatment cases...</div>
      </section>
    );
  }

  return (
    <>
      {showForm && adminAccess && (
        <TreatmentCaseForm
          form={form}
          treatments={treatments}
          saving={saving}
          onChange={updateForm}
          onSubmit={saveCase}
          onCancel={cancelForm}
        />
      )}

      <section className="panel">
        <div className="panelHeader">
          <div>
            <h2 className="panelTitle">Treatment Cases</h2>
            <p className="brandSubtitle">
              Case-based field guidance for surfaces, conditions, problems, safety, pricing, and customer expectations.
            </p>
          </div>

          <div className="buttonRow">
            {adminAccess && (
              <button className="primaryButton" type="button" onClick={startCreate}>
                Add Case
              </button>
            )}

            <button
              className="secondaryButton"
              type="button"
              onClick={() => exportCasesToCsv(visibleCases)}
              disabled={visibleCases.length === 0}
            >
              Export Cases CSV
            </button>
          </div>
        </div>

        {error && <div className="errorBox">{error}</div>}
        {success && <div className="listCard">{success}</div>}

        <div className="statsGrid" style={{ marginTop: 16 }}>
          <div className="statCard">
            <div className="statLabel">Cases</div>
            <div className="statValue">{cases.length}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Visible</div>
            <div className="statValue">{visibleCases.length}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">High Review</div>
            <div className="statValue">{highReviewCount}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Linked</div>
            <div className="statValue">{linkedCount}</div>
          </div>
        </div>

        <div className="formGrid" style={{ marginTop: 16 }}>
          <input
            className="textInput"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cases: rust, roof, wood, oil, oxidation, safety..."
          />

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

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              color: "var(--muted)",
              fontWeight: 800
            }}
          >
            <input
              type="checkbox"
              checked={linkedOnly}
              onChange={(e) => setLinkedOnly(e.target.checked)}
            />
            Show only cases linked to selected treatment
          </label>
        </div>

        <div className="cardsGrid" style={{ marginTop: 16 }}>
          {visibleCases.map((item) => {
            const expanded = expandedCaseId === item.id;

            return (
              <div key={item.id} className="quoteCard">
                <div className="quoteTopRow">
                  <div className="quoteNumber">{item.title}</div>
                  <span className={treatmentCaseRiskBadgeClass(item.riskLevel)}>
                    {item.riskLevel || "Standard"}
                  </span>
                </div>

                <div className="cardLine">
                  <strong>Treatment:</strong> {item.treatmentName || "Not linked"}
                </div>

                <div className="cardLine">
                  <strong>Surface:</strong> {item.surfaceType || "—"}
                </div>

                <div className="cardLine">
                  <strong>Problem:</strong> {item.problemType || "—"}
                </div>

                <div className="buttonRow" style={{ marginTop: 12 }}>
                  <button
                    className="secondaryButton"
                    type="button"
                    onClick={() => setExpandedCaseId(expanded ? null : item.id)}
                  >
                    {expanded ? "Hide Details" : "View Details"}
                  </button>

                  <button
                    className="secondaryButton"
                    type="button"
                    onClick={() => copyCase(item)}
                  >
                    Copy Summary
                  </button>

                  {adminAccess && (
                    <>
                      <button
                        className="primaryButton"
                        type="button"
                        onClick={() => startEdit(item)}
                      >
                        Edit
                      </button>

                      <button
                        className="secondaryButton"
                        type="button"
                        onClick={() => deleteCase(item)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>

                {expanded && (
                  <div style={{ marginTop: 14 }}>
                    <div className="assignBox">
                      <div className="assignTitle">Recommended Mix</div>
                      <div className="cardLine">{item.recommendedMix || "—"}</div>
                    </div>

                    <div className="assignBox">
                      <div className="assignTitle">Dwell Time</div>
                      <div className="cardLine">{item.dwellTime || "—"}</div>
                    </div>

                    <div className="assignBox">
                      <div className="assignTitle">Tools Needed</div>
                      <div className="cardLine">{item.toolsNeeded || "—"}</div>
                    </div>

                    <div className="assignBox">
                      <div className="assignTitle">Step By Step</div>
                      <div className="cardLine">{item.stepByStep || "—"}</div>
                    </div>

                    <div className="assignBox">
                      <div className="assignTitle">Safety Checklist</div>
                      <div className="cardLine">{item.safetyChecklist || "—"}</div>
                    </div>

                    <div className="assignBox">
                      <div className="assignTitle">Pricing Note</div>
                      <div className="cardLine">{item.pricingNote || "—"}</div>
                    </div>

                    <div className="assignBox">
                      <div className="assignTitle">Customer Expectation</div>
                      <div className="cardLine">{item.customerExpectation || "—"}</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {visibleCases.length === 0 && (
            <div className="listCard">No treatment cases found.</div>
          )}
        </div>
      </section>
    </>
  );
}

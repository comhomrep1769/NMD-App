import React from "react";
import { apiFetch } from "../../api";
import type { TreatmentItem } from "../../types";
import type { TreatmentCase } from "../../types/treatmentCases";
import { treatmentCaseRiskBadgeClass } from "../../types/treatmentCases";

type TreatmentWorkflowForm = {
  id: string;
  treatmentId: string;
  title: string;
  surfaceType: string;
  conditionLevel: string;
  problemType: string;
  recommendedMix: string;
  dwellTime: string;
  toolsNeeded: string;
  stepByStep: string;
  safetyChecklist: string;
  pricingNote: string;
  customerExpectation: string;
  riskLevel: string;
};

const emptyWorkflowForm: TreatmentWorkflowForm = {
  id: "",
  treatmentId: "",
  title: "",
  surfaceType: "",
  conditionLevel: "",
  problemType: "",
  recommendedMix: "",
  dwellTime: "",
  toolsNeeded: "",
  stepByStep: "",
  safetyChecklist: "",
  pricingNote: "",
  customerExpectation: "",
  riskLevel: "Standard"
};

function workflowToForm(item: TreatmentCase): TreatmentWorkflowForm {
  return {
    id: item.id || "",
    treatmentId: item.treatmentId || "",
    title: item.title || "",
    surfaceType: item.surfaceType || "",
    conditionLevel: item.conditionLevel || "",
    problemType: item.problemType || "",
    recommendedMix: item.recommendedMix || "",
    dwellTime: item.dwellTime || "",
    toolsNeeded: item.toolsNeeded || "",
    stepByStep: item.stepByStep || "",
    safetyChecklist: item.safetyChecklist || "",
    pricingNote: item.pricingNote || "",
    customerExpectation: item.customerExpectation || "",
    riskLevel: item.riskLevel || "Standard"
  };
}

function formToPayload(form: TreatmentWorkflowForm) {
  return {
    treatmentId: form.treatmentId || null,
    title: form.title.trim(),
    surfaceType: form.surfaceType.trim(),
    conditionLevel: form.conditionLevel.trim(),
    problemType: form.problemType.trim(),
    recommendedMix: form.recommendedMix.trim(),
    dwellTime: form.dwellTime.trim(),
    toolsNeeded: form.toolsNeeded.trim(),
    stepByStep: form.stepByStep.trim(),
    safetyChecklist: form.safetyChecklist.trim(),
    pricingNote: form.pricingNote.trim(),
    customerExpectation: form.customerExpectation.trim(),
    riskLevel: form.riskLevel || "Standard"
  };
}

function workflowMatchesSearch(item: TreatmentCase, search: string) {
  const value = search.trim().toLowerCase();

  if (!value) return true;

  const haystack = [
    item.title,
    item.treatmentName,
    item.treatmentCategory,
    item.surfaceType,
    item.conditionLevel,
    item.problemType,
    item.recommendedMix,
    item.dwellTime,
    item.toolsNeeded,
    item.stepByStep,
    item.safetyChecklist,
    item.pricingNote,
    item.customerExpectation,
    item.riskLevel
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(value);
}

function getLinkedTreatmentName(item: TreatmentCase, treatments: TreatmentItem[]) {
  if (item.treatmentName) return item.treatmentName;

  const treatment = treatments.find((entry) => entry.id === item.treatmentId);
  return treatment?.name || "General / Not linked";
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
  const [workflows, setWorkflows] = React.useState<TreatmentCase[]>([]);
  const [search, setSearch] = React.useState("");
  const [riskFilter, setRiskFilter] = React.useState("all");
  const [treatmentFilter, setTreatmentFilter] = React.useState("all");
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [showForm, setShowForm] = React.useState(false);
  const [form, setForm] = React.useState<TreatmentWorkflowForm>(emptyWorkflowForm);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  const loadWorkflows = React.useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await apiFetch<{ cases: TreatmentCase[] }>("/api/treatments/cases");
      setWorkflows(data.cases || []);
    } catch (err) {
      setWorkflows([]);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load treatments. Make sure treatments have been uploaded."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadWorkflows();
  }, [loadWorkflows]);

  const visibleWorkflows = workflows.filter((item) => {
    const matchesTreatment =
      treatmentFilter === "all" ||
      item.treatmentId === treatmentFilter ||
      (!item.treatmentId && treatmentFilter === "unlinked");

    const matchesRisk =
      riskFilter === "all" ||
      String(item.riskLevel || "").toLowerCase() === riskFilter.toLowerCase();

    return matchesTreatment && matchesRisk && workflowMatchesSearch(item, search);
  });

  const startCreate = () => {
    if (!adminAccess) {
      setError("Only Admin or Super Admin can add treatments.");
      return;
    }

    setForm({
      ...emptyWorkflowForm,
      treatmentId: selectedTreatmentId || ""
    });
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  const startEdit = (item: TreatmentCase) => {
    if (!adminAccess) {
      setError("Only Admin or Super Admin can edit treatments.");
      return;
    }

    setForm(workflowToForm(item));
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  const cancelForm = () => {
    setForm(emptyWorkflowForm);
    setShowForm(false);
    setError("");
  };

  const updateForm = (field: keyof TreatmentWorkflowForm, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const saveWorkflow = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!adminAccess) {
      setError("Only Admin or Super Admin can save treatments.");
      return;
    }

    if (!form.title.trim()) {
      setError("Treatment title is required.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (form.id) {
        const data = await apiFetch<{ case: TreatmentCase }>(
          `/api/treatments/cases/${form.id}`,
          {
            method: "PATCH",
            body: JSON.stringify(formToPayload(form))
          }
        );

        setWorkflows((prev) =>
          prev.map((item) => (item.id === data.case.id ? data.case : item))
        );

        setExpandedId(data.case.id);
        setSuccess("Treatment updated.");
      } else {
        const data = await apiFetch<{ case: TreatmentCase }>("/api/treatments/cases", {
          method: "POST",
          body: JSON.stringify(formToPayload(form))
        });

        setWorkflows((prev) => [data.case, ...prev]);
        setExpandedId(data.case.id);
        setSuccess("Treatment created.");
      }

      setForm(emptyWorkflowForm);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save treatment.");
    } finally {
      setSaving(false);
    }
  };

  const deleteWorkflow = async (item: TreatmentCase) => {
    if (!adminAccess) {
      setError("Only Admin or Super Admin can delete treatments.");
      return;
    }

    const ok = window.confirm(`Delete treatment "${item.title}"?`);
    if (!ok) return;

    setError("");
    setSuccess("");

    try {
      await apiFetch(`/api/treatments/cases/${item.id}`, {
        method: "DELETE"
      });

      setWorkflows((prev) => prev.filter((entry) => entry.id !== item.id));
      setExpandedId(null);
      setSuccess("Treatment deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete treatment.");
    }
  };

  const copyWorkflow = async (item: TreatmentCase) => {
    const text = [
      `Treatment: ${item.title}`,
      `Linked Treatment Type: ${getLinkedTreatmentName(item, treatments)}`,
      `Surface: ${item.surfaceType || "—"}`,
      `Condition: ${item.conditionLevel || "—"}`,
      `Problem: ${item.problemType || "—"}`,
      `Recommended Mix: ${item.recommendedMix || "—"}`,
      `Dwell Time: ${item.dwellTime || "—"}`,
      `Tools Needed: ${item.toolsNeeded || "—"}`,
      `Steps: ${item.stepByStep || "—"}`,
      `Safety: ${item.safetyChecklist || "—"}`,
      `Pricing Note: ${item.pricingNote || "—"}`,
      `Customer Expectation: ${item.customerExpectation || "—"}`,
      `Risk Level: ${item.riskLevel || "Standard"}`
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setSuccess("Treatment copied.");
    } catch {
      window.alert(text);
    }
  };

  if (loading) {
    return (
      <section className="panel">
        <h2 className="panelTitle">Treatments</h2>
        <div className="listCard">Loading treatments...</div>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <h2 className="panelTitle">Treatments</h2>
          <p className="brandSubtitle">
            Detailed treatment workflows for surfaces, stains, chemistry, safety, customer
            expectations, and field decisions.
          </p>
        </div>

        <div className="buttonRow">
          <button className="secondaryButton" type="button" onClick={loadWorkflows}>
            Refresh Treatments
          </button>

          {adminAccess && (
            <button className="primaryButton" type="button" onClick={startCreate}>
              Add Treatment
            </button>
          )}
        </div>
      </div>

      {error && <div className="errorBox">{error}</div>}
      {success && <div className="listCard">{success}</div>}

      {workflows.length === 0 && (
        <div className="errorBox">
          No treatments are available yet. Admin or Super Admin needs to seed defaults
          or upload treatments. Employees are read-only and cannot create treatment data.
        </div>
      )}

      <div className="statsGrid" style={{ marginTop: 16 }}>
        <div className="statCard">
          <div className="statLabel">Treatments</div>
          <div className="statValue">{workflows.length}</div>
        </div>

        <div className="statCard">
          <div className="statLabel">Visible</div>
          <div className="statValue">{visibleWorkflows.length}</div>
        </div>

        <div className="statCard">
          <div className="statLabel">High Review</div>
          <div className="statValue">
            {
              workflows.filter(
                (item) => String(item.riskLevel || "").toLowerCase() === "high review"
              ).length
            }
          </div>
        </div>

        <div className="statCard">
          <div className="statLabel">Treatment Types</div>
          <div className="statValue">{treatments.length}</div>
        </div>
      </div>

      <div className="formGrid" style={{ marginTop: 16 }}>
        <label className="fieldLabel">
          Search Treatments
          <input
            className="textInput"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search: rust, roof, painted driveway, oxidation, concrete..."
          />
        </label>

        <label className="fieldLabel">
          Treatment Type
          <select
            className="textInput"
            value={treatmentFilter}
            onChange={(e) => setTreatmentFilter(e.target.value)}
          >
            <option value="all">All Treatments</option>
            <option value="unlinked">Unlinked / General</option>
            {treatments.map((treatment) => (
              <option key={treatment.id} value={treatment.id}>
                {treatment.name}
              </option>
            ))}
          </select>
        </label>

        <label className="fieldLabel">
          Risk Level
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
        </label>
      </div>

      {showForm && adminAccess && (
        <form className="formGrid" onSubmit={saveWorkflow} style={{ marginTop: 16 }}>
          <label className="fieldLabel">
            Treatment Type
            <select
              className="textInput"
              value={form.treatmentId}
              onChange={(e) => updateForm("treatmentId", e.target.value)}
            >
              <option value="">General / Not Linked</option>
              {treatments.map((treatment) => (
                <option key={treatment.id} value={treatment.id}>
                  {treatment.name}
                </option>
              ))}
            </select>
          </label>

          <label className="fieldLabel">
            Treatment Title
            <input
              className="textInput"
              value={form.title}
              onChange={(e) => updateForm("title", e.target.value)}
              placeholder="Example: Heavy Irrigation Rust On Concrete"
            />
          </label>

          <label className="fieldLabel">
            Risk Level
            <select
              className="textInput"
              value={form.riskLevel}
              onChange={(e) => updateForm("riskLevel", e.target.value)}
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
              onChange={(e) => updateForm("surfaceType", e.target.value)}
              placeholder="Concrete, roof, vinyl, wood, pavers..."
            />
          </label>

          <label className="fieldLabel">
            Condition Level
            <input
              className="textInput"
              value={form.conditionLevel}
              onChange={(e) => updateForm("conditionLevel", e.target.value)}
              placeholder="Light, moderate, heavy, severe..."
            />
          </label>

          <label className="fieldLabel">
            Problem Type
            <input
              className="textInput"
              value={form.problemType}
              onChange={(e) => updateForm("problemType", e.target.value)}
              placeholder="Rust, organic growth, oxidation, stripes..."
            />
          </label>

          <label className="fieldLabel">
            Recommended Mix
            <textarea
              className="textInput"
              rows={3}
              value={form.recommendedMix}
              onChange={(e) => updateForm("recommendedMix", e.target.value)}
            />
          </label>

          <label className="fieldLabel">
            Dwell Time
            <textarea
              className="textInput"
              rows={3}
              value={form.dwellTime}
              onChange={(e) => updateForm("dwellTime", e.target.value)}
            />
          </label>

          <label className="fieldLabel">
            Tools Needed
            <textarea
              className="textInput"
              rows={3}
              value={form.toolsNeeded}
              onChange={(e) => updateForm("toolsNeeded", e.target.value)}
            />
          </label>

          <label className="fieldLabel">
            Step-by-Step
            <textarea
              className="textInput"
              rows={4}
              value={form.stepByStep}
              onChange={(e) => updateForm("stepByStep", e.target.value)}
            />
          </label>

          <label className="fieldLabel">
            Safety Checklist
            <textarea
              className="textInput"
              rows={4}
              value={form.safetyChecklist}
              onChange={(e) => updateForm("safetyChecklist", e.target.value)}
            />
          </label>

          <label className="fieldLabel">
            Pricing Note
            <textarea
              className="textInput"
              rows={3}
              value={form.pricingNote}
              onChange={(e) => updateForm("pricingNote", e.target.value)}
            />
          </label>

          <label className="fieldLabel">
            Customer Expectation
            <textarea
              className="textInput"
              rows={3}
              value={form.customerExpectation}
              onChange={(e) => updateForm("customerExpectation", e.target.value)}
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
      )}

      <div className="cardsGrid" style={{ marginTop: 16 }}>
        {visibleWorkflows.map((item) => {
          const expanded = expandedId === item.id;

          return (
            <div key={item.id} className="quoteCard">
              <div className="quoteTopRow">
                <div className="quoteNumber">{item.title}</div>
                <span className={treatmentCaseRiskBadgeClass(item.riskLevel)}>
                  {item.riskLevel || "Standard"}
                </span>
              </div>

              <div className="cardLine">
                <strong>Treatment Type:</strong> {getLinkedTreatmentName(item, treatments)}
              </div>

              <div className="cardLine">
                <strong>Surface:</strong> {item.surfaceType || "—"}
              </div>

              <div className="cardLine">
                <strong>Problem:</strong> {item.problemType || "—"}
              </div>

              <div className="cardLine">
                <strong>Mix:</strong> {item.recommendedMix || "—"}
              </div>

              <div className="buttonRow" style={{ marginTop: 12 }}>
                <button
                  className="secondaryButton"
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : item.id)}
                >
                  {expanded ? "Hide Details" : "View Details"}
                </button>

                <button
                  className="primaryButton"
                  type="button"
                  onClick={() => copyWorkflow(item)}
                >
                  Copy Treatment
                </button>

                {adminAccess && (
                  <>
                    <button
                      className="secondaryButton"
                      type="button"
                      onClick={() => startEdit(item)}
                    >
                      Edit
                    </button>

                    <button
                      className="dangerButton"
                      type="button"
                      onClick={() => deleteWorkflow(item)}
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>

              {expanded && (
                <div style={{ marginTop: 14 }}>
                  <div className="assignBox">
                    <div className="assignTitle">Condition / Dwell</div>
                    <div className="cardLine">
                      <strong>Condition:</strong> {item.conditionLevel || "—"}
                    </div>
                    <div className="cardLine">
                      <strong>Dwell:</strong> {item.dwellTime || "—"}
                    </div>
                  </div>

                  <div className="assignBox">
                    <div className="assignTitle">Tools Needed</div>
                    <div className="cardLine">{item.toolsNeeded || "—"}</div>
                  </div>

                  <div className="assignBox">
                    <div className="assignTitle">Step-by-Step</div>
                    <div className="cardLine" style={{ whiteSpace: "pre-wrap" }}>
                      {item.stepByStep || "—"}
                    </div>
                  </div>

                  <div className="assignBox">
                    <div className="assignTitle">Safety Checklist</div>
                    <div className="cardLine" style={{ whiteSpace: "pre-wrap" }}>
                      {item.safetyChecklist || "—"}
                    </div>
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

        {visibleWorkflows.length === 0 && (
          <div className="listCard">
            No treatments match this filter. Clear filters, refresh treatments, or upload treatment records.
          </div>
        )}
      </div>
    </section>
  );
}

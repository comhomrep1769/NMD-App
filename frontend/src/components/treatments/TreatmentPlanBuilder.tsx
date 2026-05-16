import React from "react";
import { apiFetch } from "../../api";
import type { TreatmentItem } from "../../types";
import {
  normalizeTreatmentCase,
  treatmentCaseMatchesSearch,
  treatmentCaseRiskBadgeClass,
  type TreatmentCase
} from "../../types/treatmentCases";
import {
  buildTreatmentPlanFromForm,
  emptyTreatmentPlanForm,
  normalizeTreatmentPlan,
  type TreatmentPlan,
  type TreatmentPlanFormState
} from "../../types/treatmentPlans";
import {
  buildTreatmentPlanText,
  getSelectedTreatmentCases,
  getSelectedTreatments
} from "../../utils/treatmentPlanHelpers";
import { getTreatmentRiskLevel } from "../../utils/treatmentHelpers";
import TreatmentPlanPreview from "./TreatmentPlanPreview";

export default function TreatmentPlanBuilder({
  treatments,
  selectedTreatmentId,
  onClose,
  onPlanSaved
}: {
  treatments: TreatmentItem[];
  selectedTreatmentId: string | null;
  onClose: () => void;
  onPlanSaved?: (plan: TreatmentPlan) => void;
}) {
  const [cases, setCases] = React.useState<TreatmentCase[]>([]);
  const [caseSearch, setCaseSearch] = React.useState("");
  const [treatmentSearch, setTreatmentSearch] = React.useState("");
  const [loadingCases, setLoadingCases] = React.useState(true);
  const [savingPlan, setSavingPlan] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");
  const [plan, setPlan] = React.useState<TreatmentPlan | null>(null);

  const [form, setForm] = React.useState<TreatmentPlanFormState>(() => ({
    ...emptyTreatmentPlanForm,
    selectedTreatmentIds: selectedTreatmentId ? [selectedTreatmentId] : []
  }));

  React.useEffect(() => {
    setLoadingCases(true);

    apiFetch<{ cases: TreatmentCase[] }>("/api/treatments/cases")
      .then((data) => {
        setCases((data.cases || []).map(normalizeTreatmentCase));
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load treatment cases.");
      })
      .finally(() => setLoadingCases(false));
  }, []);

  const updateForm = (
    field: keyof TreatmentPlanFormState,
    value: string | string[]
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleTreatment = (treatmentId: string) => {
    setForm((prev) => {
      const selected = new Set(prev.selectedTreatmentIds);

      if (selected.has(treatmentId)) {
        selected.delete(treatmentId);
      } else {
        selected.add(treatmentId);
      }

      return {
        ...prev,
        selectedTreatmentIds: Array.from(selected)
      };
    });
  };

  const toggleCase = (caseId: string) => {
    setForm((prev) => {
      const selected = new Set(prev.selectedCaseIds);

      if (selected.has(caseId)) {
        selected.delete(caseId);
      } else {
        selected.add(caseId);
      }

      return {
        ...prev,
        selectedCaseIds: Array.from(selected)
      };
    });
  };

  const visibleTreatments = treatments.filter((treatment) => {
    if (!treatmentSearch.trim()) return true;

    const q = treatmentSearch.toLowerCase();

    return [
      treatment.name,
      treatment.category,
      treatment.chemical,
      treatment.dilutionRatio,
      treatment.useCase,
      treatment.safetyNotes,
      ...(treatment.surfaceTypes || [])
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(q);
  });

  const visibleCases = cases.filter((item) => treatmentCaseMatchesSearch(item, caseSearch));

  const selectedTreatments = getSelectedTreatments(
    treatments,
    form.selectedTreatmentIds
  );

  const selectedCases = getSelectedTreatmentCases(cases, form.selectedCaseIds);

  const generatePlan = (event: React.FormEvent) => {
    event.preventDefault();

    const createdPlan = buildTreatmentPlanFromForm(form);
    const planText = buildTreatmentPlanText({
      plan: createdPlan,
      treatments: selectedTreatments,
      cases: selectedCases
    });

    setPlan({
      ...createdPlan,
      planText
    });
  };

  const savePlanToDatabase = async () => {
    const draftPlan = plan || buildTreatmentPlanFromForm(form);
    const planText = buildTreatmentPlanText({
      plan: draftPlan,
      treatments: selectedTreatments,
      cases: selectedCases
    });

    if (!draftPlan.jobName.trim()) {
      setError("Job name is required before saving a treatment plan.");
      return;
    }

    setSavingPlan(true);
    setError("");
    setSuccess("");

    try {
      const data = await apiFetch<{ plan: TreatmentPlan }>("/api/treatments/plans", {
        method: "POST",
        body: JSON.stringify({
          ...draftPlan,
          selectedTreatmentIds: form.selectedTreatmentIds,
          selectedCaseIds: form.selectedCaseIds,
          planText
        })
      });

      const saved = normalizeTreatmentPlan(data.plan);

      setPlan(saved);
      setSuccess("Treatment plan saved to database.");

      if (onPlanSaved) {
        onPlanSaved(saved);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save treatment plan.");
    } finally {
      setSavingPlan(false);
    }
  };

  if (plan) {
    return (
      <>
        {success && <div className="listCard">{success}</div>}
        {error && <div className="errorBox">{error}</div>}

        <TreatmentPlanPreview
          plan={plan}
          treatments={selectedTreatments}
          cases={selectedCases}
          onClose={() => setPlan(null)}
        />

        <section className="panel">
          <div className="buttonRow">
            <button
              className="primaryButton"
              type="button"
              onClick={savePlanToDatabase}
              disabled={savingPlan}
            >
              {savingPlan ? "Saving Plan..." : "Save Plan To Database"}
            </button>

            <button className="secondaryButton" type="button" onClick={onClose}>
              Close Builder
            </button>
          </div>
        </section>
      </>
    );
  }

  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <h2 className="panelTitle">Job Treatment Plan Builder</h2>
          <p className="brandSubtitle">
            Build a field-ready treatment plan using saved treatments and cases.
          </p>
        </div>

        <button className="secondaryButton" type="button" onClick={onClose}>
          Close Builder
        </button>
      </div>

      {error && <div className="errorBox">{error}</div>}
      {success && <div className="listCard">{success}</div>}

      <form className="formGrid" onSubmit={generatePlan}>
        <label className="fieldLabel">
          Job Name
          <input
            className="textInput"
            value={form.jobName}
            onChange={(e) => updateForm("jobName", e.target.value)}
            placeholder="Example: Smith roof and house wash"
          />
        </label>

        <label className="fieldLabel">
          Client Name
          <input
            className="textInput"
            value={form.clientName}
            onChange={(e) => updateForm("clientName", e.target.value)}
            placeholder="Client name"
          />
        </label>

        <label className="fieldLabel">
          Service Address
          <input
            className="textInput"
            value={form.serviceAddress}
            onChange={(e) => updateForm("serviceAddress", e.target.value)}
            placeholder="Job address"
          />
        </label>

        <label className="fieldLabel">
          Surface Type
          <input
            className="textInput"
            value={form.surfaceType}
            onChange={(e) => updateForm("surfaceType", e.target.value)}
            placeholder="Concrete, roof, vinyl, pavers, wood..."
          />
        </label>

        <label className="fieldLabel">
          Condition Level
          <input
            className="textInput"
            value={form.conditionLevel}
            onChange={(e) => updateForm("conditionLevel", e.target.value)}
            placeholder="Light, moderate, heavy, severe, damaged..."
          />
        </label>

        <label className="fieldLabel">
          Job Notes
          <textarea
            className="textInput"
            rows={4}
            value={form.notes}
            onChange={(e) => updateForm("notes", e.target.value)}
            placeholder="Access, photos, client concerns, plant protection, runoff, risks..."
          />
        </label>

        <div className="buttonRow">
          <button className="primaryButton" type="submit">
            Generate Treatment Plan
          </button>

          <button
            className="secondaryButton"
            type="button"
            onClick={savePlanToDatabase}
            disabled={savingPlan}
          >
            {savingPlan ? "Saving..." : "Save Directly"}
          </button>

          <button
            className="secondaryButton"
            type="button"
            onClick={() =>
              setForm({
                ...emptyTreatmentPlanForm,
                selectedTreatmentIds: selectedTreatmentId ? [selectedTreatmentId] : []
              })
            }
          >
            Reset
          </button>
        </div>
      </form>

      <div className="statsGrid" style={{ marginTop: 16 }}>
        <div className="statCard">
          <div className="statLabel">Selected Treatments</div>
          <div className="statValue">{form.selectedTreatmentIds.length}</div>
        </div>

        <div className="statCard">
          <div className="statLabel">Selected Cases</div>
          <div className="statValue">{form.selectedCaseIds.length}</div>
        </div>

        <div className="statCard">
          <div className="statLabel">Available Treatments</div>
          <div className="statValue">{treatments.length}</div>
        </div>

        <div className="statCard">
          <div className="statLabel">Available Cases</div>
          <div className="statValue">{cases.length}</div>
        </div>
      </div>

      <section className="assignBox" style={{ marginTop: 16 }}>
        <div className="assignTitle">Select Treatments</div>

        <input
          className="textInput"
          value={treatmentSearch}
          onChange={(e) => setTreatmentSearch(e.target.value)}
          placeholder="Search treatments to add..."
          style={{ marginBottom: 12 }}
        />

        <div className="cardsGrid">
          {visibleTreatments.map((treatment) => {
            const checked = form.selectedTreatmentIds.includes(treatment.id);

            return (
              <button
                key={treatment.id}
                className="quoteCard"
                type="button"
                onClick={() => toggleTreatment(treatment.id)}
                style={{
                  textAlign: "left",
                  cursor: "pointer",
                  borderColor: checked ? "rgba(56, 189, 248, 0.75)" : undefined
                }}
              >
                <div className="quoteTopRow">
                  <div className="quoteNumber">{treatment.name}</div>
                  <span className="statusBadge status-approved">
                    {checked ? "Selected" : treatment.category}
                  </span>
                </div>

                <div className="cardLine">
                  <strong>Risk:</strong> {getTreatmentRiskLevel(treatment)}
                </div>

                <div className="cardLine">
                  <strong>Chemical:</strong> {treatment.chemical || "—"}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="assignBox">
        <div className="assignTitle">Select Treatment Cases</div>

        {loadingCases && <div className="listCard">Loading cases...</div>}

        <input
          className="textInput"
          value={caseSearch}
          onChange={(e) => setCaseSearch(e.target.value)}
          placeholder="Search cases to add..."
          style={{ marginBottom: 12 }}
        />

        <div className="cardsGrid">
          {visibleCases.map((item) => {
            const checked = form.selectedCaseIds.includes(item.id);

            return (
              <button
                key={item.id}
                className="quoteCard"
                type="button"
                onClick={() => toggleCase(item.id)}
                style={{
                  textAlign: "left",
                  cursor: "pointer",
                  borderColor: checked ? "rgba(56, 189, 248, 0.75)" : undefined
                }}
              >
                <div className="quoteTopRow">
                  <div className="quoteNumber">{item.title}</div>
                  <span className={treatmentCaseRiskBadgeClass(item.riskLevel)}>
                    {checked ? "Selected" : item.riskLevel}
                  </span>
                </div>

                <div className="cardLine">
                  <strong>Treatment:</strong> {item.treatmentName || "Not linked"}
                </div>

                <div className="cardLine">
                  <strong>Problem:</strong> {item.problemType || "—"}
                </div>
              </button>
            );
          })}

          {!loadingCases && visibleCases.length === 0 && (
            <div className="listCard">No cases found.</div>
          )}
        </div>
      </section>
    </section>
  );
}

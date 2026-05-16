import React from "react";
import { apiFetch } from "../../api";
import type { TreatmentItem } from "../../types";
import type { TreatmentCase } from "../../types/treatmentCases";
import {
  normalizeTreatmentPlan,
  type TreatmentPlan
} from "../../types/treatmentPlans";
import {
  copyTreatmentPlan,
  downloadTreatmentPlan,
  getSelectedTreatmentCases,
  getSelectedTreatments,
  printTreatmentPlan
} from "../../utils/treatmentPlanHelpers";

export default function SavedTreatmentPlansPanel({
  treatments,
  casesRefreshKey
}: {
  treatments: TreatmentItem[];
  casesRefreshKey?: number;
}) {
  const [plans, setPlans] = React.useState<TreatmentPlan[]>([]);
  const [cases, setCases] = React.useState<TreatmentCase[]>([]);
  const [search, setSearch] = React.useState("");
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  const loadData = React.useCallback(async () => {
    setError("");

    try {
      const [plansData, casesData] = await Promise.all([
        apiFetch<{ plans: TreatmentPlan[] }>("/api/treatments/plans"),
        apiFetch<{ cases: TreatmentCase[] }>("/api/treatments/cases")
      ]);

      setPlans((plansData.plans || []).map(normalizeTreatmentPlan));
      setCases(casesData.cases || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load saved treatment plans.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData, casesRefreshKey]);

  const searchPlans = async () => {
    setLoading(true);
    setError("");

    try {
      const query = search.trim()
        ? `/api/treatments/plans?search=${encodeURIComponent(search.trim())}`
        : "/api/treatments/plans";

      const data = await apiFetch<{ plans: TreatmentPlan[] }>(query);
      setPlans((data.plans || []).map(normalizeTreatmentPlan));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to search saved plans.");
    } finally {
      setLoading(false);
    }
  };

  const deletePlan = async (plan: TreatmentPlan) => {
    const ok = window.confirm(`Delete saved treatment plan "${plan.jobName}"?`);
    if (!ok) return;

    setError("");
    setSuccess("");

    try {
      await apiFetch(`/api/treatments/plans/${plan.id}`, {
        method: "DELETE"
      });

      setPlans((prev) => prev.filter((item) => item.id !== plan.id));
      setExpandedId(null);
      setSuccess("Saved treatment plan deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete treatment plan.");
    }
  };

  const getPlanTreatments = (plan: TreatmentPlan) =>
    getSelectedTreatments(treatments, plan.selectedTreatmentIds);

  const getPlanCases = (plan: TreatmentPlan) =>
    getSelectedTreatmentCases(cases, plan.selectedCaseIds);

  const copyPlan = async (plan: TreatmentPlan) => {
    const copied = await copyTreatmentPlan({
      plan,
      treatments: getPlanTreatments(plan),
      cases: getPlanCases(plan)
    });

    if (copied) {
      setSuccess("Treatment plan copied.");
    }
  };

  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <h2 className="panelTitle">Saved Treatment Plans</h2>
          <p className="brandSubtitle">
            Saved job treatment plans for field notes, job prep, and future Guru retrieval.
          </p>
        </div>

        <button className="secondaryButton" type="button" onClick={loadData}>
          Refresh Plans
        </button>
      </div>

      {error && <div className="errorBox">{error}</div>}
      {success && <div className="listCard">{success}</div>}

      <div className="formGrid" style={{ marginTop: 16 }}>
        <input
          className="textInput"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search saved plans by job, client, address, surface, notes..."
        />

        <button className="primaryButton" type="button" onClick={searchPlans}>
          Search Plans
        </button>
      </div>

      <div className="statsGrid" style={{ marginTop: 16 }}>
        <div className="statCard">
          <div className="statLabel">Saved Plans</div>
          <div className="statValue">{plans.length}</div>
        </div>

        <div className="statCard">
          <div className="statLabel">Treatment Records</div>
          <div className="statValue">{treatments.length}</div>
        </div>

        <div className="statCard">
          <div className="statLabel">Case Records</div>
          <div className="statValue">{cases.length}</div>
        </div>
      </div>

      {loading && <div className="listCard" style={{ marginTop: 16 }}>Loading saved plans...</div>}

      <div className="cardsGrid" style={{ marginTop: 16 }}>
        {!loading &&
          plans.map((plan) => {
            const expanded = expandedId === plan.id;
            const selectedTreatments = getPlanTreatments(plan);
            const selectedCases = getPlanCases(plan);

            return (
              <div key={plan.id} className="quoteCard">
                <div className="quoteTopRow">
                  <div className="quoteNumber">{plan.jobName}</div>
                  <span className="statusBadge status-approved">Saved</span>
                </div>

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
                  <strong>Created:</strong>{" "}
                  {plan.createdAt ? new Date(plan.createdAt).toLocaleString() : "—"}
                </div>

                <div className="buttonRow" style={{ marginTop: 12 }}>
                  <button
                    className="secondaryButton"
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : plan.id)}
                  >
                    {expanded ? "Hide Details" : "View Details"}
                  </button>

                  <button
                    className="primaryButton"
                    type="button"
                    onClick={() => copyPlan(plan)}
                  >
                    Copy
                  </button>

                  <button
                    className="secondaryButton"
                    type="button"
                    onClick={() =>
                      downloadTreatmentPlan({
                        plan,
                        treatments: selectedTreatments,
                        cases: selectedCases
                      })
                    }
                  >
                    Download
                  </button>

                  <button
                    className="secondaryButton"
                    type="button"
                    onClick={() =>
                      printTreatmentPlan({
                        plan,
                        treatments: selectedTreatments,
                        cases: selectedCases
                      })
                    }
                  >
                    Print
                  </button>

                  <button
                    className="secondaryButton"
                    type="button"
                    onClick={() => deletePlan(plan)}
                  >
                    Delete
                  </button>
                </div>

                {expanded && (
                  <div style={{ marginTop: 14 }}>
                    <div className="assignBox">
                      <div className="assignTitle">Plan Notes</div>
                      <div className="cardLine">{plan.notes || "—"}</div>
                    </div>

                    <div className="assignBox">
                      <div className="assignTitle">Selected Treatments</div>
                      {selectedTreatments.length === 0 && (
                        <div className="cardLine">No treatment records matched this saved plan.</div>
                      )}

                      {selectedTreatments.map((treatment) => (
                        <div key={treatment.id} className="listCard" style={{ marginTop: 10 }}>
                          <div className="quoteNumber">{treatment.name}</div>
                          <div className="cardLine">{treatment.chemical || "—"}</div>
                        </div>
                      ))}
                    </div>

                    <div className="assignBox">
                      <div className="assignTitle">Selected Cases</div>
                      {selectedCases.length === 0 && (
                        <div className="cardLine">No case records matched this saved plan.</div>
                      )}

                      {selectedCases.map((item) => (
                        <div key={item.id} className="listCard" style={{ marginTop: 10 }}>
                          <div className="quoteNumber">{item.title}</div>
                          <div className="cardLine">{item.customerExpectation || "—"}</div>
                        </div>
                      ))}
                    </div>

                    {plan.planText && (
                      <div className="assignBox">
                        <div className="assignTitle">Saved Plan Text</div>
                        <div className="cardLine" style={{ whiteSpace: "pre-wrap" }}>
                          {plan.planText}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

        {!loading && plans.length === 0 && (
          <div className="listCard">No saved treatment plans yet.</div>
        )}
      </div>
    </section>
  );
}

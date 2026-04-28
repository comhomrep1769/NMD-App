import React from "react";
import { apiFetch } from "../api";
import type { Role } from "../types";

type Treatment = {
  id: string;
  title: string;
  category: string;
  surfaceType: string;
  stainType: string;
  severity: string;
  chemicalName: string;
  dilutionRatio?: string | null;
  applicationMethod?: string | null;
  dwellTime?: string | null;
  rinseMethod?: string | null;
  safetyNotes?: string | null;
  damageWarnings?: string | null;
  estimatedMaterialCost?: number;
  purchaseLink?: string | null;
  notes?: string | null;
};

export default function TreatmentsPage({ role }: { role: Role }) {
  const [treatments, setTreatments] = React.useState<Treatment[]>([]);
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const [form, setForm] = React.useState({
    title: "",
    category: "",
    surfaceType: "",
    stainType: "",
    severity: "",
    chemicalName: "",
    dilutionRatio: "",
    applicationMethod: "",
    dwellTime: "",
    rinseMethod: "",
    safetyNotes: "",
    damageWarnings: "",
    estimatedMaterialCost: "",
    purchaseLink: "",
    notes: ""
  });

  const loadTreatments = React.useCallback(async () => {
    setError("");

    try {
      const query = search ? `?search=${encodeURIComponent(search)}` : "";

      const data = await apiFetch<{ treatments: Treatment[] }>(
        `/api/treatments${query}`
      );

      setTreatments(data.treatments);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load treatments");
    } finally {
      setLoading(false);
    }
  }, [search]);

  React.useEffect(() => {
    loadTreatments();
  }, [loadTreatments]);

  const createTreatment = async () => {
    setError("");

    try {
      await apiFetch("/api/treatments", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          estimatedMaterialCost: form.estimatedMaterialCost
            ? Number(form.estimatedMaterialCost)
            : null
        })
      });

      setForm({
        title: "",
        category: "",
        surfaceType: "",
        stainType: "",
        severity: "",
        chemicalName: "",
        dilutionRatio: "",
        applicationMethod: "",
        dwellTime: "",
        rinseMethod: "",
        safetyNotes: "",
        damageWarnings: "",
        estimatedMaterialCost: "",
        purchaseLink: "",
        notes: ""
      });

      await loadTreatments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create treatment");
    }
  };

  const deleteTreatment = async (id: string) => {
    const ok = window.confirm("Delete this treatment?");
    if (!ok) return;

    try {
      await apiFetch(`/api/treatments/${id}`, {
        method: "DELETE"
      });

      await loadTreatments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
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
    <div className="pageGrid">
      <section className="panel">
        <h2 className="panelTitle">Search Treatments</h2>

        {error && <div className="errorBox">{error}</div>}

        <div className="formGrid">
          <input
            className="textInput"
            placeholder="Search by chemical, stain, surface..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <button className="primaryButton" onClick={loadTreatments}>
            Search
          </button>
        </div>
      </section>

      {role === "admin" && (
        <section className="panel">
          <h2 className="panelTitle">Add Treatment</h2>

          <div className="formGrid">
            <input
              className="textInput"
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />

            <input
              className="textInput"
              placeholder="Category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />

            <input
              className="textInput"
              placeholder="Surface Type"
              value={form.surfaceType}
              onChange={(e) => setForm({ ...form, surfaceType: e.target.value })}
            />

            <input
              className="textInput"
              placeholder="Stain Type"
              value={form.stainType}
              onChange={(e) => setForm({ ...form, stainType: e.target.value })}
            />

            <input
              className="textInput"
              placeholder="Severity"
              value={form.severity}
              onChange={(e) => setForm({ ...form, severity: e.target.value })}
            />

            <input
              className="textInput"
              placeholder="Chemical Name"
              value={form.chemicalName}
              onChange={(e) => setForm({ ...form, chemicalName: e.target.value })}
            />

            <input
              className="textInput"
              placeholder="Dilution Ratio"
              value={form.dilutionRatio}
              onChange={(e) => setForm({ ...form, dilutionRatio: e.target.value })}
            />

            <input
              className="textInput"
              placeholder="Application Method"
              value={form.applicationMethod}
              onChange={(e) => setForm({ ...form, applicationMethod: e.target.value })}
            />

            <input
              className="textInput"
              placeholder="Dwell Time"
              value={form.dwellTime}
              onChange={(e) => setForm({ ...form, dwellTime: e.target.value })}
            />

            <input
              className="textInput"
              placeholder="Rinse Method"
              value={form.rinseMethod}
              onChange={(e) => setForm({ ...form, rinseMethod: e.target.value })}
            />

            <textarea
              className="textInput"
              placeholder="Safety Notes"
              rows={3}
              value={form.safetyNotes}
              onChange={(e) => setForm({ ...form, safetyNotes: e.target.value })}
            />

            <textarea
              className="textInput"
              placeholder="Damage Warnings"
              rows={3}
              value={form.damageWarnings}
              onChange={(e) => setForm({ ...form, damageWarnings: e.target.value })}
            />

            <input
              className="textInput"
              placeholder="Estimated Material Cost"
              value={form.estimatedMaterialCost}
              onChange={(e) => setForm({ ...form, estimatedMaterialCost: e.target.value })}
            />

            <input
              className="textInput"
              placeholder="Purchase Link"
              value={form.purchaseLink}
              onChange={(e) => setForm({ ...form, purchaseLink: e.target.value })}
            />

            <textarea
              className="textInput"
              placeholder="Notes"
              rows={4}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <button className="primaryButton" onClick={createTreatment}>
            Save Treatment
          </button>
        </section>
      )}

      <section className="panel">
        <h2 className="panelTitle">Treatment Database</h2>

        <div className="cardsGrid">
          {treatments.map((item) => (
            <div key={item.id} className="quoteCard">
              <div className="quoteTopRow">
                <div className="quoteNumber">{item.title}</div>
                <span className="statusBadge status-scheduled">
                  {item.category}
                </span>
              </div>

              <div className="cardLine">
                <strong>Surface:</strong> {item.surfaceType}
              </div>

              <div className="cardLine">
                <strong>Stain:</strong> {item.stainType}
              </div>

              <div className="cardLine">
                <strong>Severity:</strong> {item.severity}
              </div>

              <div className="cardLine">
                <strong>Chemical:</strong> {item.chemicalName}
              </div>

              <div className="cardLine">
                <strong>Ratio:</strong> {item.dilutionRatio || "—"}
              </div>

              <div className="cardLine">
                <strong>Application:</strong> {item.applicationMethod || "—"}
              </div>

              <div className="cardLine">
                <strong>Dwell:</strong> {item.dwellTime || "—"}
              </div>

              <div className="cardLine">
                <strong>Rinse:</strong> {item.rinseMethod || "—"}
              </div>

              <div className="cardLine">
                <strong>Safety:</strong> {item.safetyNotes || "—"}
              </div>

              <div className="cardLine">
                <strong>Warnings:</strong> {item.damageWarnings || "—"}
              </div>

              <div className="cardLine">
                <strong>Cost:</strong> ${Number(item.estimatedMaterialCost || 0).toFixed(2)}
              </div>

              <div className="cardLine">
                <strong>Notes:</strong> {item.notes || "—"}
              </div>

              {item.purchaseLink && (
                <a href={item.purchaseLink} target="_blank" rel="noreferrer">
                  Purchase Link
                </a>
              )}

              {role === "admin" && (
                <button
                  className="secondaryButton"
                  onClick={() => deleteTreatment(item.id)}
                >
                  Delete
                </button>
              )}
            </div>
          ))}

          {treatments.length === 0 && (
            <div className="listCard">No treatments yet.</div>
          )}
        </div>
      </section>
    </div>
  );
}

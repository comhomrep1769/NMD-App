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
  dilutionRatio?: string;
  applicationMethod?: string;
  dwellTime?: string;
  rinseMethod?: string;
  safetyNotes?: string;
  damageWarnings?: string;
  estimatedMaterialCost?: number;
  purchaseLink?: string;
  notes?: string;
};

export default function TreatmentsPage({
  role
}: {
  role: Role
}) {
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

  const loadTreatments = async () => {
    try {
      const query = search
        ? `?search=${encodeURIComponent(search)}`
        : "";

      const data = await apiFetch<{
        treatments: Treatment[]
      }>(`/api/treatments${query}`);

      setTreatments(data.treatments);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load treatments"
      );
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadTreatments();
  }, []);

  const createTreatment = async () => {
    try {
      await apiFetch("/api/treatments", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          estimatedMaterialCost:
            form.estimatedMaterialCost
              ? Number(form.estimatedMaterialCost)
              : null
        })
      });

      loadTreatments();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create treatment"
      );
    }
  };

  const deleteTreatment = async (id: string) => {
    try {
      await apiFetch(`/api/treatments/${id}`, {
        method: "DELETE"
      });

      loadTreatments();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Delete failed"
      );
    }
  };

  if (loading) {
    return (
      <section className="panel">
        Loading treatments...
      </section>
    );
  }

  return (
    <div className="pageGrid">

      <section className="panel">
        <h2 className="panelTitle">
          Search Treatments
        </h2>

        <input
          className="input"
          placeholder="Search by chemical, stain, surface..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button
          className="primaryButton"
          onClick={loadTreatments}
        >
          Search
        </button>
      </section>

      {role === "admin" && (
        <section className="panel">
          <h2 className="panelTitle">
            Add Treatment
          </h2>

          <div className="formGrid">
            {Object.keys(form).map((key) => (
              <input
                key={key}
                className="input"
                placeholder={key}
                value={(form as any)[key]}
                onChange={(e) =>
                  setForm({
                    ...form,
                    [key]: e.target.value
                  })
                }
              />
            ))}
          </div>

          <button
            className="primaryButton"
            onClick={createTreatment}
          >
            Save Treatment
          </button>
        </section>
      )}

      <section className="panel">
        <h2 className="panelTitle">
          Treatment Database
        </h2>

        <div className="cardsGrid">
          {treatments.map((item) => (
            <div
              key={item.id}
              className="quoteCard"
            >
              <div className="quoteNumber">
                {item.title}
              </div>

              <div className="cardLine">
                <strong>Surface:</strong> {item.surfaceType}
              </div>

              <div className="cardLine">
                <strong>Stain:</strong> {item.stainType}
              </div>

              <div className="cardLine">
                <strong>Chemical:</strong> {item.chemicalName}
              </div>

              <div className="cardLine">
                <strong>Ratio:</strong> {item.dilutionRatio}
              </div>

              <div className="cardLine">
                <strong>Dwell:</strong> {item.dwellTime}
              </div>

              <div className="cardLine">
                <strong>Safety:</strong> {item.safetyNotes}
              </div>

              <div className="cardLine">
                <strong>Warnings:</strong> {item.damageWarnings}
              </div>

              <div className="cardLine">
                <strong>Cost:</strong> $
                {item.estimatedMaterialCost}
              </div>

              {item.purchaseLink && (
                <a
                  href={item.purchaseLink}
                  target="_blank"
                  rel="noreferrer"
                >
                  Purchase Link
                </a>
              )}

              {role === "admin" && (
                <button
                  className="dangerButton"
                  onClick={() =>
                    deleteTreatment(item.id)
                  }
                >
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}

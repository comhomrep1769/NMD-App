import React from "react";
import { apiFetch } from "../../api";

type GuruTreatmentResult = {
  recordType: "treatment" | "case" | "plan";
  id: string;
  title: string;
  category: string;
  surfaceType: string;
  problemType: string;
  chemical: string;
  dilutionRatio: string;
  riskLevel: string;
  instructions: string;
  safetyNotes: string;
  pricingNote: string;
  customerExpectation: string;
  sourceName: string;
  createdAt: string;
};

function badgeClass(riskLevel: string) {
  if (riskLevel === "High Review") return "statusBadge status-pending_admin_approval";
  if (riskLevel === "Moderate") return "statusBadge status-approved";
  if (riskLevel === "Saved Plan") return "statusBadge status-approved";
  return "statusBadge status-paid";
}

function recordLabel(type: string) {
  if (type === "case") return "Case";
  if (type === "plan") return "Saved Plan";
  return "Treatment";
}

function buildResultSummary(result: GuruTreatmentResult) {
  return [
    `Record Type: ${recordLabel(result.recordType)}`,
    `Title: ${result.title}`,
    `Category: ${result.category || "—"}`,
    `Source: ${result.sourceName || "—"}`,
    `Surface: ${result.surfaceType || "—"}`,
    `Problem/Use Case: ${result.problemType || "—"}`,
    `Chemical/Mix: ${result.chemical || "—"}`,
    `Dilution/Dwell: ${result.dilutionRatio || "—"}`,
    `Risk: ${result.riskLevel || "Standard"}`,
    `Instructions: ${result.instructions || "—"}`,
    `Safety Notes: ${result.safetyNotes || "—"}`,
    `Pricing Note: ${result.pricingNote || "—"}`,
    `Customer Expectation: ${result.customerExpectation || "—"}`
  ].join("\n");
}

export default function TreatmentGuruSearchPanel() {
  const [search, setSearch] = React.useState("");
  const [riskLevel, setRiskLevel] = React.useState("all");
  const [recordType, setRecordType] = React.useState("all");
  const [results, setResults] = React.useState<GuruTreatmentResult[]>([]);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  const runSearch = React.useCallback(async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const params = new URLSearchParams();
      params.set("search", search.trim());
      params.set("riskLevel", riskLevel);
      params.set("recordType", recordType);
      params.set("limit", "50");

      const data = await apiFetch<{ results: GuruTreatmentResult[] }>(
        `/api/guru/treatment-search?${params.toString()}`
      );

      setResults(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Guru treatment search failed.");
    } finally {
      setLoading(false);
    }
  }, [search, riskLevel, recordType]);

  React.useEffect(() => {
    runSearch();
  }, []);

  const copyResult = async (result: GuruTreatmentResult) => {
    const summary = buildResultSummary(result);

    try {
      await navigator.clipboard.writeText(summary);
      setSuccess("Guru treatment result copied.");
    } catch {
      window.alert(summary);
    }
  };

  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <h2 className="panelTitle">Guru Treatment Search</h2>
          <p className="brandSubtitle">
            Search treatments, treatment cases, and saved plans from one Guru-ready field tool.
          </p>
        </div>

        <button className="primaryButton" type="button" onClick={runSearch} disabled={loading}>
          {loading ? "Searching..." : "Search Guru KB"}
        </button>
      </div>

      {error && <div className="errorBox">{error}</div>}
      {success && <div className="listCard">{success}</div>}

      <div className="formGrid" style={{ marginTop: 16 }}>
        <input
          className="textInput"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Ask/search: roof black streaks, rust on concrete, painted driveway, wood fence..."
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              runSearch();
            }
          }}
        />

        <select
          className="textInput"
          value={riskLevel}
          onChange={(e) => setRiskLevel(e.target.value)}
        >
          <option value="all">All Risk Levels</option>
          <option value="Standard">Standard</option>
          <option value="Moderate">Moderate</option>
          <option value="High Review">High Review</option>
          <option value="Saved Plan">Saved Plan</option>
        </select>

        <select
          className="textInput"
          value={recordType}
          onChange={(e) => setRecordType(e.target.value)}
        >
          <option value="all">All Record Types</option>
          <option value="treatment">Treatments</option>
          <option value="case">Cases</option>
          <option value="plan">Saved Plans</option>
        </select>
      </div>

      <div className="statsGrid" style={{ marginTop: 16 }}>
        <div className="statCard">
          <div className="statLabel">Results</div>
          <div className="statValue">{results.length}</div>
        </div>

        <div className="statCard">
          <div className="statLabel">Treatments</div>
          <div className="statValue">
            {results.filter((item) => item.recordType === "treatment").length}
          </div>
        </div>

        <div className="statCard">
          <div className="statLabel">Cases</div>
          <div className="statValue">
            {results.filter((item) => item.recordType === "case").length}
          </div>
        </div>

        <div className="statCard">
          <div className="statLabel">Plans</div>
          <div className="statValue">
            {results.filter((item) => item.recordType === "plan").length}
          </div>
        </div>
      </div>

      <div className="cardsGrid" style={{ marginTop: 16 }}>
        {results.map((result) => {
          const expanded = expandedId === `${result.recordType}-${result.id}`;

          return (
            <div key={`${result.recordType}-${result.id}`} className="quoteCard">
              <div className="quoteTopRow">
                <div className="quoteNumber">{result.title}</div>
                <span className={badgeClass(result.riskLevel)}>
                  {result.riskLevel || "Standard"}
                </span>
              </div>

              <div className="buttonRow" style={{ marginBottom: 8 }}>
                <span className="statusBadge status-approved">
                  {recordLabel(result.recordType)}
                </span>

                {result.category && (
                  <span className="statusBadge status-paid">{result.category}</span>
                )}
              </div>

              <div className="cardLine">
                <strong>Surface:</strong> {result.surfaceType || "—"}
              </div>

              <div className="cardLine">
                <strong>Chemical/Mix:</strong> {result.chemical || "—"}
              </div>

              <div className="cardLine">
                <strong>Safety:</strong> {result.safetyNotes || "—"}
              </div>

              <div className="buttonRow" style={{ marginTop: 12 }}>
                <button
                  className="secondaryButton"
                  type="button"
                  onClick={() =>
                    setExpandedId(expanded ? null : `${result.recordType}-${result.id}`)
                  }
                >
                  {expanded ? "Hide Details" : "View Details"}
                </button>

                <button
                  className="primaryButton"
                  type="button"
                  onClick={() => copyResult(result)}
                >
                  Copy For Guru/Job
                </button>
              </div>

              {expanded && (
                <div style={{ marginTop: 14 }}>
                  <div className="assignBox">
                    <div className="assignTitle">Problem / Use Case</div>
                    <div className="cardLine">{result.problemType || "—"}</div>
                  </div>

                  <div className="assignBox">
                    <div className="assignTitle">Dilution / Dwell</div>
                    <div className="cardLine">{result.dilutionRatio || "—"}</div>
                  </div>

                  <div className="assignBox">
                    <div className="assignTitle">Instructions</div>
                    <div className="cardLine" style={{ whiteSpace: "pre-wrap" }}>
                      {result.instructions || "—"}
                    </div>
                  </div>

                  <div className="assignBox">
                    <div className="assignTitle">Pricing Note</div>
                    <div className="cardLine">{result.pricingNote || "—"}</div>
                  </div>

                  <div className="assignBox">
                    <div className="assignTitle">Customer Expectation</div>
                    <div className="cardLine">{result.customerExpectation || "—"}</div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {!loading && results.length === 0 && (
          <div className="listCard">No Guru treatment results found.</div>
        )}
      </div>
    </section>
  );
}

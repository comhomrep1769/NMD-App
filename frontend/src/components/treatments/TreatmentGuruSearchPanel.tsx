import React from "react";
import { apiFetch } from "../../api";
import type { TreatmentItem } from "../../types";
import type { TreatmentCase } from "../../types/treatmentCases";
import { getTreatmentRiskLevel, normalizeTreatment } from "../../utils/treatmentHelpers";

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
  const normalized = String(riskLevel || "").toLowerCase();

  if (normalized === "high review" || normalized === "high") {
    return "statusBadge status-pending_admin_approval";
  }

  if (normalized === "moderate" || normalized === "medium") {
    return "statusBadge status-approved";
  }

  if (normalized === "saved plan") {
    return "statusBadge status-approved";
  }

  return "statusBadge status-paid";
}

function recordLabel(type: string) {
  if (type === "case") return "Treatment Case";
  if (type === "plan") return "Saved Plan";
  return "Treatment";
}

function textMatches(value: string, search: string) {
  const needle = search.trim().toLowerCase();
  if (!needle) return true;

  return value.toLowerCase().includes(needle);
}

function resultMatchesFilters(
  result: GuruTreatmentResult,
  search: string,
  riskLevel: string,
  recordType: string
) {
  const haystack = [
    result.title,
    result.category,
    result.surfaceType,
    result.problemType,
    result.chemical,
    result.dilutionRatio,
    result.riskLevel,
    result.instructions,
    result.safetyNotes,
    result.pricingNote,
    result.customerExpectation,
    result.sourceName
  ]
    .filter(Boolean)
    .join(" ");

  const matchesSearch = textMatches(haystack, search);

  const matchesRisk =
    riskLevel === "all" ||
    String(result.riskLevel || "").toLowerCase() === riskLevel.toLowerCase();

  const matchesType = recordType === "all" || result.recordType === recordType;

  return matchesSearch && matchesRisk && matchesType;
}

function treatmentToResult(treatment: TreatmentItem): GuruTreatmentResult {
  const riskLevel = getTreatmentRiskLevel(treatment);

  return {
    recordType: "treatment",
    id: treatment.id,
    title: treatment.name || "Untitled Treatment",
    category: treatment.category || "General",
    surfaceType: Array.isArray(treatment.surfaceTypes)
      ? treatment.surfaceTypes.join(", ")
      : "",
    problemType: treatment.useCase || "",
    chemical: treatment.chemical || "",
    dilutionRatio: treatment.dilutionRatio || "",
    riskLevel,
    instructions: treatment.instructions || "",
    safetyNotes: treatment.safetyNotes || "",
    pricingNote: treatment.costReference || "",
    customerExpectation: "",
    sourceName: treatment.name || "Treatment Record",
    createdAt: treatment.createdAt || ""
  };
}

function caseToResult(item: TreatmentCase): GuruTreatmentResult {
  return {
    recordType: "case",
    id: item.id,
    title: item.title || "Untitled Case",
    category: item.treatmentCategory || "Treatment Case",
    surfaceType: item.surfaceType || "",
    problemType: item.problemType || "",
    chemical: item.recommendedMix || "",
    dilutionRatio: item.dwellTime || "",
    riskLevel: item.riskLevel || "Standard",
    instructions: item.stepByStep || "",
    safetyNotes: item.safetyChecklist || "",
    pricingNote: item.pricingNote || "",
    customerExpectation: item.customerExpectation || "",
    sourceName: item.treatmentName || "Treatment Case",
    createdAt: item.createdAt || ""
  };
}

function buildResultSummary(result: GuruTreatmentResult) {
  return [
    `Record Type: ${recordLabel(result.recordType)}`,
    `Title: ${result.title}`,
    `Category: ${result.category || "—"}`,
    `Source: ${result.sourceName || "—"}`,
    `Surface: ${result.surfaceType || "—"}`,
    `Problem / Use Case: ${result.problemType || "—"}`,
    `Chemical / Mix: ${result.chemical || "—"}`,
    `Dilution / Dwell: ${result.dilutionRatio || "—"}`,
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
  const [hasSearched, setHasSearched] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  const runFallbackTreatmentSearch = React.useCallback(
    async (overrideSearch?: string) => {
      const activeSearch = String(overrideSearch ?? search).trim();

      const [treatmentsData, casesData] = await Promise.all([
        apiFetch<{ treatments: TreatmentItem[] }>("/api/treatments"),
        apiFetch<{ cases: TreatmentCase[] }>("/api/treatments/cases")
      ]);

      const treatmentResults = (treatmentsData.treatments || [])
        .map(normalizeTreatment)
        .map(treatmentToResult);

      const caseResults = (casesData.cases || []).map(caseToResult);

      const combined = [...treatmentResults, ...caseResults].filter((item) =>
        resultMatchesFilters(item, activeSearch, riskLevel, recordType)
      );

      return combined;
    },
    [search, riskLevel, recordType]
  );

  const runSearch = React.useCallback(
    async (overrideSearch?: string) => {
      setLoading(true);
      setError("");
      setSuccess("");
      setHasSearched(true);

      const activeSearch = String(overrideSearch ?? search).trim();

      try {
        const params = new URLSearchParams();
        params.set("search", activeSearch);
        params.set("riskLevel", riskLevel);
        params.set("recordType", recordType);
        params.set("limit", "75");

        const data = await apiFetch<{ results: GuruTreatmentResult[] }>(
          `/api/guru/treatment-search?${params.toString()}`
        );

        const nextResults = (data.results || []).filter((item) =>
          resultMatchesFilters(item, activeSearch, riskLevel, recordType)
        );

        setResults(nextResults);

        if (nextResults.length > 0) {
          setSuccess(`Guru found ${nextResults.length} treatment knowledge result(s).`);
        }
      } catch {
        try {
          const fallbackResults = await runFallbackTreatmentSearch(activeSearch);

          setResults(fallbackResults);

          if (fallbackResults.length > 0) {
            setSuccess(
              `Guru backend search was unavailable, but local treatment search found ${fallbackResults.length} result(s).`
            );
          } else {
            setError(
              "Guru backend search was unavailable, and no treatment/case records matched this search."
            );
          }
        } catch (fallbackErr) {
          setResults([]);
          setError(
            fallbackErr instanceof Error
              ? fallbackErr.message
              : "Guru treatment search failed. Make sure treatments and treatment cases have been seeded or uploaded."
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [search, riskLevel, recordType, runFallbackTreatmentSearch]
  );

  React.useEffect(() => {
    runSearch("");
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

  const clearAndShowAll = () => {
    setSearch("");
    setRiskLevel("all");
    setRecordType("all");
    runSearch("");
  };

  const treatmentCount = results.filter((item) => item.recordType === "treatment").length;
  const caseCount = results.filter((item) => item.recordType === "case").length;
  const planCount = results.filter((item) => item.recordType === "plan").length;
  const highRiskCount = results.filter(
    (item) => String(item.riskLevel || "").toLowerCase() === "high review"
  ).length;

  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <h2 className="panelTitle">Guru Treatment Search</h2>
          <p className="brandSubtitle">
            Search treatments, treatment cases, and saved plans from one Guru-ready field tool.
          </p>
        </div>

        <div className="buttonRow">
          <button
            className="primaryButton"
            type="button"
            onClick={() => runSearch()}
            disabled={loading}
          >
            {loading ? "Searching..." : "Search Guru KB"}
          </button>

          <button
            className="secondaryButton"
            type="button"
            onClick={clearAndShowAll}
            disabled={loading}
          >
            Show All
          </button>
        </div>
      </div>

      {error && <div className="errorBox">{error}</div>}
      {success && <div className="listCard">{success}</div>}

      <div className="formGrid" style={{ marginTop: 16 }}>
        <label className="fieldLabel">
          Search Treatment Knowledge
          <input
            className="textInput"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search: roof, rust, concrete, painted driveway, oxidation, wood, SH..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                runSearch();
              }
            }}
          />
        </label>

        <label className="fieldLabel">
          Risk Level
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
        </label>

        <label className="fieldLabel">
          Record Type
          <select
            className="textInput"
            value={recordType}
            onChange={(e) => setRecordType(e.target.value)}
          >
            <option value="all">All Record Types</option>
            <option value="treatment">Treatments</option>
            <option value="case">Treatment Cases</option>
            <option value="plan">Saved Plans</option>
          </select>
        </label>
      </div>

      <div className="statsGrid" style={{ marginTop: 16 }}>
        <div className="statCard">
          <div className="statLabel">Results</div>
          <div className="statValue">{results.length}</div>
        </div>

        <div className="statCard">
          <div className="statLabel">Treatments</div>
          <div className="statValue">{treatmentCount}</div>
        </div>

        <div className="statCard">
          <div className="statLabel">Cases</div>
          <div className="statValue">{caseCount}</div>
        </div>

        <div className="statCard">
          <div className="statLabel">Plans</div>
          <div className="statValue">{planCount}</div>
        </div>

        <div className="statCard">
          <div className="statLabel">High Review</div>
          <div className="statValue">{highRiskCount}</div>
        </div>
      </div>

      {hasSearched && !loading && results.length === 0 && !error && (
        <div className="errorBox" style={{ marginTop: 16 }}>
          No Guru treatment results found. Admin or Super Admin may need to seed defaults
          or upload treatment/case records.
        </div>
      )}

      <div className="cardsGrid" style={{ marginTop: 16 }}>
        {results.map((result) => {
          const itemKey = `${result.recordType}-${result.id}`;
          const expanded = expandedId === itemKey;

          return (
            <div key={itemKey} className="quoteCard">
              <div className="quoteTopRow">
                <div className="quoteNumber">{result.title || "Untitled Result"}</div>
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
                <strong>Problem / Use Case:</strong> {result.problemType || "—"}
              </div>

              <div className="cardLine">
                <strong>Chemical / Mix:</strong> {result.chemical || "—"}
              </div>

              <div className="cardLine">
                <strong>Safety:</strong> {result.safetyNotes || "—"}
              </div>

              <div className="buttonRow" style={{ marginTop: 12 }}>
                <button
                  className="secondaryButton"
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : itemKey)}
                >
                  {expanded ? "Hide Details" : "View Details"}
                </button>

                <button
                  className="primaryButton"
                  type="button"
                  onClick={() => copyResult(result)}
                >
                  Copy Guidance
                </button>
              </div>

              {expanded && (
                <div style={{ marginTop: 14 }}>
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

                  <div className="assignBox">
                    <div className="assignTitle">Source</div>
                    <div className="cardLine">
                      {result.sourceName || "NMD treatment database"}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

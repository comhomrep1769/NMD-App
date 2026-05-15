import React from "react";
import { apiFetch } from "../api";
import type { GuruEstimate, GuruEstimateStatus } from "../types";

function statusLabel(status: GuruEstimateStatus) {
  if (status === "needs_review") return "Waiting For Review";
  if (status === "reviewed") return "Reviewed By NMD";
  if (status === "converted_to_quote") return "Quote Being Prepared";
  if (status === "declined") return "Declined";
  if (status === "archived") return "Archived";
  return status.replace(/_/g, " ");
}

function statusClass(status: GuruEstimateStatus) {
  if (status === "needs_review") return "status-pending_admin_approval";
  if (status === "reviewed") return "status-approved";
  if (status === "converted_to_quote") return "status-paid";
  if (status === "declined") return "status-rejected";
  return `status-${status}`;
}

function statusMessage(status: GuruEstimateStatus) {
  if (status === "needs_review") {
    return "Your estimate request has been received. NMD still needs to review it before confirming official pricing.";
  }

  if (status === "reviewed") {
    return "NMD has reviewed this estimate. An official quote may be prepared next.";
  }

  if (status === "converted_to_quote") {
    return "This estimate has been moved into the quote workflow. NMD will send an official quote when ready.";
  }

  if (status === "declined") {
    return "This request was declined or could not be quoted as submitted.";
  }

  return "This estimate is archived.";
}

export default function ClientEstimatesPage() {
  const [estimates, setEstimates] = React.useState<GuruEstimate[]>([]);
  const [filter, setFilter] = React.useState<
    "all" | "needs_review" | "reviewed" | "converted_to_quote" | "declined" | "archived"
  >("all");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const loadEstimates = React.useCallback(async () => {
    setError("");

    try {
      const data = await apiFetch<{ estimates: GuruEstimate[] }>("/api/guru/my-estimates");
      setEstimates(data.estimates);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load your estimates");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadEstimates();
  }, [loadEstimates]);

  const visibleEstimates = estimates.filter((estimate) => {
    if (filter === "all") return true;
    return estimate.status === filter;
  });

  const waiting = estimates.filter((estimate) => estimate.status === "needs_review");
  const reviewed = estimates.filter((estimate) => estimate.status === "reviewed");
  const quotePrep = estimates.filter((estimate) => estimate.status === "converted_to_quote");

  if (loading) {
    return (
      <section className="panel">
        <h2 className="panelTitle">My Estimates</h2>
        <div className="listCard">Loading your estimates...</div>
      </section>
    );
  }

  return (
    <div className="pageGrid">
      <section className="panel">
        <div className="panelHeader">
          <div>
            <h2 className="panelTitle">My Estimates</h2>
            <p className="brandSubtitle">
              View your Guru estimate requests and current review status.
            </p>
          </div>
        </div>

        {error && <div className="errorBox">{error}</div>}

        <div className="listCard">
          Guru estimates are preliminary only. Official pricing is not final until NMD reviews and sends a confirmed quote.
        </div>

        <div className="statsGrid" style={{ marginTop: 16 }}>
          <div className="statCard">
            <div className="statLabel">Total Estimates</div>
            <div className="statValue">{estimates.length}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Waiting Review</div>
            <div className="statValue">{waiting.length}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Reviewed</div>
            <div className="statValue">{reviewed.length}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Quote Prep</div>
            <div className="statValue">{quotePrep.length}</div>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panelHeader">
          <div>
            <h2 className="panelTitle">Estimate History</h2>
            <p className="brandSubtitle">
              Tap Guru in the corner to start another estimate.
            </p>
          </div>
        </div>

        <div className="buttonRow" style={{ marginBottom: 16 }}>
          <button
            className={filter === "all" ? "primaryButton" : "secondaryButton"}
            type="button"
            onClick={() => setFilter("all")}
          >
            All
          </button>

          <button
            className={filter === "needs_review" ? "primaryButton" : "secondaryButton"}
            type="button"
            onClick={() => setFilter("needs_review")}
          >
            Waiting
          </button>

          <button
            className={filter === "reviewed" ? "primaryButton" : "secondaryButton"}
            type="button"
            onClick={() => setFilter("reviewed")}
          >
            Reviewed
          </button>

          <button
            className={filter === "converted_to_quote" ? "primaryButton" : "secondaryButton"}
            type="button"
            onClick={() => setFilter("converted_to_quote")}
          >
            Quote Prep
          </button>

          <button
            className={filter === "declined" ? "primaryButton" : "secondaryButton"}
            type="button"
            onClick={() => setFilter("declined")}
          >
            Declined
          </button>

          <button
            className={filter === "archived" ? "primaryButton" : "secondaryButton"}
            type="button"
            onClick={() => setFilter("archived")}
          >
            Archived
          </button>
        </div>

        <div className="cardsGrid">
          {visibleEstimates.map((estimate) => (
            <div key={estimate.id} className="quoteCard">
              <div className="quoteTopRow">
                <div className="quoteNumber">{estimate.serviceType || "Estimate"}</div>
                <span className={`statusBadge ${statusClass(estimate.status)}`}>
                  {statusLabel(estimate.status)}
                </span>
              </div>

              <div className="listCard" style={{ marginBottom: 10 }}>
                {statusMessage(estimate.status)}
              </div>

              <div className="cardLine">
                <strong>Preliminary Range:</strong> ${estimate.preliminaryEstimateLow.toFixed(2)} - $
                {estimate.preliminaryEstimateHigh.toFixed(2)}
              </div>

              <div className="cardLine">
                <strong>Address:</strong> {estimate.address || "—"}
              </div>

              <div className="cardLine">
                <strong>Property Area:</strong> {estimate.propertyArea || "—"}
              </div>

              <div className="cardLine">
                <strong>Surface:</strong> {estimate.surfaceType || "—"}
              </div>

              <div className="cardLine">
                <strong>Condition:</strong> {estimate.conditionLevel || "—"}
              </div>

              <div className="cardLine">
                <strong>Size:</strong> {estimate.squareFootage || "—"}
              </div>

              <div className="cardLine">
                <strong>Preferred Schedule:</strong> {estimate.preferredSchedule || "—"}
              </div>

              <div className="cardLine">
                <strong>Special Concerns:</strong> {estimate.specialConcerns || "—"}
              </div>

              <div className="cardLine">
                <strong>Submitted:</strong>{" "}
                {estimate.createdAt ? new Date(estimate.createdAt).toLocaleString() : "—"}
              </div>

              <div className="cardLine">
                <strong>Reviewed:</strong>{" "}
                {estimate.reviewedAt ? new Date(estimate.reviewedAt).toLocaleString() : "Not yet"}
              </div>
            </div>
          ))}

          {visibleEstimates.length === 0 && (
            <div className="listCard">No estimates found for this filter.</div>
          )}
        </div>
      </section>
    </div>
  );
}

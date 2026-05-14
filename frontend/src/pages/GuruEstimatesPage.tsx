import React from "react";
import { apiFetch } from "../api";
import type { GuruEstimate, GuruEstimateStatus } from "../types";

function statusLabel(status: GuruEstimateStatus) {
  if (status === "needs_review") return "Needs Review";
  if (status === "converted_to_quote") return "Converted To Quote";
  return status.replace(/_/g, " ");
}

function statusClass(status: GuruEstimateStatus) {
  if (status === "needs_review") return "status-pending_admin_approval";
  if (status === "reviewed") return "status-approved";
  if (status === "converted_to_quote") return "status-paid";
  if (status === "declined") return "status-rejected";
  return `status-${status}`;
}

export default function GuruEstimatesPage() {
  const [estimates, setEstimates] = React.useState<GuruEstimate[]>([]);
  const [filter, setFilter] = React.useState<
    "all" | "needs_review" | "reviewed" | "converted_to_quote" | "declined" | "archived"
  >("needs_review");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  const loadEstimates = React.useCallback(async () => {
    setError("");

    try {
      const data = await apiFetch<{ estimates: GuruEstimate[] }>("/api/guru/estimates");
      setEstimates(data.estimates);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load Guru estimates");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadEstimates();
  }, [loadEstimates]);

  const updateEstimateStatus = async (
    estimateId: string,
    status: "reviewed" | "converted_to_quote" | "declined" | "archived"
  ) => {
    setError("");
    setSuccess("");

    try {
      await apiFetch(`/api/guru/estimates/${estimateId}/review`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });

      setSuccess(`Guru estimate marked ${statusLabel(status)}.`);
      await loadEstimates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update Guru estimate");
    }
  };

  const visibleEstimates = estimates.filter((estimate) => {
    if (filter === "all") return true;
    return estimate.status === filter;
  });

  const needsReview = estimates.filter((estimate) => estimate.status === "needs_review");
  const reviewed = estimates.filter((estimate) => estimate.status === "reviewed");
  const converted = estimates.filter((estimate) => estimate.status === "converted_to_quote");
  const declined = estimates.filter((estimate) => estimate.status === "declined");

  const totalPotentialLow = needsReview.reduce(
    (sum, estimate) => sum + Number(estimate.preliminaryEstimateLow || 0),
    0
  );

  const totalPotentialHigh = needsReview.reduce(
    (sum, estimate) => sum + Number(estimate.preliminaryEstimateHigh || 0),
    0
  );

  if (loading) {
    return (
      <section className="panel">
        <h2 className="panelTitle">Guru Estimates Review</h2>
        <div className="listCard">Loading Guru estimates...</div>
      </section>
    );
  }

  return (
    <div className="pageGrid">
      <section className="panel">
        <div className="panelHeader">
          <div>
            <h2 className="panelTitle">Guru Estimates Review</h2>
            <p className="brandSubtitle">
              Review preliminary client estimates created through Guru before converting them into official quotes.
            </p>
          </div>
        </div>

        {error && <div className="errorBox">{error}</div>}
        {success && <div className="listCard">{success}</div>}

        {needsReview.length > 0 && (
          <div className="errorBox">
            {needsReview.length} Guru estimate{needsReview.length === 1 ? "" : "s"} need admin review.
          </div>
        )}

        <div className="statsGrid">
          <div className="statCard">
            <div className="statLabel">Needs Review</div>
            <div className="statValue">{needsReview.length}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Reviewed</div>
            <div className="statValue">{reviewed.length}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Converted</div>
            <div className="statValue">{converted.length}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Declined</div>
            <div className="statValue">{declined.length}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Potential Low</div>
            <div className="statValue">${totalPotentialLow.toFixed(2)}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Potential High</div>
            <div className="statValue">${totalPotentialHigh.toFixed(2)}</div>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panelHeader">
          <div>
            <h2 className="panelTitle">Estimate Queue</h2>
            <p className="brandSubtitle">
              Guru estimates are preliminary and must be manually confirmed before becoming quotes.
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
            Needs Review
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
            Converted
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
                <div className="quoteNumber">
                  {estimate.clientName || "Unknown Client"}
                </div>

                <span className={`statusBadge ${statusClass(estimate.status)}`}>
                  {statusLabel(estimate.status)}
                </span>
              </div>

              <div className="cardLine">
                <strong>Service:</strong> {estimate.serviceType || "—"}
              </div>

              <div className="cardLine">
                <strong>Range:</strong> ${estimate.preliminaryEstimateLow.toFixed(2)} - $
                {estimate.preliminaryEstimateHigh.toFixed(2)}
              </div>

              <div className="cardLine">
                <strong>Phone:</strong> {estimate.phone || "—"}
              </div>

              <div className="cardLine">
                <strong>Email:</strong> {estimate.email || "—"}
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
                <strong>Notes:</strong> {estimate.preliminaryNotes || "—"}
              </div>

              <div className="cardLine">
                <strong>Submitted:</strong>{" "}
                {estimate.createdAt ? new Date(estimate.createdAt).toLocaleString() : "—"}
              </div>

              <div className="buttonRow" style={{ marginTop: 12 }}>
                {estimate.status === "needs_review" && (
                  <button
                    className="primaryButton"
                    type="button"
                    onClick={() => updateEstimateStatus(estimate.id, "reviewed")}
                  >
                    Mark Reviewed
                  </button>
                )}

                {estimate.status !== "converted_to_quote" && (
                  <button
                    className="primaryButton"
                    type="button"
                    onClick={() => updateEstimateStatus(estimate.id, "converted_to_quote")}
                  >
                    Mark Converted
                  </button>
                )}

                {estimate.status !== "declined" && (
                  <button
                    className="secondaryButton"
                    type="button"
                    onClick={() => updateEstimateStatus(estimate.id, "declined")}
                  >
                    Decline
                  </button>
                )}

                {estimate.status !== "archived" && (
                  <button
                    className="secondaryButton"
                    type="button"
                    onClick={() => updateEstimateStatus(estimate.id, "archived")}
                  >
                    Archive
                  </button>
                )}
              </div>
            </div>
          ))}

          {visibleEstimates.length === 0 && (
            <div className="listCard">No Guru estimates found for this filter.</div>
          )}
        </div>
      </section>
    </div>
  );
}

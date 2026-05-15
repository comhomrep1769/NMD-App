import React from "react";
import { apiFetch } from "../api";
import type { GuruEstimate, GuruEstimateStatus, PageKey } from "../types";

function statusLabel(status: GuruEstimateStatus) {
  if (status === "needs_review") return "Needs Review";
  if (status === "reviewed") return "Reviewed";
  if (status === "converted_to_quote") return "Converted To Quote";
  if (status === "declined") return "Declined";
  if (status === "archived") return "Archived";

  return String(status).replace(/_/g, " ");
}

function statusClass(status: GuruEstimateStatus) {
  if (status === "needs_review") return "status-pending_admin_approval";
  if (status === "reviewed") return "status-approved";
  if (status === "converted_to_quote") return "status-paid";
  if (status === "declined") return "status-rejected";
  if (status === "archived") return "status-archived";

  return "status-pending_admin_approval";
}

function quoteStatusLabel(status?: string | null) {
  if (!status) return "—";
  if (status === "draft") return "Draft";
  if (status === "sent") return "Sent";
  if (status === "accepted") return "Accepted";
  if (status === "declined") return "Declined";
  if (status === "expired") return "Expired";

  return String(status).replace(/_/g, " ");
}

function cleanText(value?: string | null) {
  return value && value.trim() ? value : "—";
}

function pricingExplanation(estimate: GuruEstimate) {
  const pieces: string[] = [];

  if (estimate.serviceType) pieces.push(`Service type: ${estimate.serviceType}`);
  if (estimate.surfaceType) pieces.push(`Surface/material: ${estimate.surfaceType}`);
  if (estimate.propertyArea) pieces.push(`Area: ${estimate.propertyArea}`);
  if (estimate.squareFootage) pieces.push(`Size/dimensions: ${estimate.squareFootage}`);
  if (estimate.conditionLevel) pieces.push(`Condition: ${estimate.conditionLevel}`);
  if (estimate.specialConcerns) pieces.push(`Special concerns: ${estimate.specialConcerns}`);
  if (estimate.photoDataUrl) pieces.push("Client uploaded a photo for review");

  return pieces;
}

function buildAdminGuruReview(estimate: GuruEstimate) {
  const low = Number(estimate.preliminaryEstimateLow || 0);
  const high = Number(estimate.preliminaryEstimateHigh || 0);

  const reviewLines: string[] = [];

  reviewLines.push(
    `Guru’s preliminary range is $${low.toFixed(2)} - $${high.toFixed(2)}. This should be treated as a draft estimate only, not final pricing.`
  );

  if (estimate.serviceType) {
    reviewLines.push(`Service requested: ${estimate.serviceType}.`);
  }

  if (estimate.propertyArea) {
    reviewLines.push(`Property area/client wording: ${estimate.propertyArea}.`);
  }

  if (estimate.surfaceType) {
    reviewLines.push(`Surface/material: ${estimate.surfaceType}. Confirm this visually before approving price.`);
  } else {
    reviewLines.push("Surface/material was not clearly provided. Admin should confirm before converting.");
  }

  if (estimate.conditionLevel) {
    reviewLines.push(`Condition level provided: ${estimate.conditionLevel}.`);
  } else {
    reviewLines.push("Condition level was not provided. Admin should verify severity before pricing.");
  }

  if (estimate.squareFootage) {
    reviewLines.push(`Size/dimensions provided: ${estimate.squareFootage}. Confirm measurements when possible.`);
  } else {
    reviewLines.push("No square footage or dimensions were provided, so pricing may need a wider margin or follow-up.");
  }

  if (estimate.specialConcerns) {
    reviewLines.push(`Special concerns listed: ${estimate.specialConcerns}. Review these for risk, chemical needs, plant protection, oxidation, runoff, access, or specialty restoration.`);
  }

  if (estimate.photoDataUrl) {
    reviewLines.push("Client uploaded a photo. Review the photo before marking reviewed or converting to quote.");
  } else {
    reviewLines.push("No photo was uploaded. Consider requesting photos before final quote approval.");
  }

  if (estimate.status === "needs_review") {
    reviewLines.push("Recommended next step: review details/photos, confirm missing info, then either mark reviewed, decline, archive, or convert to a quote draft.");
  }

  if (estimate.status === "reviewed") {
    reviewLines.push("This estimate has already been reviewed. Recommended next step: convert to a quote draft when pricing is ready.");
  }

  if (estimate.status === "converted_to_quote") {
    if (estimate.quoteNumber) {
      reviewLines.push(`This estimate is connected to Quote #${estimate.quoteNumber}. Review the connected quote before sending to the client.`);
    } else {
      reviewLines.push("This estimate is marked converted, but no quote number is visible. Confirm the quote connection.");
    }
  }

  if (estimate.status === "declined") {
    reviewLines.push("This estimate was declined. Keep it for recordkeeping or archive it if no longer needed.");
  }

  if (estimate.status === "archived") {
    reviewLines.push("This estimate is archived and should not be treated as active unless reopened manually later.");
  }

  return reviewLines;
}

function buildAdminRiskChecklist(estimate: GuruEstimate) {
  const combined = [
    estimate.serviceType,
    estimate.propertyArea,
    estimate.surfaceType,
    estimate.conditionLevel,
    estimate.specialConcerns,
    estimate.preliminaryNotes
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const risks: string[] = [];

  if (combined.includes("roof")) {
    risks.push("Roof cleaning: verify roof type, pitch, access, runoff, plant protection, and whether treatment should be soft wash only.");
  }

  if (combined.includes("stucco")) {
    risks.push("Stucco: confirm cracks, paint condition, oxidation, water intrusion risks, and use low pressure.");
  }

  if (combined.includes("vinyl") || combined.includes("siding")) {
    risks.push("Siding: check oxidation, loose siding, electrical fixtures, vents, windows, and plant protection.");
  }

  if (combined.includes("concrete") || combined.includes("driveway") || combined.includes("sidewalk")) {
    risks.push("Concrete/flatwork: verify age of concrete, staining type, drainage, stripes/risk of etching, and surface cleaner suitability.");
  }

  if (combined.includes("paver")) {
    risks.push("Pavers: check polymeric sand, loose joints, sealing status, drainage, and whether resanding/sealing is needed.");
  }

  if (combined.includes("wood") || combined.includes("deck") || combined.includes("fence")) {
    risks.push("Wood: avoid excessive pressure, check age/condition, oxidation/brightening needs, and manage customer expectations.");
  }

  if (combined.includes("rust") || combined.includes("orange stain") || combined.includes("irrigation")) {
    risks.push("Rust/stain restoration: price as specialty work, test spot first, confirm chemical compatibility, and protect surrounding surfaces.");
  }

  if (combined.includes("oil") || combined.includes("grease")) {
    risks.push("Oil/grease: may require degreaser, heat/hot water, agitation, multiple applications, and no guaranteed full removal.");
  }

  if (combined.includes("oxidation")) {
    risks.push("Oxidation: do not promise standard washing will fix it. Explain oxidation may require specialty restoration.");
  }

  if (combined.includes("plant") || combined.includes("landscape")) {
    risks.push("Plant/landscape protection: pre-wet, control runoff, rinse thoroughly, and use proper neutralization/protection steps.");
  }

  if (risks.length === 0) {
    risks.push("General review: verify access, water source, photos, surface condition, measurements, liability risks, customer expectations, and minimum service charge.");
  }

  return risks;
}

export default function GuruEstimatesPage({
  onNavigate
}: {
  onNavigate: (page: PageKey) => void;
}) {
  const [estimates, setEstimates] = React.useState<GuruEstimate[]>([]);
  const [filter, setFilter] = React.useState<
    "all" | "needs_review" | "reviewed" | "converted_to_quote" | "declined" | "archived"
  >("needs_review");
  const [loading, setLoading] = React.useState(true);
  const [savingId, setSavingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");
  const [convertedQuoteNumber, setConvertedQuoteNumber] = React.useState<number | null>(null);

  const [convertEstimateId, setConvertEstimateId] = React.useState<string | null>(null);
  const [quoteTotal, setQuoteTotal] = React.useState("");
  const [convertNotes, setConvertNotes] = React.useState("");

  const [expandedPhotoId, setExpandedPhotoId] = React.useState<string | null>(null);
  const [expandedPricingId, setExpandedPricingId] = React.useState<string | null>(null);
  const [expandedReviewId, setExpandedReviewId] = React.useState<string | null>(null);

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
    setConvertedQuoteNumber(null);
    setSavingId(estimateId);

    try {
      await apiFetch(`/api/guru/estimates/${estimateId}/review`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });

      setSuccess(`Guru estimate marked ${statusLabel(status)}.`);
      await loadEstimates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update Guru estimate");
    } finally {
      setSavingId(null);
    }
  };

  const startConvert = (estimate: GuruEstimate) => {
    setConvertEstimateId(estimate.id);
    setQuoteTotal(String(estimate.preliminaryEstimateHigh || estimate.preliminaryEstimateLow || ""));
    setConvertNotes("");
    setSuccess("");
    setError("");
    setConvertedQuoteNumber(null);
  };

  const cancelConvert = () => {
    setConvertEstimateId(null);
    setQuoteTotal("");
    setConvertNotes("");
  };

  const submitConvert = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!convertEstimateId) return;

    setError("");
    setSuccess("");
    setConvertedQuoteNumber(null);
    setSavingId(convertEstimateId);

    try {
      const data = await apiFetch<{
        estimate: GuruEstimate;
        quote: {
          id: string;
          quoteNumber: number;
          total: number;
        };
      }>(`/api/guru/estimates/${convertEstimateId}/convert-to-quote`, {
        method: "POST",
        body: JSON.stringify({
          quoteTotal: Number(quoteTotal) || 0,
          notes: convertNotes
        })
      });

      setSuccess(
        `Guru estimate converted into Quote #${data.quote.quoteNumber} for $${Number(
          data.quote.total || 0
        ).toFixed(2)}.`
      );
      setConvertedQuoteNumber(data.quote.quoteNumber);

      cancelConvert();
      await loadEstimates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to convert Guru estimate");
    } finally {
      setSavingId(null);
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
  const connectedQuotes = estimates.filter((estimate) => Boolean(estimate.quoteNumber));

  const totalPotentialLow = needsReview.reduce(
    (sum, estimate) => sum + Number(estimate.preliminaryEstimateLow || 0),
    0
  );

  const totalPotentialHigh = needsReview.reduce(
    (sum, estimate) => sum + Number(estimate.preliminaryEstimateHigh || 0),
    0
  );

  const selectedConvertEstimate = estimates.find((estimate) => estimate.id === convertEstimateId);
  const expandedPhotoEstimate = estimates.find((estimate) => estimate.id === expandedPhotoId);
  const expandedPricingEstimate = estimates.find((estimate) => estimate.id === expandedPricingId);
  const expandedReviewEstimate = estimates.find((estimate) => estimate.id === expandedReviewId);

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
      {expandedPhotoEstimate?.photoDataUrl && (
        <section className="panel">
          <div className="panelHeader">
            <div>
              <h2 className="panelTitle">Estimate Photo</h2>
              <p className="brandSubtitle">
                {expandedPhotoEstimate.clientName || "Client"} •{" "}
                {expandedPhotoEstimate.serviceType || "Service"}
              </p>
            </div>

            <button
              className="secondaryButton"
              type="button"
              onClick={() => setExpandedPhotoId(null)}
            >
              Close Photo
            </button>
          </div>

          <img
            src={expandedPhotoEstimate.photoDataUrl}
            alt="Guru estimate uploaded"
            style={{
              width: "100%",
              maxHeight: "72vh",
              objectFit: "contain",
              borderRadius: 18,
              border: "1px solid var(--border)",
              background: "rgba(0,0,0,0.2)"
            }}
          />

          <div className="listCard" style={{ marginTop: 12 }}>
            <strong>Photo Note:</strong>{" "}
            {expandedPhotoEstimate.photoNote || "No photo note provided."}
          </div>
        </section>
      )}

      {expandedReviewEstimate && (
        <section className="panel">
          <div className="panelHeader">
            <div>
              <h2 className="panelTitle">Guru Admin Review</h2>
              <p className="brandSubtitle">
                {expandedReviewEstimate.clientName || "Client"} •{" "}
                {expandedReviewEstimate.serviceType || "Service"}
              </p>
            </div>

            <button
              className="secondaryButton"
              type="button"
              onClick={() => setExpandedReviewId(null)}
            >
              Close Review
            </button>
          </div>

          <div className="statsGrid">
            <div className="statCard">
              <div className="statLabel">Low Range</div>
              <div className="statValue">
                ${expandedReviewEstimate.preliminaryEstimateLow.toFixed(2)}
              </div>
            </div>

            <div className="statCard">
              <div className="statLabel">High Range</div>
              <div className="statValue">
                ${expandedReviewEstimate.preliminaryEstimateHigh.toFixed(2)}
              </div>
            </div>

            <div className="statCard">
              <div className="statLabel">Status</div>
              <div className="statValue" style={{ fontSize: 18 }}>
                {statusLabel(expandedReviewEstimate.status)}
              </div>
            </div>

            {expandedReviewEstimate.quoteNumber && (
              <div className="statCard">
                <div className="statLabel">Connected Quote</div>
                <div className="statValue">#{expandedReviewEstimate.quoteNumber}</div>
              </div>
            )}
          </div>

          <div className="assignBox" style={{ marginTop: 16 }}>
            <div className="assignTitle">Guru Review Summary</div>
            {buildAdminGuruReview(expandedReviewEstimate).map((line) => (
              <div className="cardLine" key={line}>
                • {line}
              </div>
            ))}
          </div>

          <div className="assignBox">
            <div className="assignTitle">Risk / Pricing Checklist</div>
            {buildAdminRiskChecklist(expandedReviewEstimate).map((line) => (
              <div className="cardLine" key={line}>
                • {line}
              </div>
            ))}
          </div>

          <div className="assignBox">
            <div className="assignTitle">Recommended Admin Action</div>

            {expandedReviewEstimate.status === "needs_review" && (
              <>
                <div className="cardLine">
                  Review the client details, confirm missing information, inspect the uploaded photo if available, then mark reviewed or convert to a quote draft.
                </div>

                <div className="buttonRow" style={{ marginTop: 10 }}>
                  <button
                    className="primaryButton"
                    type="button"
                    disabled={savingId === expandedReviewEstimate.id}
                    onClick={() => updateEstimateStatus(expandedReviewEstimate.id, "reviewed")}
                  >
                    Mark Reviewed
                  </button>

                  <button
                    className="secondaryButton"
                    type="button"
                    onClick={() => startConvert(expandedReviewEstimate)}
                  >
                    Convert To Quote Draft
                  </button>
                </div>
              </>
            )}

            {expandedReviewEstimate.status === "reviewed" && (
              <>
                <div className="cardLine">
                  This estimate is reviewed. Next step is usually converting it to a quote draft if the job is worth pursuing.
                </div>

                <button
                  className="primaryButton"
                  type="button"
                  style={{ marginTop: 10 }}
                  onClick={() => startConvert(expandedReviewEstimate)}
                >
                  Convert To Quote Draft
                </button>
              </>
            )}

            {expandedReviewEstimate.status === "converted_to_quote" && (
              <>
                <div className="cardLine">
                  This estimate is already connected to the quote workflow. Review the quote before sending it officially.
                </div>

                <button
                  className="primaryButton"
                  type="button"
                  style={{ marginTop: 10 }}
                  onClick={() => onNavigate("quotes")}
                >
                  Open Quotes
                </button>
              </>
            )}

            {["declined", "archived"].includes(expandedReviewEstimate.status) && (
              <div className="cardLine">
                This estimate is not active. Keep it for records or create a new estimate/quote if the client follows up.
              </div>
            )}
          </div>
        </section>
      )}

      {expandedPricingEstimate && (
        <section className="panel">
          <div className="panelHeader">
            <div>
              <h2 className="panelTitle">Guru Pricing Explanation</h2>
              <p className="brandSubtitle">
                {expandedPricingEstimate.clientName || "Client"} •{" "}
                {expandedPricingEstimate.serviceType || "Service"}
              </p>
            </div>

            <button
              className="secondaryButton"
              type="button"
              onClick={() => setExpandedPricingId(null)}
            >
              Close Explanation
            </button>
          </div>

          <div className="statsGrid">
            <div className="statCard">
              <div className="statLabel">Preliminary Low</div>
              <div className="statValue">
                ${expandedPricingEstimate.preliminaryEstimateLow.toFixed(2)}
              </div>
            </div>

            <div className="statCard">
              <div className="statLabel">Preliminary High</div>
              <div className="statValue">
                ${expandedPricingEstimate.preliminaryEstimateHigh.toFixed(2)}
              </div>
            </div>

            {expandedPricingEstimate.quoteNumber && (
              <div className="statCard">
                <div className="statLabel">Connected Quote</div>
                <div className="statValue">#{expandedPricingEstimate.quoteNumber}</div>
              </div>
            )}

            {expandedPricingEstimate.quoteTotal !== null &&
              expandedPricingEstimate.quoteTotal !== undefined && (
                <div className="statCard">
                  <div className="statLabel">Quote Total</div>
                  <div className="statValue">
                    ${Number(expandedPricingEstimate.quoteTotal).toFixed(2)}
                  </div>
                </div>
              )}
          </div>

          {expandedPricingEstimate.quoteNumber && (
            <div className="assignBox" style={{ marginTop: 16 }}>
              <div className="assignTitle">Connected Quote</div>
              <div className="cardLine">
                <strong>Quote #:</strong> {expandedPricingEstimate.quoteNumber}
              </div>
              <div className="cardLine">
                <strong>Quote Total:</strong>{" "}
                {expandedPricingEstimate.quoteTotal !== null &&
                expandedPricingEstimate.quoteTotal !== undefined
                  ? `$${Number(expandedPricingEstimate.quoteTotal).toFixed(2)}`
                  : "—"}
              </div>
              <div className="cardLine">
                <strong>Quote Status:</strong>{" "}
                {quoteStatusLabel(expandedPricingEstimate.quoteStatus)}
              </div>

              <button
                className="primaryButton"
                type="button"
                style={{ marginTop: 10 }}
                onClick={() => onNavigate("quotes")}
              >
                Open Quotes
              </button>
            </div>
          )}

          <div className="assignBox" style={{ marginTop: 16 }}>
            <div className="assignTitle">Pricing Basis</div>
            <div className="cardLine">
              {expandedPricingEstimate.preliminaryNotes ||
                "Guru used the selected service type, condition, surface, size, and concerns to create a preliminary range."}
            </div>
          </div>

          <div className="assignBox">
            <div className="assignTitle">Inputs Guru Considered</div>

            {pricingExplanation(expandedPricingEstimate).map((item) => (
              <div key={item} className="cardLine">
                • {item}
              </div>
            ))}

            {pricingExplanation(expandedPricingEstimate).length === 0 && (
              <div className="cardLine">No detailed estimate inputs were provided.</div>
            )}
          </div>

          <div className="assignBox">
            <div className="assignTitle">Admin Review Reminder</div>
            <div className="cardLine">
              This range is not final pricing. Review photos, property access, surface condition,
              risk, oxidation, plant protection, chemical needs, labor time, travel, minimum service
              charge, and customer expectations before sending the official quote.
            </div>
          </div>
        </section>
      )}

      <section className="panel">
        <div className="panelHeader">
          <div>
            <h2 className="panelTitle">Guru Estimates Review</h2>
            <p className="brandSubtitle">
              Review preliminary client estimates, uploaded photos, pricing logic, connected quotes, and details before finalizing.
            </p>
          </div>
        </div>

        {error && <div className="errorBox">{error}</div>}

        {success && (
          <div className="listCard">
            <div>{success}</div>

            {convertedQuoteNumber && (
              <div className="buttonRow" style={{ marginTop: 12 }}>
                <button
                  className="primaryButton"
                  type="button"
                  onClick={() => onNavigate("quotes")}
                >
                  Open Quotes
                </button>

                <button
                  className="secondaryButton"
                  type="button"
                  onClick={() => {
                    setFilter("converted_to_quote");
                    setSuccess("");
                    setConvertedQuoteNumber(null);
                  }}
                >
                  View Converted Estimates
                </button>
              </div>
            )}
          </div>
        )}

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
            <div className="statLabel">Connected Quotes</div>
            <div className="statValue">{connectedQuotes.length}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Declined</div>
            <div className="statValue">{declined.length}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">With Photos</div>
            <div className="statValue">
              {estimates.filter((estimate) => Boolean(estimate.photoDataUrl)).length}
            </div>
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

      {selectedConvertEstimate && (
        <section className="panel">
          <div className="panelHeader">
            <div>
              <h2 className="panelTitle">Convert Guru Estimate To Quote Draft</h2>
              <p className="brandSubtitle">
                {selectedConvertEstimate.clientName || "Client"} •{" "}
                {selectedConvertEstimate.serviceType || "Service"}
              </p>
            </div>

            <button className="secondaryButton" type="button" onClick={cancelConvert}>
              Close
            </button>
          </div>

          <form className="formGrid" onSubmit={submitConvert}>
            <div className="listCard">
              This creates a draft quote. Admin should still review the quote before sending it to the client.
            </div>

            <input
              className="textInput"
              placeholder="Quote total"
              inputMode="decimal"
              value={quoteTotal}
              onChange={(e) => setQuoteTotal(e.target.value)}
            />

            <textarea
              className="textInput"
              placeholder="Admin conversion notes optional"
              rows={4}
              value={convertNotes}
              onChange={(e) => setConvertNotes(e.target.value)}
            />

            <div className="assignBox">
              <div className="assignTitle">Original Guru Details</div>
              <div className="cardLine">
                <strong>Preliminary Range:</strong> $
                {selectedConvertEstimate.preliminaryEstimateLow.toFixed(2)} - $
                {selectedConvertEstimate.preliminaryEstimateHigh.toFixed(2)}
              </div>
              <div className="cardLine">
                <strong>Address:</strong> {selectedConvertEstimate.address || "—"}
              </div>
              <div className="cardLine">
                <strong>Surface:</strong> {selectedConvertEstimate.surfaceType || "—"}
              </div>
              <div className="cardLine">
                <strong>Condition:</strong> {selectedConvertEstimate.conditionLevel || "—"}
              </div>
              <div className="cardLine">
                <strong>Concerns:</strong> {selectedConvertEstimate.specialConcerns || "—"}
              </div>
              <div className="cardLine">
                <strong>Photo Note:</strong> {selectedConvertEstimate.photoNote || "—"}
              </div>

              <div className="buttonRow" style={{ marginTop: 10 }}>
                <button
                  className="secondaryButton"
                  type="button"
                  onClick={() => setExpandedPricingId(selectedConvertEstimate.id)}
                >
                  View Pricing Explanation
                </button>

                <button
                  className="secondaryButton"
                  type="button"
                  onClick={() => setExpandedReviewId(selectedConvertEstimate.id)}
                >
                  Ask Guru To Review
                </button>

                {selectedConvertEstimate.photoDataUrl && (
                  <button
                    className="secondaryButton"
                    type="button"
                    onClick={() => setExpandedPhotoId(selectedConvertEstimate.id)}
                  >
                    View Uploaded Photo
                  </button>
                )}
              </div>
            </div>

            <div className="buttonRow">
              <button
                className="primaryButton"
                type="submit"
                disabled={savingId === selectedConvertEstimate.id}
              >
                {savingId === selectedConvertEstimate.id ? "Converting..." : "Create Quote Draft"}
              </button>

              <button className="secondaryButton" type="button" onClick={cancelConvert}>
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="panel">
        <div className="panelHeader">
          <div>
            <h2 className="panelTitle">Estimate Queue</h2>
            <p className="brandSubtitle">
              Guru estimates are preliminary and must be manually confirmed before becoming official quotes.
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

              {estimate.quoteNumber && (
                <div className="assignBox" style={{ marginBottom: 12 }}>
                  <div className="assignTitle">Connected Quote</div>
                  <div className="cardLine">
                    <strong>Quote #:</strong> {estimate.quoteNumber}
                  </div>
                  <div className="cardLine">
                    <strong>Quote Total:</strong>{" "}
                    {estimate.quoteTotal !== null && estimate.quoteTotal !== undefined
                      ? `$${Number(estimate.quoteTotal).toFixed(2)}`
                      : "—"}
                  </div>
                  <div className="cardLine">
                    <strong>Quote Status:</strong> {quoteStatusLabel(estimate.quoteStatus)}
                  </div>

                  <button
                    className="primaryButton"
                    type="button"
                    style={{ marginTop: 10 }}
                    onClick={() => onNavigate("quotes")}
                  >
                    Open Quotes
                  </button>
                </div>
              )}

              {estimate.photoDataUrl && (
                <div style={{ marginBottom: 12 }}>
                  <img
                    src={estimate.photoDataUrl}
                    alt="Guru estimate uploaded preview"
                    style={{
                      width: "100%",
                      height: 190,
                      objectFit: "cover",
                      borderRadius: 14,
                      border: "1px solid var(--border)"
                    }}
                  />

                  <div className="buttonRow" style={{ marginTop: 8 }}>
                    <button
                      className="secondaryButton"
                      type="button"
                      onClick={() => setExpandedPhotoId(estimate.id)}
                    >
                      View Photo
                    </button>
                  </div>
                </div>
              )}

              <div className="assignBox" style={{ marginBottom: 12 }}>
                <div className="assignTitle">Guru Pricing</div>
                <div className="cardLine">
                  <strong>Range:</strong> ${estimate.preliminaryEstimateLow.toFixed(2)} - $
                  {estimate.preliminaryEstimateHigh.toFixed(2)}
                </div>
                <div className="cardLine">
                  <strong>Basis:</strong> {cleanText(estimate.preliminaryNotes)}
                </div>

                <div className="buttonRow" style={{ marginTop: 10 }}>
                  <button
                    className="secondaryButton"
                    type="button"
                    onClick={() => setExpandedPricingId(estimate.id)}
                  >
                    View Pricing Explanation
                  </button>

                  <button
                    className="secondaryButton"
                    type="button"
                    onClick={() => setExpandedReviewId(estimate.id)}
                  >
                    Ask Guru To Review
                  </button>
                </div>
              </div>

              <div className="cardLine">
                <strong>Service:</strong> {cleanText(estimate.serviceType)}
              </div>

              <div className="cardLine">
                <strong>Phone:</strong> {cleanText(estimate.phone)}
              </div>

              <div className="cardLine">
                <strong>Email:</strong> {cleanText(estimate.email)}
              </div>

              <div className="cardLine">
                <strong>Address:</strong> {cleanText(estimate.address)}
              </div>

              <div className="cardLine">
                <strong>Property Area:</strong> {cleanText(estimate.propertyArea)}
              </div>

              <div className="cardLine">
                <strong>Surface:</strong> {cleanText(estimate.surfaceType)}
              </div>

              <div className="cardLine">
                <strong>Condition:</strong> {cleanText(estimate.conditionLevel)}
              </div>

              <div className="cardLine">
                <strong>Size:</strong> {cleanText(estimate.squareFootage)}
              </div>

              <div className="cardLine">
                <strong>Preferred Schedule:</strong> {cleanText(estimate.preferredSchedule)}
              </div>

              <div className="cardLine">
                <strong>Special Concerns:</strong> {cleanText(estimate.specialConcerns)}
              </div>

              <div className="cardLine">
                <strong>Photo Note:</strong> {cleanText(estimate.photoNote)}
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
                    disabled={savingId === estimate.id}
                    onClick={() => updateEstimateStatus(estimate.id, "reviewed")}
                  >
                    Mark Reviewed
                  </button>
                )}

                {estimate.status !== "converted_to_quote" && (
                  <button
                    className="primaryButton"
                    type="button"
                    disabled={savingId === estimate.id}
                    onClick={() => startConvert(estimate)}
                  >
                    Convert To Quote Draft
                  </button>
                )}

                {estimate.status !== "declined" && (
                  <button
                    className="secondaryButton"
                    type="button"
                    disabled={savingId === estimate.id}
                    onClick={() => updateEstimateStatus(estimate.id, "declined")}
                  >
                    Decline
                  </button>
                )}

                {estimate.status !== "archived" && (
                  <button
                    className="secondaryButton"
                    type="button"
                    disabled={savingId === estimate.id}
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

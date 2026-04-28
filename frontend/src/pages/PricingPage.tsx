import React from "react";
import { apiFetch } from "../api";

type PricingReference = {
  id: string;
  serviceType: string;
  surfaceType: string;
  conditionSeverity: string;
  pricingModel: string;
  flatPrice: number;
  sqftPrice: number;
  subscriptionPrice: number;
  hourlyRate: number;
  estimatedHours: number;
  estimatedMaterialCost: number;
  upsellSuggestions?: string;
  notes?: string;
};

export default function PricingPage() {
  const [pricing, setPricing] = React.useState<PricingReference[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  const [form, setForm] = React.useState({
    serviceType: "",
    surfaceType: "",
    conditionSeverity: "",
    pricingModel: "per_sqft",
    flatPrice: "",
    sqftPrice: "",
    subscriptionPrice: "",
    hourlyRate: "",
    estimatedHours: "",
    estimatedMaterialCost: "",
    upsellSuggestions: "",
    notes: ""
  });

  const loadPricing = async () => {
    setError("");
    setSuccess("");

    try {
      const query = search ? `?search=${encodeURIComponent(search)}` : "";

      const data = await apiFetch<{ pricing: PricingReference[] }>(
        `/api/pricing${query}`
      );

      setPricing(data.pricing);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed loading pricing");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadPricing();
  }, []);

  const createPricing = async () => {
    setError("");
    setSuccess("");

    try {
      await apiFetch("/api/pricing", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          flatPrice: form.flatPrice ? Number(form.flatPrice) : null,
          sqftPrice: form.sqftPrice ? Number(form.sqftPrice) : null,
          subscriptionPrice: form.subscriptionPrice ? Number(form.subscriptionPrice) : null,
          hourlyRate: form.hourlyRate ? Number(form.hourlyRate) : null,
          estimatedHours: form.estimatedHours ? Number(form.estimatedHours) : null,
          estimatedMaterialCost: form.estimatedMaterialCost
            ? Number(form.estimatedMaterialCost)
            : null
        })
      });

      setForm({
        serviceType: "",
        surfaceType: "",
        conditionSeverity: "",
        pricingModel: "per_sqft",
        flatPrice: "",
        sqftPrice: "",
        subscriptionPrice: "",
        hourlyRate: "",
        estimatedHours: "",
        estimatedMaterialCost: "",
        upsellSuggestions: "",
        notes: ""
      });

      setSuccess("Pricing reference saved.");
      await loadPricing();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed creating pricing");
    }
  };

  const seedHomewyse = async () => {
    setError("");
    setSuccess("");

    try {
      const data = await apiFetch<{ inserted: number; message: string }>(
        "/api/pricing/seed-homewyse",
        {
          method: "POST"
        }
      );

      setSuccess(data.message);
      await loadPricing();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed importing Homewyse data");
    }
  };

  const deletePricing = async (id: string) => {
    setError("");
    setSuccess("");

    try {
      await apiFetch(`/api/pricing/${id}`, {
        method: "DELETE"
      });

      setSuccess("Pricing reference deleted.");
      await loadPricing();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  if (loading) {
    return (
      <section className="panel">
        <h2 className="panelTitle">Pricing</h2>
        <div className="listCard">Loading pricing...</div>
      </section>
    );
  }

  return (
    <div className="pageGrid">
      <section className="panel">
        <h2 className="panelTitle">Search Pricing</h2>

        {error && <div className="errorBox">{error}</div>}
        {success && <div className="listCard">{success}</div>}

        <div className="formGrid">
          <input
            className="textInput"
            placeholder="Search service, surface, severity, notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="buttonRow">
            <button className="primaryButton" onClick={loadPricing}>
              Search
            </button>

            <button className="secondaryButton" onClick={seedHomewyse}>
              Import Homewyse Pricing Seeds
            </button>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2 className="panelTitle">Add Pricing Reference</h2>

        <div className="formGrid">
          <input
            className="textInput"
            placeholder="Service Type"
            value={form.serviceType}
            onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
          />

          <input
            className="textInput"
            placeholder="Surface Type"
            value={form.surfaceType}
            onChange={(e) => setForm({ ...form, surfaceType: e.target.value })}
          />

          <input
            className="textInput"
            placeholder="Condition Severity"
            value={form.conditionSeverity}
            onChange={(e) => setForm({ ...form, conditionSeverity: e.target.value })}
          />

          <select
            className="textInput"
            value={form.pricingModel}
            onChange={(e) => setForm({ ...form, pricingModel: e.target.value })}
          >
            <option value="flat_rate">Flat Rate</option>
            <option value="per_sqft">Per Sq Ft</option>
            <option value="subscription">Subscription</option>
            <option value="hourly">Hourly</option>
            <option value="custom">Custom</option>
          </select>

          <input
            className="textInput"
            placeholder="Flat Price"
            value={form.flatPrice}
            onChange={(e) => setForm({ ...form, flatPrice: e.target.value })}
          />

          <input
            className="textInput"
            placeholder="Sq Ft Price"
            value={form.sqftPrice}
            onChange={(e) => setForm({ ...form, sqftPrice: e.target.value })}
          />

          <input
            className="textInput"
            placeholder="Subscription Price"
            value={form.subscriptionPrice}
            onChange={(e) => setForm({ ...form, subscriptionPrice: e.target.value })}
          />

          <input
            className="textInput"
            placeholder="Hourly Rate"
            value={form.hourlyRate}
            onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })}
          />

          <input
            className="textInput"
            placeholder="Estimated Hours"
            value={form.estimatedHours}
            onChange={(e) => setForm({ ...form, estimatedHours: e.target.value })}
          />

          <input
            className="textInput"
            placeholder="Estimated Material Cost"
            value={form.estimatedMaterialCost}
            onChange={(e) => setForm({ ...form, estimatedMaterialCost: e.target.value })}
          />

          <textarea
            className="textInput"
            placeholder="Upsell Suggestions"
            rows={3}
            value={form.upsellSuggestions}
            onChange={(e) => setForm({ ...form, upsellSuggestions: e.target.value })}
          />

          <textarea
            className="textInput"
            placeholder="Notes"
            rows={4}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>

        <button className="primaryButton" onClick={createPricing}>
          Save Pricing
        </button>
      </section>

      <section className="panel">
        <h2 className="panelTitle">Pricing Database</h2>

        <div className="cardsGrid">
          {pricing.map((item) => (
            <div key={item.id} className="quoteCard">
              <div className="quoteTopRow">
                <div className="quoteNumber">{item.serviceType}</div>
                <span className="statusBadge status-scheduled">
                  {item.pricingModel}
                </span>
              </div>

              <div className="cardLine">
                <strong>Surface:</strong> {item.surfaceType}
              </div>

              <div className="cardLine">
                <strong>Severity:</strong> {item.conditionSeverity}
              </div>

              <div className="cardLine">
                <strong>Flat:</strong> ${item.flatPrice.toFixed(2)}
              </div>

              <div className="cardLine">
                <strong>Sq Ft:</strong> ${item.sqftPrice.toFixed(4)}
              </div>

              <div className="cardLine">
                <strong>Subscription:</strong> ${item.subscriptionPrice.toFixed(2)}
              </div>

              <div className="cardLine">
                <strong>Hourly:</strong> ${item.hourlyRate.toFixed(2)}
              </div>

              <div className="cardLine">
                <strong>Labor:</strong> {item.estimatedHours.toFixed(2)} hrs
              </div>

              <div className="cardLine">
                <strong>Materials:</strong> ${item.estimatedMaterialCost.toFixed(2)}
              </div>

              <div className="cardLine">
                <strong>Upsells:</strong> {item.upsellSuggestions || "—"}
              </div>

              <div className="cardLine">
                <strong>Notes:</strong> {item.notes || "—"}
              </div>

              <button
                className="secondaryButton"
                onClick={() => deletePricing(item.id)}
              >
                Delete
              </button>
            </div>
          ))}

          {pricing.length === 0 && (
            <div className="listCard">No pricing references yet.</div>
          )}
        </div>
      </section>
    </div>
  );
}

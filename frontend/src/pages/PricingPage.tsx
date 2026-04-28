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

  const [form, setForm] = React.useState({
    serviceType: "",
    surfaceType: "",
    conditionSeverity: "",
    pricingModel: "",
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
    try {
      const query = search
        ? `?search=${encodeURIComponent(search)}`
        : "";

      const data = await apiFetch<{
        pricing: PricingReference[]
      }>(`/api/pricing${query}`);

      setPricing(data.pricing);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed loading pricing"
      );
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadPricing();
  }, []);

  const createPricing = async () => {
    try {
      await apiFetch("/api/pricing", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          flatPrice: form.flatPrice
            ? Number(form.flatPrice)
            : null,
          sqftPrice: form.sqftPrice
            ? Number(form.sqftPrice)
            : null,
          subscriptionPrice: form.subscriptionPrice
            ? Number(form.subscriptionPrice)
            : null,
          hourlyRate: form.hourlyRate
            ? Number(form.hourlyRate)
            : null,
          estimatedHours: form.estimatedHours
            ? Number(form.estimatedHours)
            : null,
          estimatedMaterialCost:
            form.estimatedMaterialCost
              ? Number(form.estimatedMaterialCost)
              : null
        })
      });

      loadPricing();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed creating pricing"
      );
    }
  };

  const deletePricing = async (id: string) => {
    try {
      await apiFetch(`/api/pricing/${id}`, {
        method: "DELETE"
      });

      loadPricing();
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
        Loading pricing...
      </section>
    );
  }

  return (
    <div className="pageGrid">

      <section className="panel">
        <h2 className="panelTitle">
          Search Pricing
        </h2>

        <input
          className="input"
          placeholder="Search service/surface..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />

        <button
          className="primaryButton"
          onClick={loadPricing}
        >
          Search
        </button>
      </section>

      <section className="panel">
        <h2 className="panelTitle">
          Add Pricing Reference
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
          onClick={createPricing}
        >
          Save Pricing
        </button>
      </section>

      <section className="panel">
        <h2 className="panelTitle">
          Pricing Database
        </h2>

        <div className="cardsGrid">
          {pricing.map((item) => (
            <div
              key={item.id}
              className="quoteCard"
            >
              <div className="quoteNumber">
                {item.serviceType}
              </div>

              <div className="cardLine">
                <strong>Surface:</strong> {item.surfaceType}
              </div>

              <div className="cardLine">
                <strong>Severity:</strong> {item.conditionSeverity}
              </div>

              <div className="cardLine">
                <strong>Model:</strong> {item.pricingModel}
              </div>

              <div className="cardLine">
                <strong>Flat:</strong> ${item.flatPrice}
              </div>

              <div className="cardLine">
                <strong>Sqft:</strong> ${item.sqftPrice}
              </div>

              <div className="cardLine">
                <strong>Subscription:</strong> ${item.subscriptionPrice}
              </div>

              <div className="cardLine">
                <strong>Labor:</strong> {item.estimatedHours} hrs
              </div>

              <div className="cardLine">
                <strong>Materials:</strong> $
                {item.estimatedMaterialCost}
              </div>

              <div className="cardLine">
                <strong>Upsells:</strong>{" "}
                {item.upsellSuggestions}
              </div>

              <button
                className="dangerButton"
                onClick={() =>
                  deletePricing(item.id)
                }
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}

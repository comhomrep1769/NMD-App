import React from "react";
import { apiFetch } from "../api";

type Equipment = {
  id: string;
  name: string;
  category: string;
  description?: string;
  identifier?: string;
  status: string;
  psiRating?: number;
  waterCapacityGallons?: number;
  bedSpace?: string;
  hitchType?: string;
  maintenanceNotes?: string;
};

export default function EquipmentPage() {
  const [equipment, setEquipment] = React.useState<Equipment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const [form, setForm] = React.useState({
    name: "",
    category: "",
    description: "",
    identifier: "",
    psiRating: "",
    waterCapacityGallons: "",
    bedSpace: "",
    hitchType: "",
    maintenanceNotes: ""
  });

  const loadEquipment = async () => {
    try {
      const data = await apiFetch<{ equipment: Equipment[] }>("/api/equipment");
      setEquipment(data.equipment);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load equipment"
      );
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadEquipment();
  }, []);

  const createEquipment = async () => {
    try {
      await apiFetch("/api/equipment", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          psiRating: form.psiRating
            ? Number(form.psiRating)
            : null,
          waterCapacityGallons: form.waterCapacityGallons
            ? Number(form.waterCapacityGallons)
            : null
        })
      });

      setForm({
        name: "",
        category: "",
        description: "",
        identifier: "",
        psiRating: "",
        waterCapacityGallons: "",
        bedSpace: "",
        hitchType: "",
        maintenanceNotes: ""
      });

      loadEquipment();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create equipment"
      );
    }
  };

  if (loading) {
    return (
      <section className="panel">
        <h2 className="panelTitle">Equipment</h2>
        <div className="listCard">Loading equipment...</div>
      </section>
    );
  }

  return (
    <div className="pageGrid">
      <section className="panel">
        <h2 className="panelTitle">Add Equipment</h2>

        {error && (
          <div className="errorBox">
            {error}
          </div>
        )}

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
          onClick={createEquipment}
        >
          Add Equipment
        </button>
      </section>

      <section className="panel">
        <h2 className="panelTitle">
          Equipment Inventory
        </h2>

        <div className="cardsGrid">
          {equipment.map((item) => (
            <div
              key={item.id}
              className="quoteCard"
            >
              <div className="quoteTopRow">
                <div className="quoteNumber">
                  {item.name}
                </div>

                <span className={`statusBadge status-${item.status}`}>
                  {item.status}
                </span>
              </div>

              <div className="cardLine">
                <strong>Category:</strong> {item.category}
              </div>

              {item.identifier && (
                <div className="cardLine">
                  <strong>ID:</strong> {item.identifier}
                </div>
              )}

              {item.psiRating && (
                <div className="cardLine">
                  <strong>PSI:</strong> {item.psiRating}
                </div>
              )}

              {item.waterCapacityGallons && (
                <div className="cardLine">
                  <strong>Water:</strong> {item.waterCapacityGallons} gal
                </div>
              )}

              {item.bedSpace && (
                <div className="cardLine">
                  <strong>Bed Space:</strong> {item.bedSpace}
                </div>
              )}

              {item.hitchType && (
                <div className="cardLine">
                  <strong>Hitch:</strong> {item.hitchType}
                </div>
              )}

              {item.maintenanceNotes && (
                <div className="cardLine">
                  <strong>Maintenance:</strong> {item.maintenanceNotes}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

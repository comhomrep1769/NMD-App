import React from "react";
import { apiFetch } from "../api";
import type {
  Client,
  RecurringFrequency,
  RecurringService,
  RecurringStatus
} from "../types";

const frequencies: RecurringFrequency[] = [
  "weekly",
  "biweekly",
  "monthly",
  "quarterly"
];

const statuses: RecurringStatus[] = [
  "active",
  "paused",
  "cancelled"
];

export default function RecurringPage() {
  const [services, setServices] = React.useState<RecurringService[]>([]);
  const [clients, setClients] = React.useState<Client[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [clientId, setClientId] = React.useState("");
  const [clientName, setClientName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [serviceType, setServiceType] = React.useState("Trash Can Cleaning");
  const [frequency, setFrequency] = React.useState<RecurringFrequency>("monthly");
  const [price, setPrice] = React.useState("10");
  const [status, setStatus] = React.useState<RecurringStatus>("active");
  const [nextServiceDate, setNextServiceDate] = React.useState("");
  const [notes, setNotes] = React.useState("");

  const loadData = React.useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [recurringData, clientData] = await Promise.all([
        apiFetch<{ recurringServices: RecurringService[] }>("/api/recurring"),
        apiFetch<{ clients: Client[] }>("/api/clients")
      ]);

      setServices(recurringData.recurringServices);
      setClients(clientData.clients);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load recurring services");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () => {
    setEditingId(null);
    setClientId("");
    setClientName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setServiceType("Trash Can Cleaning");
    setFrequency("monthly");
    setPrice("10");
    setStatus("active");
    setNextServiceDate("");
    setNotes("");
  };

  const handleClientSelect = (value: string) => {
    setClientId(value);

    const selected = clients.find((client) => client.id === value);
    if (selected) {
      setClientName(`${selected.firstName} ${selected.lastName}`);
      setPhone(selected.phone || "");
      setEmail(selected.email || "");
      setAddress(selected.address || "");
    }
  };

  const startEdit = (service: RecurringService) => {
    setEditingId(service.id);
    setClientId(service.clientId || "");
    setClientName(service.clientName);
    setPhone(service.phone || "");
    setEmail(service.email || "");
    setAddress(service.address);
    setServiceType(service.serviceType);
    setFrequency(service.frequency);
    setPrice(String(service.price));
    setStatus(service.status);
    setNextServiceDate(service.nextServiceDate ? String(service.nextServiceDate).slice(0, 10) : "");
    setNotes(service.notes || "");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const payload = {
      clientId: clientId || null,
      clientName,
      phone,
      email,
      address,
      serviceType,
      frequency,
      price: Number(price) || 0,
      status,
      nextServiceDate: nextServiceDate || null,
      notes
    };

    try {
      if (editingId) {
        await apiFetch(`/api/recurring/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload)
        });

        setSuccess("Recurring service updated.");
      } else {
        await apiFetch("/api/recurring", {
          method: "POST",
          body: JSON.stringify(payload)
        });

        setSuccess("Recurring service added.");
      }

      resetForm();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save recurring service");
    }
  };

  const updateStatus = async (id: string, newStatus: RecurringStatus) => {
    setError("");
    setSuccess("");

    try {
      await apiFetch(`/api/recurring/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus })
      });

      setSuccess(`Recurring service marked ${newStatus}.`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  const createNextJob = async (id: string) => {
    setError("");
    setSuccess("");

    try {
      await apiFetch(`/api/recurring/${id}/create-next-job`, {
        method: "POST"
      });

      setSuccess("Scheduled job created from recurring service.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create scheduled job");
    }
  };

  const sendReminder = async (id: string) => {
    setError("");
    setSuccess("");

    try {
      await apiFetch(`/api/recurring/${id}/send-reminder`, {
        method: "POST"
      });

      setSuccess("Reminder email sent.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reminder");
    }
  };

  const deleteService = async (id: string) => {
    const ok = window.confirm("Delete this recurring service?");
    if (!ok) return;

    setError("");
    setSuccess("");

    try {
      await apiFetch(`/api/recurring/${id}`, {
        method: "DELETE"
      });

      setSuccess("Recurring service deleted.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete recurring service");
    }
  };

  const activeServices = services.filter((service) => service.status === "active");
  const monthlyRevenue = activeServices.reduce((sum, service) => {
    if (service.frequency === "weekly") return sum + service.price * 4;
    if (service.frequency === "biweekly") return sum + service.price * 2;
    if (service.frequency === "monthly") return sum + service.price;
    if (service.frequency === "quarterly") return sum + service.price / 3;
    return sum;
  }, 0);

  return (
    <div className="pageGrid">
      <section className="panel">
        <div className="panelHeader">
          <h2 className="panelTitle">
            {editingId ? "Edit Recurring Service" : "New Recurring Service"}
          </h2>
        </div>

        {error && <div className="errorBox">{error}</div>}
        {success && <div className="listCard">{success}</div>}

        <form className="formGrid" onSubmit={submit}>
          <select
            className="textInput"
            value={clientId}
            onChange={(e) => handleClientSelect(e.target.value)}
          >
            <option value="">Select saved client optional</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.firstName} {client.lastName}
              </option>
            ))}
          </select>

          <input
            className="textInput"
            placeholder="Client name"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
          />

          <input
            className="textInput"
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <input
            className="textInput"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="textInput"
            placeholder="Service address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <select
            className="textInput"
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
          >
            <option value="Trash Can Cleaning">Trash Can Cleaning</option>
            <option value="Driveway Cleaning">Driveway Cleaning</option>
            <option value="Sidewalk Cleaning">Sidewalk Cleaning</option>
            <option value="House Wash">House Wash</option>
            <option value="Commercial Cleaning">Commercial Cleaning</option>
            <option value="Other">Other</option>
          </select>

          <select
            className="textInput"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
          >
            {frequencies.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>

          <input
            className="textInput"
            placeholder="Price"
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />

          <select
            className="textInput"
            value={status}
            onChange={(e) => setStatus(e.target.value as RecurringStatus)}
          >
            {statuses.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>

          <input
            className="textInput"
            type="date"
            value={nextServiceDate}
            onChange={(e) => setNextServiceDate(e.target.value)}
          />

          <textarea
            className="textInput"
            placeholder="Notes"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="buttonRow">
            <button className="primaryButton" type="submit">
              {editingId ? "Save Recurring Service" : "Add Recurring Service"}
            </button>

            {editingId && (
              <button className="secondaryButton" type="button" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="panelHeader">
          <h2 className="panelTitle">Recurring Services</h2>
        </div>

        <div className="statsGrid" style={{ marginBottom: 16 }}>
          <div className="statCard">
            <div className="statLabel">Active Recurring Services</div>
            <div className="statValue">{activeServices.length}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Estimated Monthly Revenue</div>
            <div className="statValue">${monthlyRevenue.toFixed(2)}</div>
          </div>
        </div>

        {loading && <div className="listCard">Loading recurring services...</div>}

        {!loading && (
          <div className="cardsGrid">
            {services.map((service) => (
              <div key={service.id} className="quoteCard">
                <div className="quoteTopRow">
                  <div className="quoteNumber">{service.clientName}</div>
                  <span className={`statusBadge status-${service.status}`}>
                    {service.status}
                  </span>
                </div>

                <div className="cardLine"><strong>Service:</strong> {service.serviceType}</div>
                <div className="cardLine"><strong>Frequency:</strong> {service.frequency}</div>
                <div className="cardLine"><strong>Price:</strong> ${service.price.toFixed(2)}</div>
                <div className="cardLine">
                  <strong>Next Service:</strong>{" "}
                  {service.nextServiceDate ? new Date(service.nextServiceDate).toLocaleDateString() : "—"}
                </div>
                <div className="cardLine"><strong>Address:</strong> {service.address}</div>
                <div className="cardLine"><strong>Phone:</strong> {service.phone || "—"}</div>
                <div className="cardLine"><strong>Email:</strong> {service.email || "—"}</div>
                <div className="cardLine"><strong>Notes:</strong> {service.notes || "—"}</div>

                <div className="buttonRow">
                  <button className="secondaryButton" onClick={() => startEdit(service)}>
                    Edit
                  </button>

                  <button className="secondaryButton" onClick={() => sendReminder(service.id)}>
                    Send Reminder
                  </button>

                  {service.status !== "active" && (
                    <button className="secondaryButton" onClick={() => updateStatus(service.id, "active")}>
                      Activate
                    </button>
                  )}

                  {service.status === "active" && (
                    <button className="secondaryButton" onClick={() => updateStatus(service.id, "paused")}>
                      Pause
                    </button>
                  )}

                  {service.status !== "cancelled" && (
                    <button className="secondaryButton" onClick={() => updateStatus(service.id, "cancelled")}>
                      Cancel
                    </button>
                  )}

                  <button className="primaryButton" onClick={() => createNextJob(service.id)}>
                    Create Next Job
                  </button>

                  <button className="secondaryButton" onClick={() => deleteService(service.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}

            {services.length === 0 && (
              <div className="listCard">No recurring services yet.</div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

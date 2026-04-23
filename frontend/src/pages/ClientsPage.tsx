import React from "react";
import { apiFetch } from "../api";
import type { Client } from "../types";

export default function ClientsPage() {
  const [clients, setClients] = React.useState<Client[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [address, setAddress] = React.useState("");

  const loadClients = React.useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await apiFetch<{ clients: Client[] }>("/api/clients");
      setClients(data.clients);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load clients");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadClients();
  }, [loadClients]);

  const resetForm = () => {
    setEditingId(null);
    setFirstName("");
    setLastName("");
    setPhone("");
    setEmail("");
    setAddress("");
  };

  const startEdit = (client: Client) => {
    setEditingId(client.id);
    setFirstName(client.firstName);
    setLastName(client.lastName);
    setPhone(client.phone);
    setEmail(client.email);
    setAddress(client.address);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      if (editingId) {
        await apiFetch(`/api/clients/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify({ firstName, lastName, phone, email, address })
        });
      } else {
        await apiFetch("/api/clients", {
          method: "POST",
          body: JSON.stringify({ firstName, lastName, phone, email, address })
        });
      }

      resetForm();
      await loadClients();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save client");
    }
  };

  const deleteClient = async (clientId: string) => {
    const ok = window.confirm("Delete this client?");
    if (!ok) return;

    try {
      await apiFetch(`/api/clients/${clientId}`, {
        method: "DELETE"
      });

      await loadClients();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete client");
    }
  };

  return (
    <div className="pageGrid">
      <section className="panel">
        <div className="panelHeader">
          <h2 className="panelTitle">{editingId ? "Edit Client" : "New Client"}</h2>
        </div>

        {error && <div className="errorBox">{error}</div>}

        <form className="formGrid" onSubmit={submit}>
          <input
            className="textInput"
            placeholder="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />

          <input
            className="textInput"
            placeholder="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
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
            placeholder="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <div className="buttonRow">
            <button className="primaryButton" type="submit">
              {editingId ? "Save Changes" : "Add Client"}
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
          <h2 className="panelTitle">Clients</h2>
        </div>

        {loading && <div className="listCard">Loading clients...</div>}

        {!loading && (
          <div className="cardsGrid">
            {clients.map((client) => (
              <div key={client.id} className="quoteCard">
                <div className="quoteTopRow">
                  <div className="quoteNumber">
                    {client.firstName} {client.lastName}
                  </div>
                </div>

                <div className="cardLine"><strong>Phone:</strong> {client.phone || "—"}</div>
                <div className="cardLine"><strong>Email:</strong> {client.email || "—"}</div>
                <div className="cardLine"><strong>Address:</strong> {client.address || "—"}</div>

                <div className="buttonRow">
                  <button className="secondaryButton" onClick={() => startEdit(client)}>
                    Edit
                  </button>

                  <button className="secondaryButton" onClick={() => deleteClient(client.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}

            {clients.length === 0 && (
              <div className="listCard">No clients yet.</div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

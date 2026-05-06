import React from "react";
import { apiFetch } from "../api";
import type { Client, Quote, QuoteStatus } from "../types";

export default function QuotesPage() {
  const [quotes, setQuotes] = React.useState<Quote[]>([]);
  const [clients, setClients] = React.useState<Client[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [clientId, setClientId] = React.useState("");
  const [clientName, setClientName] = React.useState("");
  const [serviceType, setServiceType] = React.useState("");
  const [total, setTotal] = React.useState("");
  const [status, setStatus] = React.useState<QuoteStatus>("draft");

  const loadData = React.useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [quoteData, clientData] = await Promise.all([
        apiFetch<{ quotes: Quote[] }>("/api/quotes"),
        apiFetch<{ clients: Client[] }>("/api/clients")
      ]);

      setQuotes(quoteData.quotes);
      setClients(clientData.clients);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load quotes");
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
    setServiceType("");
    setTotal("");
    setStatus("draft");
  };

  const handleClientSelect = (value: string) => {
    setClientId(value);

    const selected = clients.find((client) => client.id === value);

    if (selected) {
      setClientName(`${selected.firstName} ${selected.lastName}`);
    }
  };

  const startEdit = (quote: Quote) => {
    setEditingId(quote.id);
    setClientId(quote.clientId || "");
    setClientName(quote.clientName);
    setServiceType(quote.serviceType);
    setTotal(String(quote.total));
    setStatus(quote.status);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const payload = {
      clientId: clientId || null,
      clientName,
      serviceType,
      total: Number(total) || 0,
      status
    };

    try {
      if (editingId) {
        await apiFetch(`/api/quotes/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload)
        });

        setSuccess("Quote updated.");
      } else {
        await apiFetch("/api/quotes", {
          method: "POST",
          body: JSON.stringify(payload)
        });

        setSuccess("Quote created.");
      }

      resetForm();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save quote");
    }
  };

  const acceptQuote = async (quoteId: string) => {
    setError("");
    setSuccess("");

    try {
      await apiFetch(`/api/quotes/${quoteId}/accept`, {
        method: "POST"
      });

      setSuccess("Quote accepted.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept quote");
    }
  };

  const convertToInvoice = async (quoteId: string) => {
    setError("");
    setSuccess("");

    try {
      await apiFetch(`/api/quotes/${quoteId}/convert-to-invoice`, {
        method: "POST"
      });

      setSuccess("Quote converted to invoice.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to convert quote");
    }
  };

  const deleteQuote = async (quoteId: string) => {
    const ok = window.confirm("Delete this quote?");
    if (!ok) return;

    setError("");
    setSuccess("");

    try {
      await apiFetch(`/api/quotes/${quoteId}`, {
        method: "DELETE"
      });

      setSuccess("Quote deleted.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete quote");
    }
  };

  return (
    <div className="pageGrid">
      <section className="panel">
        <div className="panelHeader">
          <h2 className="panelTitle">
            {editingId ? "Edit Quote" : "New Quote"}
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
            placeholder="Service type"
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
          />

          <input
            className="textInput"
            placeholder="Total"
            inputMode="decimal"
            value={total}
            onChange={(e) => setTotal(e.target.value)}
          />

          <select
            className="textInput"
            value={status}
            onChange={(e) => setStatus(e.target.value as QuoteStatus)}
          >
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="accepted">Accepted</option>
            <option value="declined">Declined</option>
            <option value="expired">Expired</option>
          </select>

          <div className="buttonRow">
            <button className="primaryButton" type="submit">
              {editingId ? "Save Quote" : "Add Quote"}
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
          <h2 className="panelTitle">Quotes</h2>
        </div>

        {loading && <div className="listCard">Loading quotes...</div>}

        {!loading && (
          <div className="cardsGrid">
            {quotes.map((quote) => (
              <div key={quote.id} className="quoteCard">
                <div className="quoteTopRow">
                  <div className="quoteNumber">Quote #{quote.quoteNumber}</div>
                  <span className={`statusBadge status-${quote.status}`}>
                    {quote.status}
                  </span>
                </div>

                <div className="cardLine">
                  <strong>Client:</strong> {quote.clientName}
                </div>

                <div className="cardLine">
                  <strong>Service:</strong> {quote.serviceType}
                </div>

                <div className="cardLine">
                  <strong>Total:</strong> ${quote.total.toFixed(2)}
                </div>

                <div className="cardLine">
                  <strong>Accepted:</strong>{" "}
                  {quote.acceptedAt ? new Date(quote.acceptedAt).toLocaleString() : "—"}
                </div>

                <div className="cardLine">
                  <strong>Invoice Created:</strong>{" "}
                  {quote.convertedInvoiceId ? "Yes" : "No"}
                </div>

                <div className="buttonRow">
                  <button className="secondaryButton" onClick={() => startEdit(quote)}>
                    Edit
                  </button>

                  {quote.status !== "accepted" && (
                    <button className="secondaryButton" onClick={() => acceptQuote(quote.id)}>
                      Accept Quote
                    </button>
                  )}

                  {quote.status === "accepted" && !quote.convertedInvoiceId && (
                    <button className="primaryButton" onClick={() => convertToInvoice(quote.id)}>
                      Convert To Invoice
                    </button>
                  )}

                  {quote.convertedInvoiceId && (
                    <button className="secondaryButton" disabled>
                      Already Converted
                    </button>
                  )}

                  <button className="secondaryButton" onClick={() => deleteQuote(quote.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}

            {quotes.length === 0 && (
              <div className="listCard">No quotes yet.</div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

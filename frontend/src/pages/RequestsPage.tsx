import React from "react";
import { apiFetch } from "../api";
import type { ServiceRequest, ServiceRequestStatus } from "../types";

export default function RequestsPage() {
  const [requests, setRequests] = React.useState<ServiceRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const loadRequests = React.useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await apiFetch<{ requests: ServiceRequest[] }>("/api/requests");
      setRequests(data.requests);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load requests");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const updateStatus = async (requestId: string, status: ServiceRequestStatus) => {
    try {
      await apiFetch(`/api/requests/${requestId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });

      await loadRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update request");
    }
  };

  const convertToClient = async (requestId: string) => {
    try {
      await apiFetch(`/api/requests/${requestId}/convert-to-client`, {
        method: "POST"
      });

      alert("Client created from request.");
      await loadRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to convert request");
    }
  };

  const deleteRequest = async (requestId: string) => {
    const ok = window.confirm("Delete this service request?");
    if (!ok) return;

    try {
      await apiFetch(`/api/requests/${requestId}`, {
        method: "DELETE"
      });

      await loadRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete request");
    }
  };

  return (
    <section className="panel">
      <div className="panelHeader">
        <h2 className="panelTitle">Customer Service Requests</h2>
      </div>

      {error && <div className="errorBox">{error}</div>}
      {loading && <div className="listCard">Loading service requests...</div>}

      {!loading && (
        <div className="cardsGrid">
          {requests.map((request) => (
            <div key={request.id} className="quoteCard">
              <div className="quoteTopRow">
                <div className="quoteNumber">
                  {request.firstName} {request.lastName}
                </div>
                <span className={`statusBadge status-${request.status}`}>
                  {request.status}
                </span>
              </div>

              <div className="cardLine"><strong>Service:</strong> {request.serviceType}</div>
              <div className="cardLine"><strong>Address:</strong> {request.address}</div>
              <div className="cardLine"><strong>Phone:</strong> {request.phone || "—"}</div>
              <div className="cardLine"><strong>Email:</strong> {request.email || "—"}</div>
              <div className="cardLine">
                <strong>Preferred:</strong>{" "}
                {request.preferredDate
                  ? `${new Date(request.preferredDate).toLocaleDateString()} ${request.preferredTime || ""}`
                  : request.preferredTime || "—"}
              </div>
              <div className="cardLine"><strong>Notes:</strong> {request.notes || "—"}</div>
              <div className="chatMeta">
                Submitted {new Date(request.createdAt).toLocaleString()}
              </div>

              <div className="buttonRow">
                <button className="secondaryButton" onClick={() => updateStatus(request.id, "reviewed")}>
                  Mark Reviewed
                </button>

                <button className="secondaryButton" onClick={() => updateStatus(request.id, "scheduled")}>
                  Mark Scheduled
                </button>

                <button className="secondaryButton" onClick={() => updateStatus(request.id, "declined")}>
                  Decline
                </button>

                <button className="primaryButton" onClick={() => convertToClient(request.id)}>
                  Create Client
                </button>

                <button className="secondaryButton" onClick={() => deleteRequest(request.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}

          {requests.length === 0 && (
            <div className="listCard">No customer service requests yet.</div>
          )}
        </div>
      )}
    </section>
  );
}

import React from "react";
import type { ServiceStatusRecord, ServiceStatusValue } from "../types/serviceStatus";
import {
  loadServiceStatusRecords,
  serviceStatusLabel,
  subscribeServiceStatus,
  updateServiceStatus
} from "../utils/serviceStatusStorage";

type ServiceStatusBoardProps = {
  role: "superadmin" | "admin" | "employee" | "client";
  clientId?: string;
};

const statusOptions: ServiceStatusValue[] = [
  "scheduled",
  "on_the_way",
  "arrived",
  "in_progress",
  "completed",
  "cancelled",
  "rescheduled"
];

export default function ServiceStatusBoard({
  role,
  clientId
}: ServiceStatusBoardProps) {
  const [records, setRecords] = React.useState<ServiceStatusRecord[]>(() =>
    loadServiceStatusRecords()
  );
  const [etaById, setEtaById] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    return subscribeServiceStatus(() => {
      setRecords(loadServiceStatusRecords());
    });
  }, []);

  const isAdmin = role === "superadmin" || role === "admin";

  const visibleRecords = records.filter((record) => {
    if (role === "client" && clientId) return record.clientId === clientId;
    return true;
  });

  const updateEta = (id: string, value: string) => {
    setEtaById((prev) => ({
      ...prev,
      [id]: value
    }));
  };

  const setStatus = (id: string, status: ServiceStatusValue) => {
    updateServiceStatus(id, status, etaById[id]);
    setRecords(loadServiceStatusRecords());
  };

  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <h2 className="panelTitle">
            {role === "client" ? "Service Status" : "Service Status Tracking"}
          </h2>
          <p className="brandSubtitle">
            Clients see safe job-bound updates only: on the way, ETA, arrived,
            in progress, and completed. This does not expose employee home routes or
            persistent live tracking.
          </p>
        </div>
      </div>

      <div className="statsGrid" style={{ marginTop: 16 }}>
        <div className="statCard">
          <div className="statLabel">Tracked Jobs</div>
          <div className="statValue">{visibleRecords.length}</div>
        </div>

        <div className="statCard">
          <div className="statLabel">On The Way</div>
          <div className="statValue">
            {visibleRecords.filter((record) => record.status === "on_the_way").length}
          </div>
        </div>

        <div className="statCard">
          <div className="statLabel">Completed</div>
          <div className="statValue">
            {visibleRecords.filter((record) => record.status === "completed").length}
          </div>
        </div>
      </div>

      <div className="cardsGrid" style={{ marginTop: 16 }}>
        {visibleRecords.map((record) => (
          <article key={record.id} className="quoteCard">
            <div className="quoteTopRow">
              <div>
                <div className="quoteNumber">{record.serviceTitle}</div>
                <div className="cardLine">{record.clientName}</div>
              </div>

              <span className="statusBadge status-approved">
                {serviceStatusLabel(record.status)}
              </span>
            </div>

            <div className="cardLine">
              <strong>Client-safe update:</strong> {record.clientVisibleStatus}
            </div>

            <div className="cardLine">
              <strong>Address:</strong> {record.serviceAddress}
            </div>

            <div className="cardLine">
              <strong>Scheduled:</strong> {record.scheduledDate} at{" "}
              {record.scheduledTime}
            </div>

            <div className="cardLine">
              <strong>Assigned:</strong> {record.assignedEmployeeName || "Unassigned"}
            </div>

            <div className="cardLine">
              <strong>Treatment:</strong> {record.requiredTreatment || "—"}
            </div>

            {isAdmin && (
              <div className="assignBox">
                <div className="assignTitle">Admin Status Controls</div>

                <label className="fieldLabel">
                  ETA Window
                  <input
                    className="textInput"
                    value={etaById[record.id] ?? record.etaWindow}
                    onChange={(event) => updateEta(record.id, event.target.value)}
                    placeholder="Example: 15–25 minutes"
                  />
                </label>

                <div className="buttonRow" style={{ marginTop: 12 }}>
                  {statusOptions.map((status) => (
                    <button
                      key={status}
                      type="button"
                      className={
                        record.status === status ? "primaryButton" : "secondaryButton"
                      }
                      onClick={() => setStatus(record.id, status)}
                    >
                      {serviceStatusLabel(status)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </article>
        ))}

        {visibleRecords.length === 0 && (
          <div className="listCard">
            No service status records yet. Schedule a job to create a status record.
          </div>
        )}
      </div>
    </section>
  );
}

import React from "react";

export type ServiceStatusStep =
  | "requested"
  | "scheduled"
  | "on_the_way"
  | "arrived"
  | "in_progress"
  | "completed";

type ServiceStatusTrackerProps = {
  status?: ServiceStatusStep;
  etaWindow?: string;
  serviceTitle?: string;
  serviceAddress?: string;
  assignedDisplayName?: string;
  clientView?: boolean;
};

const steps: Array<{
  key: ServiceStatusStep;
  label: string;
  clientLabel: string;
  description: string;
}> = [
  {
    key: "requested",
    label: "Requested",
    clientLabel: "Request Sent",
    description: "Service request received and waiting for review."
  },
  {
    key: "scheduled",
    label: "Scheduled",
    clientLabel: "Scheduled",
    description: "Service has been scheduled on the NMD calendar."
  },
  {
    key: "on_the_way",
    label: "On The Way",
    clientLabel: "On The Way",
    description: "NMD is heading to the job. ETA window is shown without raw live GPS."
  },
  {
    key: "arrived",
    label: "Arrived",
    clientLabel: "Arrived",
    description: "NMD has arrived at the service address."
  },
  {
    key: "in_progress",
    label: "In Progress",
    clientLabel: "Service Started",
    description: "Service is active and work is being completed."
  },
  {
    key: "completed",
    label: "Completed",
    clientLabel: "Completed",
    description: "Service is complete and photos/invoice can be reviewed."
  }
];

function getStepIndex(status: ServiceStatusStep) {
  return steps.findIndex((step) => step.key === status);
}

export default function ServiceStatusTracker({
  status = "requested",
  etaWindow = "ETA pending",
  serviceTitle = "NMD Service",
  serviceAddress = "Service address pending",
  assignedDisplayName = "NMD Service Team",
  clientView = false
}: ServiceStatusTrackerProps) {
  const activeIndex = getStepIndex(status);

  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <h2 className="panelTitle">Service Status</h2>
          <p className="brandSubtitle">
            {clientView
              ? "Track safe service updates without exposing private employee location data."
              : "Admin/employee status tracker for client-facing job updates."}
          </p>
        </div>

        <span className="statusBadge status-approved">
          {steps[activeIndex]?.label || "Requested"}
        </span>
      </div>

      <div className="clientInfoPanel" style={{ marginTop: 16 }}>
        <div>
          <h2>{serviceTitle}</h2>
          <p>{serviceAddress}</p>
        </div>

        <div>
          <div className="statLabel">ETA Window</div>
          <div className="clientStatusTitle">{etaWindow}</div>
          <p className="cardLine">{assignedDisplayName}</p>
        </div>
      </div>

      <div className="serviceStatusTimeline">
        {steps.map((step, index) => {
          const complete = index <= activeIndex;
          const active = index === activeIndex;

          return (
            <div
              key={step.key}
              className={
                active
                  ? "serviceStatusStep active"
                  : complete
                    ? "serviceStatusStep complete"
                    : "serviceStatusStep"
              }
            >
              <div className="serviceStatusDot">{index + 1}</div>
              <div>
                <strong>{clientView ? step.clientLabel : step.label}</strong>
                <p>{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="errorBox">
        <strong>Privacy rule:</strong> Only service status and ETA windows should be
        shown to clients. Do not expose raw GPS, employee home routes, or persistent
        employee location tracking.
      </div>
    </section>
  );
}

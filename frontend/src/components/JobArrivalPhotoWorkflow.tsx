import React from "react";
import type { NmdPhotoRole } from "../types/photoRecords";
import PhotoUploadPanel from "./PhotoUploadPanel";
import { getJobPhotoChecklist, subscribePhotoRecords } from "../utils/photoRecordStorage";

type JobArrivalPhotoWorkflowProps = {
  role: NmdPhotoRole;
  jobId: string;
  clientName: string;
  clientId?: string;
  serviceAddress: string;
  uploadedByName?: string;
  onArrived?: () => void;
  onCompleteAllowedChange?: (allowed: boolean) => void;
};

export default function JobArrivalPhotoWorkflow({
  role,
  jobId,
  clientName,
  clientId = "",
  serviceAddress,
  uploadedByName = "Employee",
  onArrived,
  onCompleteAllowedChange
}: JobArrivalPhotoWorkflowProps) {
  const [arrived, setArrived] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);

  React.useEffect(() => {
    return subscribePhotoRecords(() => {
      setRefreshKey((prev) => prev + 1);
    });
  }, []);

  const checklist = React.useMemo(
    () => getJobPhotoChecklist(jobId),
    [jobId, refreshKey]
  );

  const completionAllowed = checklist.beforeComplete && checklist.afterComplete;

  React.useEffect(() => {
    onCompleteAllowedChange?.(completionAllowed);
  }, [completionAllowed, onCompleteAllowedChange]);

  const markArrived = () => {
    setArrived(true);
    onArrived?.();
  };

  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <h2 className="panelTitle">Job Arrival Photo Workflow</h2>
          <p className="brandSubtitle">
            Employees should document before photos, after photos, and pre-existing
            damage notes for every job before completion.
          </p>
        </div>

        <div className="buttonRow">
          <button className="primaryButton" type="button" onClick={markArrived}>
            {arrived ? "Arrived" : "I Arrived At Job"}
          </button>
        </div>
      </div>

      <div className="statsGrid" style={{ marginTop: 16 }}>
        <div className="statCard">
          <div className="statLabel">Before Photos</div>
          <div className="statValue">{checklist.beforeComplete ? "Done" : "Needed"}</div>
        </div>

        <div className="statCard">
          <div className="statLabel">After Photos</div>
          <div className="statValue">{checklist.afterComplete ? "Done" : "Needed"}</div>
        </div>

        <div className="statCard">
          <div className="statLabel">Complete Job</div>
          <div className="statValue" style={{ fontSize: 18 }}>
            {completionAllowed ? "Allowed" : "Photos Needed"}
          </div>
        </div>
      </div>

      {!arrived && (
        <div className="errorBox">
          Tap <strong>I Arrived At Job</strong> when you reach the service address.
          The app will prompt required before/after photo records for treated areas.
        </div>
      )}

      {arrived && (
        <div className="pageGrid" style={{ marginTop: 16 }}>
          <PhotoUploadPanel
            role={role}
            uploadedByName={uploadedByName}
            clientName={clientName}
            clientId={clientId}
            jobId={jobId}
            serviceAddress={serviceAddress}
            defaultCategory="before"
            title="Upload Before Photos"
            subtitle="Take clear photos before cleaning or treatment starts. Include all treated areas and pre-existing conditions."
          />

          <PhotoUploadPanel
            role={role}
            uploadedByName={uploadedByName}
            clientName={clientName}
            clientId={clientId}
            jobId={jobId}
            serviceAddress={serviceAddress}
            defaultCategory="pre_existing_damage"
            title="Document Pre-existing Damage"
            subtitle="Add photos and notes for cracks, oxidation, loose paint, damaged screens, dead plants, stains, or anything already present."
          />

          <PhotoUploadPanel
            role={role}
            uploadedByName={uploadedByName}
            clientName={clientName}
            clientId={clientId}
            jobId={jobId}
            serviceAddress={serviceAddress}
            defaultCategory="after"
            title="Upload After Photos"
            subtitle="Take completion photos after service. These can be shown to clients and stored in the client profile."
          />
        </div>
      )}
    </section>
  );
}

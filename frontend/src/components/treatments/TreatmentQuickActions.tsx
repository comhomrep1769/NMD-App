import React from "react";
import type { TreatmentTabKey } from "../../types/treatmentUi";

export default function TreatmentQuickActions({
  adminAccess,
  seeding,
  visibleCount,
  onAddTreatment,
  onSeedDefaults,
  onExportVisible,
  onTabChange
}: {
  adminAccess: boolean;
  seeding: boolean;
  visibleCount: number;
  onAddTreatment: () => void;
  onSeedDefaults: () => void;
  onExportVisible: () => void;
  onTabChange: (tab: TreatmentTabKey) => void;
}) {
  return (
    <div className="buttonRow">
      {adminAccess && (
        <>
          <button className="primaryButton" type="button" onClick={onAddTreatment}>
            Add Treatment
          </button>

          <button
            className="secondaryButton"
            type="button"
            onClick={() => onTabChange("upload")}
          >
            Upload Treatments
          </button>

          <button
            className="secondaryButton"
            type="button"
            onClick={() => onTabChange("uploadCases")}
          >
            Upload Cases
          </button>

          <button
            className="secondaryButton"
            type="button"
            onClick={onSeedDefaults}
            disabled={seeding}
          >
            {seeding ? "Seeding..." : "Seed Defaults"}
          </button>
        </>
      )}

      <button
        className="secondaryButton"
        type="button"
        onClick={() => onTabChange("guru")}
      >
        Guru Search
      </button>

      <button
        className="secondaryButton"
        type="button"
        onClick={() => onTabChange("field")}
      >
        Field Mode
      </button>

      <button
        className="secondaryButton"
        type="button"
        onClick={() => onTabChange("planner")}
      >
        Plan Builder
      </button>

      <button
        className="secondaryButton"
        type="button"
        onClick={onExportVisible}
        disabled={visibleCount === 0}
      >
        Export Visible CSV
      </button>
    </div>
  );
}

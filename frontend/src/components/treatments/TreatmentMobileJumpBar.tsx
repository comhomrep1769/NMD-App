import React from "react";
import type { TreatmentTabKey } from "../../types/treatmentUi";

const employeeButtons: Array<{
  key: TreatmentTabKey;
  label: string;
}> = [
  {
    key: "guru",
    label: "Guru"
  },
  {
    key: "field",
    label: "Field"
  },
  {
    key: "search",
    label: "Search"
  },
  {
    key: "details",
    label: "Details"
  },
  {
    key: "calculator",
    label: "Calc"
  },
  {
    key: "cases",
    label: "Treatments"
  }
];

const adminButtons: Array<{
  key: TreatmentTabKey;
  label: string;
}> = [
  {
    key: "guru",
    label: "Guru"
  },
  {
    key: "uploadHub",
    label: "Upload"
  },
  {
    key: "chemicals",
    label: "Chemicals"
  },
  {
    key: "field",
    label: "Field"
  },
  {
    key: "search",
    label: "Search"
  },
  {
    key: "details",
    label: "Details"
  },
  {
    key: "calculator",
    label: "Calc"
  },
  {
    key: "cases",
    label: "Treatments"
  },
  {
    key: "planner",
    label: "Plan"
  },
  {
    key: "saved",
    label: "Saved"
  }
];

export default function TreatmentMobileJumpBar({
  activeTab,
  adminAccess = false,
  onChange
}: {
  activeTab: TreatmentTabKey;
  adminAccess?: boolean;
  onChange: (tab: TreatmentTabKey) => void;
}) {
  const buttons = adminAccess ? adminButtons : employeeButtons;

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        overflowX: "auto",
        padding: "10px 2px 4px",
        WebkitOverflowScrolling: "touch"
      }}
    >
      {buttons.map((button) => (
        <button
          key={button.key}
          className={activeTab === button.key ? "primaryButton" : "secondaryButton"}
          type="button"
          onClick={() => onChange(button.key)}
          style={{
            flex: "0 0 auto",
            minWidth: 92,
            justifyContent: "center"
          }}
        >
          {button.label}
        </button>
      ))}
    </div>
  );
}

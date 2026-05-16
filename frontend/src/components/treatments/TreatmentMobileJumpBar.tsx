import React from "react";
import type { TreatmentTabKey } from "../../types/treatmentUi";

const mobileButtons: Array<{
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
    label: "Treatments"
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
    label: "Cases"
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
  onChange
}: {
  activeTab: TreatmentTabKey;
  onChange: (tab: TreatmentTabKey) => void;
}) {
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
      {mobileButtons.map((button) => (
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

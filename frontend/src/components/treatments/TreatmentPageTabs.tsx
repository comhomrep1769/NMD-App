import React from "react";
import type { TreatmentTab, TreatmentTabKey } from "../../types/treatmentUi";

const tabs: TreatmentTab[] = [
  {
    key: "guru",
    label: "Guru Search",
    description: "Search treatments, cases, and saved plans."
  },
  {
    key: "uploadHub",
    label: "Upload Center",
    description: "Choose treatment or case upload."
  },
  {
    key: "upload",
    label: "Upload Treatments",
    description: "Import treatments from CSV or JSON."
  },
  {
    key: "uploadCases",
    label: "Upload Cases",
    description: "Import treatment cases from CSV or JSON."
  },
  {
    key: "field",
    label: "Field Mode",
    description: "Employee checklist and quick job guidance."
  },
  {
    key: "search",
    label: "Treatments",
    description: "Browse and filter treatment records."
  },
  {
    key: "details",
    label: "Details",
    description: "View selected treatment information."
  },
  {
    key: "calculator",
    label: "Calculator",
    description: "SH percent and oz-per-gallon mix tools."
  },
  {
    key: "cases",
    label: "Cases",
    description: "Case-based treatment workflows."
  },
  {
    key: "planner",
    label: "Plan Builder",
    description: "Build job treatment plans."
  },
  {
    key: "saved",
    label: "Saved Plans",
    description: "View stored treatment plans."
  }
];

export default function TreatmentPageTabs({
  activeTab,
  onChange
}: {
  activeTab: TreatmentTabKey;
  onChange: (tab: TreatmentTabKey) => void;
}) {
  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <h2 className="panelTitle">Treatment Workspace</h2>
          <p className="brandSubtitle">
            Use tabs to move between Guru search, uploads, field tools, saved plans,
            cases, and treatment records.
          </p>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))",
          gap: 10,
          marginTop: 16
        }}
      >
        {tabs.map((tab) => {
          const active = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
              className={active ? "primaryButton" : "secondaryButton"}
              onClick={() => onChange(tab.key)}
              style={{
                display: "grid",
                gap: 4,
                justifyItems: "start",
                textAlign: "left",
                whiteSpace: "normal",
                lineHeight: 1.25,
                minHeight: 70
              }}
            >
              <span style={{ fontWeight: 900 }}>{tab.label}</span>
              <span
                style={{
                  fontSize: 12,
                  opacity: active ? 0.92 : 0.75,
                  fontWeight: 700
                }}
              >
                {tab.description}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

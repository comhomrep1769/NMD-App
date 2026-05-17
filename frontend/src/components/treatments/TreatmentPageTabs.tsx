import React from "react";
import type { TreatmentTab, TreatmentTabKey } from "../../types/treatmentUi";

const employeeTabs: TreatmentTab[] = [
  {
    key: "guru",
    label: "Guru Search",
    description: "Search approved treatment knowledge."
  },
  {
    key: "field",
    label: "Field Mode",
    description: "Employee checklist and quick job guidance."
  },
  {
    key: "search",
    label: "Search Treatments",
    description: "Browse and filter treatment records."
  },
  {
    key: "details",
    label: "Details",
    description: "View the selected treatment."
  },
  {
    key: "calculator",
    label: "SH Calculator",
    description: "SH percent and oz-per-gallon mix tools."
  },
  {
    key: "cases",
    label: "Treatment Cases",
    description: "Case-based treatment workflows."
  }
];

const adminOnlyTabs: TreatmentTab[] = [
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

function getVisibleTabs(adminAccess: boolean): TreatmentTab[] {
  if (!adminAccess) {
    return employeeTabs;
  }

  return [
    {
      key: "guru",
      label: "Guru Search",
      description: "Search treatments, cases, and saved plans."
    },
    ...adminOnlyTabs,
    {
      key: "field",
      label: "Field Mode",
      description: "Employee checklist and quick job guidance."
    },
    {
      key: "search",
      label: "Search Treatments",
      description: "Browse and filter treatment records."
    },
    {
      key: "details",
      label: "Details",
      description: "View selected treatment information."
    },
    {
      key: "calculator",
      label: "SH Calculator",
      description: "SH percent and oz-per-gallon mix tools."
    },
    {
      key: "cases",
      label: "Treatment Cases",
      description: "Case-based treatment workflows."
    }
  ];
}

export default function TreatmentPageTabs({
  activeTab,
  adminAccess,
  onChange
}: {
  activeTab: TreatmentTabKey;
  adminAccess: boolean;
  onChange: (tab: TreatmentTabKey) => void;
}) {
  const tabs = getVisibleTabs(Boolean(adminAccess));

  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <h2 className="panelTitle">Treatment Workspace</h2>
          <p className="brandSubtitle">
            {adminAccess
              ? "Admin tools for managing treatments, cases, uploads, saved plans, and field guidance."
              : "Employee tools for approved treatment search, cases, SH calculations, and field guidance."}
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

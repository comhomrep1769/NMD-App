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
    label: "Treatment Details",
    description: "View the selected treatment."
  },
  {
    key: "calculator",
    label: "SH Calculator",
    description: "SH percent and oz-per-gallon mix tools."
  },
  {
    key: "cases",
    label: "Treatments",
    description: "Detailed treatment workflows and field guidance."
  }
];

const adminOnlyTabs: TreatmentTab[] = [
  {
    key: "uploadHub",
    label: "Upload Center",
    description: "Upload treatment records or detailed treatments."
  },
  {
    key: "upload",
    label: "Upload Records",
    description: "Import treatment records from CSV or JSON."
  },
  {
    key: "uploadCases",
    label: "Upload Treatments",
    description: "Import detailed treatment workflows from CSV or JSON."
  },
  {
    key: "chemicals",
    label: "Chemical List",
    description: "Manage chemical names, links, use cases, and warnings."
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
      description: "Search treatments and saved plans."
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
      label: "Treatment Details",
      description: "View selected treatment information."
    },
    {
      key: "calculator",
      label: "SH Calculator",
      description: "SH percent and oz-per-gallon mix tools."
    },
    {
      key: "cases",
      label: "Treatments",
      description: "Detailed treatment workflows and field guidance."
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
              ? "Admin tools for managing treatments, chemicals, uploads, saved plans, and field guidance."
              : "Employee tools for approved treatment search, SH calculations, workflows, and field guidance."}
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

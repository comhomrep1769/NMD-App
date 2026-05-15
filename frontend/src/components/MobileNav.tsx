import React from "react";
import type { PageKey, Role } from "../types";

type NavChild = {
  key: PageKey;
  label: string;
};

type NavGroup = {
  label: string;
  children: NavChild[];
};

const adminGroups: NavGroup[] = [
  {
    label: "Dashboard",
    children: [{ key: "dashboard", label: "Main Dashboard" }]
  },
  {
    label: "Guru",
    children: [{ key: "guru-estimates", label: "Estimate Review" }]
  },
  {
    label: "Jobs & Schedule",
    children: [
      { key: "schedule", label: "Schedule" },
      { key: "recurring", label: "Recurring Services" }
    ]
  },
  {
    label: "Clients & Requests",
    children: [
      { key: "clients", label: "Clients" },
      { key: "requests", label: "Service Requests" }
    ]
  },
  {
    label: "Quotes & Invoices",
    children: [
      { key: "quotes", label: "Quotes" },
      { key: "invoices", label: "Invoices" },
      { key: "pricing", label: "Pricing Reference" }
    ]
  },
  {
    label: "Bookkeeping",
    children: [
      { key: "expenses", label: "Expenses" },
      { key: "mileage", label: "Mileage" },
      { key: "payroll", label: "Payroll Prep" }
    ]
  },
  {
    label: "Team",
    children: [
      { key: "employees", label: "Employees" },
      { key: "schedule", label: "Employee Schedule" },
      { key: "timeclock", label: "Time Clock" },
      { key: "availability", label: "Availability" },
      { key: "equipment", label: "Equipment" }
    ]
  },
  {
    label: "Knowledge Base",
    children: [
      { key: "treatments", label: "Treatments" },
      { key: "tips", label: "Tips & Notes" }
    ]
  },
  {
    label: "Payments / POS",
    children: [
      { key: "pos", label: "POS Payments" },
      { key: "invoices", label: "Invoices & Payment Links" },
      { key: "recurring", label: "Recurring Billing" }
    ]
  },
  {
    label: "Chat",
    children: [{ key: "chat", label: "Chat" }]
  },
  {
    label: "Settings",
    children: [{ key: "email", label: "Email Test" }]
  }
];

const employeeGroups: NavGroup[] = [
  {
    label: "Dashboard",
    children: [{ key: "dashboard", label: "My Dashboard" }]
  },
  {
    label: "Jobs & Schedule",
    children: [
      { key: "schedule", label: "My Schedule" },
      { key: "timeclock", label: "Time Clock" },
      { key: "availability", label: "Availability" }
    ]
  },
  {
    label: "Payments",
    children: [{ key: "pos", label: "Collect Payment" }]
  },
  {
    label: "My Work",
    children: [{ key: "my-ledger", label: "My Ledger" }]
  },
  {
    label: "Knowledge Base",
    children: [
      { key: "treatments", label: "Treatments" },
      { key: "tips", label: "Tips & Notes" }
    ]
  },
  {
    label: "Chat",
    children: [{ key: "chat", label: "Chat" }]
  }
];

const clientGroups: NavGroup[] = [
  {
    label: "Client Portal",
    children: [{ key: "dashboard", label: "Portal Home" }]
  },
  {
    label: "Estimates",
    children: [{ key: "client-estimates", label: "My Estimates" }]
  },
  {
    label: "Chat",
    children: [{ key: "chat", label: "Chat" }]
  }
];

function groupContainsPage(group: NavGroup, page: PageKey) {
  return group.children.some((child) => child.key === page);
}

export default function MobileNav({
  currentPage,
  onNavigate,
  role
}: {
  currentPage: PageKey;
  onNavigate: (page: PageKey) => void;
  role: Role;
}) {
  const [open, setOpen] = React.useState(false);

  const groups =
    role === "admin"
      ? adminGroups
      : role === "employee"
        ? employeeGroups
        : clientGroups;

  const navigate = (page: PageKey) => {
    onNavigate(page);
    setOpen(false);
  };

  const activeGroup =
    groups.find((group) => groupContainsPage(group, currentPage))?.label ||
    "Menu";

  return (
    <>
      <button
        type="button"
        className="primaryButton"
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          right: 14,
          bottom: 14,
          zIndex: 80,
          display: "none"
        }}
        id="nmdMobileMenuButton"
      >
        ☰ {activeGroup}
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(0,0,0,0.65)",
            display: "flex",
            justifyContent: "flex-end"
          }}
          onClick={() => setOpen(false)}
        >
          <aside
            style={{
              width: "min(88vw, 360px)",
              height: "100%",
              background: "var(--panel)",
              borderLeft: "1px solid var(--border)",
              padding: 18,
              overflowY: "auto",
              boxShadow: "0 20px 60px rgba(0,0,0,0.45)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="panelHeader">
              <div>
                <h2 className="panelTitle">NMD Menu</h2>
                <p className="brandSubtitle">
                  {role === "admin"
                    ? "Admin Portal"
                    : role === "employee"
                      ? "Employee Portal"
                      : "Client Portal"}
                </p>
              </div>

              <button
                type="button"
                className="secondaryButton"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>

            <div style={{ display: "grid", gap: 14, marginTop: 16 }}>
              {groups.map((group) => {
                const isActiveGroup = groupContainsPage(group, currentPage);

                return (
                  <section
                    key={group.label}
                    className="quoteCard"
                    style={{
                      borderColor: isActiveGroup ? "var(--accent)" : "var(--border)"
                    }}
                  >
                    <div className="quoteNumber">{group.label}</div>

                    <div
                      style={{
                        display: "grid",
                        gap: 8,
                        marginTop: 10
                      }}
                    >
                      {group.children.map((child) => (
                        <button
                          key={`${group.label}-${child.key}-${child.label}`}
                          type="button"
                          className={
                            currentPage === child.key
                              ? "primaryButton"
                              : "secondaryButton"
                          }
                          onClick={() => navigate(child.key)}
                        >
                          {child.label}
                        </button>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </aside>
        </div>
      )}

      <style>
        {`
          @media (max-width: 820px) {
            #nmdMobileMenuButton {
              display: inline-flex !important;
              align-items: center;
              gap: 8px;
            }

            .mobileNav {
              display: none !important;
            }
          }

          @media (min-width: 821px) {
            #nmdMobileMenuButton {
              display: none !important;
            }
          }
        `}
      </style>
    </>
  );
}

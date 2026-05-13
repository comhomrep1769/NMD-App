import React from "react";
import type { PageKey, Role } from "../types";

type NavChild = {
  key: PageKey;
  label: string;
};

type NavGroup = {
  label: string;
  defaultKey: PageKey;
  children: NavChild[];
};

const adminGroups: NavGroup[] = [
  {
    label: "Dashboard",
    defaultKey: "dashboard",
    children: [
      { key: "dashboard", label: "Main Dashboard" }
    ]
  },
  {
    label: "Jobs & Schedule",
    defaultKey: "schedule",
    children: [
      { key: "schedule", label: "Schedule" },
      { key: "recurring", label: "Recurring Services" }
    ]
  },
  {
    label: "Clients & Requests",
    defaultKey: "clients",
    children: [
      { key: "clients", label: "Clients" },
      { key: "requests", label: "Service Requests" }
    ]
  },
  {
    label: "Quotes & Invoices",
    defaultKey: "quotes",
    children: [
      { key: "quotes", label: "Quotes" },
      { key: "invoices", label: "Invoices" },
      { key: "pricing", label: "Pricing Reference" }
    ]
  },
  {
    label: "Bookkeeping",
    defaultKey: "expenses",
    children: [
      { key: "expenses", label: "Expenses" },
      { key: "mileage", label: "Mileage" },
      { key: "payroll", label: "Payroll Prep" }
    ]
  },
  {
    label: "Team",
    defaultKey: "employees",
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
    defaultKey: "treatments",
    children: [
      { key: "treatments", label: "Treatments" },
      { key: "tips", label: "Tips & Notes" }
    ]
  },
  {
    label: "Payments / POS",
    defaultKey: "invoices",
    children: [
      { key: "invoices", label: "Invoices & Payments" },
      { key: "recurring", label: "Recurring Billing" }
    ]
  },
  {
    label: "Chat",
    defaultKey: "chat",
    children: [
      { key: "chat", label: "Chat" }
    ]
  },
  {
    label: "Settings",
    defaultKey: "email",
    children: [
      { key: "email", label: "Email Test" }
    ]
  }
];

const employeeGroups: NavGroup[] = [
  {
    label: "Dashboard",
    defaultKey: "dashboard",
    children: [
      { key: "dashboard", label: "My Dashboard" }
    ]
  },
  {
    label: "Jobs & Schedule",
    defaultKey: "schedule",
    children: [
      { key: "schedule", label: "My Schedule" },
      { key: "timeclock", label: "Time Clock" },
      { key: "availability", label: "Availability" }
    ]
  },
  {
    label: "My Work",
    defaultKey: "my-ledger",
    children: [
      { key: "my-ledger", label: "My Ledger" }
    ]
  },
  {
    label: "Knowledge Base",
    defaultKey: "treatments",
    children: [
      { key: "treatments", label: "Treatments" },
      { key: "tips", label: "Tips & Notes" }
    ]
  },
  {
    label: "Chat",
    defaultKey: "chat",
    children: [
      { key: "chat", label: "Chat" }
    ]
  }
];

const clientGroups: NavGroup[] = [
  {
    label: "Client Portal",
    defaultKey: "dashboard",
    children: [
      { key: "dashboard", label: "Portal Home" }
    ]
  },
  {
    label: "Chat",
    defaultKey: "chat",
    children: [
      { key: "chat", label: "Chat" }
    ]
  }
];

function groupContainsPage(group: NavGroup, page: PageKey) {
  return group.children.some((child) => child.key === page);
}

export default function Sidebar({
  currentPage,
  onNavigate,
  role
}: {
  currentPage: PageKey;
  onNavigate: (page: PageKey) => void;
  role: Role;
}) {
  const groups =
    role === "admin"
      ? adminGroups
      : role === "employee"
        ? employeeGroups
        : clientGroups;

  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};

    for (const group of groups) {
      initial[group.label] = groupContainsPage(group, currentPage);
    }

    return initial;
  });

  React.useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev };

      for (const group of groups) {
        if (groupContainsPage(group, currentPage)) {
          next[group.label] = true;
        }
      }

      return next;
    });
  }, [currentPage, groups]);

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  return (
    <aside className="sidebar">
      <div className="sidebarLogo">NMD</div>

      <nav className="sidebarNav">
        {groups.map((group) => {
          const isActiveGroup = groupContainsPage(group, currentPage);
          const isOpen = openGroups[group.label] || isActiveGroup;

          if (group.children.length === 1) {
            const only = group.children[0];

            return (
              <button
                key={group.label}
                className={`sidebarLink ${currentPage === only.key ? "sidebarLinkActive" : ""}`}
                onClick={() => onNavigate(only.key)}
                type="button"
              >
                {group.label}
              </button>
            );
          }

          return (
            <div key={group.label} style={{ width: "100%" }}>
              <button
                className={`sidebarLink ${isActiveGroup ? "sidebarLinkActive" : ""}`}
                onClick={() => toggleGroup(group.label)}
                type="button"
              >
                <span>{group.label}</span>
                <span style={{ marginLeft: "auto" }}>
                  {isOpen ? "−" : "+"}
                </span>
              </button>

              {isOpen && (
                <div
                  style={{
                    display: "grid",
                    gap: 6,
                    paddingLeft: 10,
                    paddingTop: 6,
                    paddingBottom: 8
                  }}
                >
                  {group.children.map((child) => (
                    <button
                      key={`${group.label}-${child.key}-${child.label}`}
                      className={`sidebarLink ${currentPage === child.key ? "sidebarLinkActive" : ""}`}
                      onClick={() => onNavigate(child.key)}
                      type="button"
                      style={{
                        fontSize: 13,
                        opacity: currentPage === child.key ? 1 : 0.82
                      }}
                    >
                      {child.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

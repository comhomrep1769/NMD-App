import React from "react";
import type { AuthUserRole, PageKey } from "../types";

type NavItem = {
  key: PageKey;
  label: string;
  description?: string;
  badge?: string;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

function isAdminRole(role: AuthUserRole) {
  return role === "admin" || role === "superadmin";
}

function getAdminGroups(role: AuthUserRole): NavGroup[] {
  return [
    {
      title: role === "superadmin" ? "Super Admin" : "Main",
      items: [
        { key: "dashboard", label: "Dashboard", description: "Admin overview" },
        {
          key: "guru-estimates",
          label: "Guru Review",
          description: "Review Guru estimates",
          badge: role === "superadmin" ? "Owner AI" : "AI"
        },
        { key: "schedule", label: "Schedule", description: "Live team schedule" },
        { key: "chat", label: "Chat", description: "Team and client messages" }
      ]
    },
    {
      title: "Sales",
      items: [
        { key: "clients", label: "Clients", description: "Client records" },
        { key: "requests", label: "Requests", description: "Service requests" },
        { key: "quotes", label: "Quotes", description: "Create and send quotes" },
        { key: "invoices", label: "Invoices", description: "Invoice workflow" },
        { key: "pos", label: "POS", description: "Payments and collection" }
      ]
    },
    {
      title: "Operations",
      items: [
        { key: "employees", label: "Employees", description: "Team management" },
        { key: "timeclock", label: "Time Clock", description: "Clock and break tracking" },
        { key: "payroll", label: "Payroll", description: "Wages and balances" },
        { key: "availability", label: "Availability", description: "Employee availability" },
        { key: "equipment", label: "Equipment", description: "Tools and assets" }
      ]
    },
    {
      title: "Knowledge",
      items: [
        { key: "pricing", label: "Pricing", description: "NMD Job Pricing" },
        { key: "treatments", label: "Treatments", description: "Treatment options and cases" },
        { key: "tips", label: "Tips", description: "Notes and best practices" }
      ]
    },
    {
      title: "Bookkeeping",
      items: [
        { key: "expenses", label: "Expenses", description: "Expense tracking" },
        { key: "mileage", label: "Mileage", description: "Mileage reimbursement" },
        { key: "recurring", label: "Recurring", description: "Recurring services" },
        { key: "email", label: "Email Test", description: "Transactional email test" }
      ]
    }
  ];
}

function getEmployeeGroups(): NavGroup[] {
  return [
    {
      title: "Employee",
      items: [
        { key: "dashboard", label: "Dashboard", description: "Employee overview" },
        { key: "schedule", label: "My Schedule", description: "Assigned jobs" },
        { key: "timeclock", label: "Time Clock", description: "Clock in/out and breaks" },
        { key: "chat", label: "Chat", description: "Team messages" }
      ]
    },
    {
      title: "Field Tools",
      items: [
        { key: "treatments", label: "Treatments", description: "Treatment guidance", badge: "Guru" },
        { key: "tips", label: "Tips", description: "Field notes and best practices" },
        { key: "pos", label: "Collect Payment", description: "Payment collection" },
        { key: "availability", label: "Availability", description: "Availability settings" },
        { key: "my-ledger", label: "My Ledger", description: "Personal pay ledger" }
      ]
    }
  ];
}

function getClientGroups(): NavGroup[] {
  return [
    {
      title: "Client",
      items: [
        { key: "dashboard", label: "Dashboard", description: "Client overview" },
        {
          key: "client-estimates",
          label: "My Estimates",
          description: "Guru estimate requests",
          badge: "Guru"
        },
        { key: "client-quotes", label: "My Quotes", description: "NMD quote records" },
        { key: "chat", label: "Chat", description: "Message NMD" }
      ]
    }
  ];
}

function getGroups(role: AuthUserRole): NavGroup[] {
  if (isAdminRole(role)) return getAdminGroups(role);
  if (role === "employee") return getEmployeeGroups();
  return getClientGroups();
}

function getPortalLabel(role: AuthUserRole) {
  if (role === "superadmin") return "Super Admin Portal";
  if (role === "admin") return "Admin Portal";
  if (role === "employee") return "Employee Portal";
  return "Client Portal";
}

export default function Sidebar({
  currentPage,
  onNavigate,
  role
}: {
  currentPage: PageKey;
  onNavigate: (page: PageKey) => void;
  role: AuthUserRole;
}) {
  const groups = getGroups(role);

  return (
    <aside className="sidebar">
      <div className="sidebarBrand">
        <div className="sidebarLogo">NMD</div>

        <div>
          <div className="sidebarTitle">No More Dirt</div>
          <div className="sidebarSubtitle">{getPortalLabel(role)}</div>
        </div>
      </div>

      <nav className="sidebarNav" aria-label="Main navigation">
        {groups.map((group) => (
          <div key={group.title} className="sidebarGroup">
            <div className="sidebarGroupTitle">{group.title}</div>

            <div className="sidebarGroupItems">
              {group.items.map((item) => {
                const active = currentPage === item.key;

                return (
                  <button
                    key={item.key}
                    type="button"
                    className={`sidebarLink ${active ? "sidebarLinkActive" : ""}`}
                    onClick={() => onNavigate(item.key)}
                    title={item.description || item.label}
                  >
                    <span className="sidebarLinkText">
                      <span className="sidebarLinkLabel">{item.label}</span>

                      {item.description && (
                        <span className="sidebarLinkDescription">{item.description}</span>
                      )}
                    </span>

                    {item.badge && <span className="sidebarBadge">{item.badge}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="sidebarFooter">
        <div className="sidebarFooterTitle">
          {role === "superadmin" ? "Owner Guru Assistant" : "Guru Assistant"}
        </div>
        <div className="sidebarFooterText">
          Use the floating Guru icon for estimates, field tools, pricing help, and workflow shortcuts.
        </div>
      </div>
    </aside>
  );
}

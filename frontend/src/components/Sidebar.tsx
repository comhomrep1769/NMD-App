import React from "react";
import type { AuthUserRole } from "../types";

type SidebarProps = {
  role?: AuthUserRole | string;
  activePage?: string;
  currentPage?: string;
  onNavigate?: (page: string) => void;
  setCurrentPage?: (page: string) => void;
  user?: {
    role?: AuthUserRole | string;
    displayName?: string;
    email?: string;
  } | null;
};

type SidebarItem = {
  key: string;
  label: string;
  href: string;
  roles: string[];
};

const items: SidebarItem[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    roles: ["superadmin", "admin", "employee"]
  },
  {
    key: "clientDashboard",
    label: "Client Home",
    href: "/client",
    roles: ["client"]
  },
  {
    key: "clientRequests",
    label: "My Service Requests",
    href: "/client/requests",
    roles: ["client"]
  },
  {
    key: "clientQuotes",
    label: "My Quotes",
    href: "/client/quotes",
    roles: ["client"]
  },
  {
    key: "clientInvoices",
    label: "My Invoices",
    href: "/client/invoices",
    roles: ["client"]
  },
  {
    key: "clientAppointments",
    label: "My Appointments",
    href: "/client/appointments",
    roles: ["client"]
  },
  {
    key: "clientRecurring",
    label: "My Recurring Services",
    href: "/client/recurring",
    roles: ["client"]
  },
  {
    key: "clientPhotos",
    label: "My Photos",
    href: "/client/photos",
    roles: ["client"]
  },
  {
    key: "clientRequestService",
    label: "Request Service",
    href: "/client/request-service",
    roles: ["client"]
  },
  {
    key: "quotes",
    label: "Quotes",
    href: "/quotes",
    roles: ["superadmin", "admin"]
  },
  {
    key: "invoices",
    label: "Invoices",
    href: "/invoices",
    roles: ["superadmin", "admin"]
  },
  {
    key: "requests",
    label: "Requests",
    href: "/requests",
    roles: ["superadmin", "admin", "employee"]
  },
  {
    key: "schedule",
    label: "Schedule",
    href: "/schedule",
    roles: ["superadmin", "admin", "employee"]
  },
  {
    key: "photos",
    label: "Job Photos",
    href: "/photos",
    roles: ["superadmin", "admin", "employee"]
  },
  {
    key: "employees",
    label: "Employees",
    href: "/employees",
    roles: ["superadmin", "admin"]
  },
  {
    key: "clients",
    label: "Clients",
    href: "/clients",
    roles: ["superadmin", "admin"]
  },
  {
    key: "treatments",
    label: "Treatments",
    href: "/treatments",
    roles: ["superadmin", "admin", "employee"]
  },
  {
    key: "pricing",
    label: "Pricing",
    href: "/pricing",
    roles: ["superadmin", "admin"]
  },
  {
    key: "expenses",
    label: "Expenses",
    href: "/expenses",
    roles: ["superadmin", "admin"]
  },
  {
    key: "mileage",
    label: "Mileage",
    href: "/mileage",
    roles: ["superadmin", "admin", "employee"]
  },
  {
    key: "payroll",
    label: "Payroll",
    href: "/payroll",
    roles: ["superadmin", "admin"]
  },
  {
    key: "chat",
    label: "Chat",
    href: "/chat",
    roles: ["superadmin", "admin", "employee", "client"]
  }
];

function normalizeRole(role?: string) {
  const value = String(role || "").toLowerCase();

  if (value === "super_admin" || value === "super-admin") return "superadmin";
  if (value === "administrator") return "admin";

  return value || "client";
}

function getActiveState(active: string, item: SidebarItem) {
  if (active === item.key || active === item.href) return true;

  if (typeof window === "undefined") return false;

  const path = window.location.pathname;

  if (path === item.href) return true;

  if (item.href !== "/" && path.startsWith(`${item.href}/`)) return true;

  return false;
}

export default function Sidebar({
  role,
  user,
  activePage,
  currentPage,
  onNavigate,
  setCurrentPage
}: SidebarProps) {
  const normalizedRole = normalizeRole(String(role || user?.role || "client"));
  const active = currentPage || activePage || "";

  const visibleItems = items.filter((item) => item.roles.includes(normalizedRole));

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>, item: SidebarItem) => {
    if (onNavigate || setCurrentPage) {
      event.preventDefault();
      onNavigate?.(item.key);
      setCurrentPage?.(item.key);
    }
  };

  const isClient = normalizedRole === "client";

  return (
    <aside className={isClient ? "sidebar clientSidebar" : "sidebar"}>
      <div className="sidebarBrand">
        <div className="sidebarLogo">NMD</div>
        <div>
          <strong>No More Dirt</strong>
          <span>{isClient ? "Client Portal" : "Operations Portal"}</span>
        </div>
      </div>

      <nav className="sidebarNav" aria-label="Main navigation">
        {visibleItems.map((item) => {
          const selected = getActiveState(active, item);

          return (
            <a
              key={item.key}
              href={item.href}
              className={selected ? "sidebarLink active" : "sidebarLink"}
              onClick={(event) => handleClick(event, item)}
            >
              <span>{item.label}</span>
              {item.key === "chat" && <span className="sidebarDot" aria-label="Unread" />}
            </a>
          );
        })}
      </nav>

      <div className="sidebarFooter">
        <span>{user?.displayName || user?.email || "NMD User"}</span>
        <small>{isClient ? "Customer access" : `${normalizedRole} access`}</small>
      </div>
    </aside>
  );
}

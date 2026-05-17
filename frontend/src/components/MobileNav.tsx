import React from "react";
import type { AuthUserRole } from "../types";

type MobileNavProps = {
  role?: AuthUserRole | string;
  activePage?: string;
  currentPage?: string;
  onNavigate?: (page: string) => void;
  setCurrentPage?: (page: string) => void;
};

type NavItem = {
  key: string;
  label: string;
  href: string;
  roles: string[];
};

const navItems: NavItem[] = [
  {
    key: "dashboard",
    label: "Home",
    href: "/dashboard",
    roles: ["superadmin", "admin", "employee"]
  },
  {
    key: "clientDashboard",
    label: "Client",
    href: "/client",
    roles: ["client"]
  },
  {
    key: "clientRequests",
    label: "Requests",
    href: "/client/requests",
    roles: ["client"]
  },
  {
    key: "clientQuotes",
    label: "Quotes",
    href: "/client/quotes",
    roles: ["client"]
  },
  {
    key: "clientInvoices",
    label: "Invoices",
    href: "/client/invoices",
    roles: ["client"]
  },
  {
    key: "clientAppointments",
    label: "Appts",
    href: "/client/appointments",
    roles: ["client"]
  },
  {
    key: "clientPhotos",
    label: "Photos",
    href: "/client/photos",
    roles: ["client"]
  },
  {
    key: "schedule",
    label: "Schedule",
    href: "/schedule",
    roles: ["superadmin", "admin", "employee"]
  },
  {
    key: "photos",
    label: "Photos",
    href: "/photos",
    roles: ["superadmin", "admin", "employee"]
  },
  {
    key: "treatments",
    label: "Treatments",
    href: "/treatments",
    roles: ["superadmin", "admin", "employee"]
  },
  {
    key: "requests",
    label: "Requests",
    href: "/requests",
    roles: ["superadmin", "admin", "employee"]
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

export default function MobileNav({
  role = "admin",
  activePage = "",
  currentPage = "",
  onNavigate,
  setCurrentPage
}: MobileNavProps) {
  const safeRole = normalizeRole(String(role));
  const active = currentPage || activePage;

  const visibleItems = navItems.filter((item) => item.roles.includes(safeRole));

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>, item: NavItem) => {
    if (onNavigate || setCurrentPage) {
      event.preventDefault();
      onNavigate?.(item.key);
      setCurrentPage?.(item.key);
    }
  };

  return (
    <nav className="mobileNav" aria-label="Mobile navigation">
      <div className="mobileNavScroller">
        {visibleItems.map((item) => {
          const selected =
            active === item.key ||
            active === item.href ||
            (typeof window !== "undefined" && window.location.pathname === item.href);

          return (
            <a
              key={item.key}
              href={item.href}
              className={selected ? "mobileNavLink active" : "mobileNavLink"}
              onClick={(event) => handleClick(event, item)}
            >
              {item.label}
              {item.key === "chat" && <span className="mobileNavDot" />}
            </a>
          );
        })}
      </div>
    </nav>
  );
}

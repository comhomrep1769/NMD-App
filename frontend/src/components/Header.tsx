import React from "react";
import type { AuthUserRole } from "../types";

type HeaderProps = {
  title?: string;
  subtitle?: string;
  role?: AuthUserRole | string;
  user?: {
    displayName?: string;
    email?: string;
    role?: AuthUserRole | string;
  } | null;
  onLogout?: () => void;
};

function formatRole(role?: string) {
  const value = String(role || "").toLowerCase();

  if (value === "superadmin" || value === "super_admin" || value === "super-admin") {
    return "Super Admin";
  }

  if (value === "admin") return "Admin";
  if (value === "employee") return "Employee";
  if (value === "client") return "Client";

  return "NMD";
}

export default function Header({
  title = "NMD Pressure Washing",
  subtitle = "No More Dirt operations center",
  role = "admin",
  user,
  onLogout
}: HeaderProps) {
  const displayName = user?.displayName || user?.email || "NMD User";
  const roleLabel = formatRole(String(role || user?.role || "admin"));

  return (
    <header className="appHeader">
      <div className="appHeaderBrand">
        <div className="appHeaderLogo">NMD</div>
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </div>

      <div className="appHeaderActions">
        <a className="secondaryButton" href="/chat">
          Chat
          <span className="headerNotificationDot" aria-label="Unread messages" />
        </a>

        <a className="secondaryButton" href="/schedule">
          Schedule
        </a>

        <div className="appUserPill">
          <strong>{displayName}</strong>
          <small>{roleLabel}</small>
        </div>

        {onLogout && (
          <button className="dangerButton" type="button" onClick={onLogout}>
            Logout
          </button>
        )}
      </div>
    </header>
  );
}

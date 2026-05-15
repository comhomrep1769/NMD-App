import React from "react";
import type { AuthUser, ThemeMode } from "../types";
import { getRoleLabel } from "../utils/roles";

function roleBadgeClass(user: AuthUser | null) {
  if (!user) return "statusBadge status-archived";
  if (user.role === "superadmin") return "statusBadge status-paid";
  if (user.role === "admin") return "statusBadge status-approved";
  if (user.role === "employee") return "statusBadge status-pending_admin_approval";
  return "statusBadge status-approved";
}

function headerTitle(user: AuthUser | null) {
  if (!user) return "No More Dirt";
  if (user.role === "superadmin") return "Owner Command Center";
  if (user.role === "admin") return "Admin Command Center";
  if (user.role === "employee") return "Employee Portal";
  return "Client Portal";
}

export default function Header({
  theme,
  onToggleTheme,
  user,
  onLogout
}: {
  theme: ThemeMode;
  onToggleTheme: () => void;
  user: AuthUser | null;
  onLogout: () => void;
}) {
  return (
    <header className="topHeader">
      <div>
        <div className="headerKicker">NMD Pressure Washing Services</div>
        <h1 className="headerTitle">{headerTitle(user)}</h1>
      </div>

      <div className="headerActions">
        {user && (
          <div className="userPill">
            <div>
              <div className="userName">{user.displayName || user.email}</div>
              <div className="userEmail">{user.email}</div>
            </div>

            <span className={roleBadgeClass(user)}>{getRoleLabel(user)}</span>
          </div>
        )}

        <button className="secondaryButton" type="button" onClick={onToggleTheme}>
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>

        {user && (
          <button className="secondaryButton" type="button" onClick={onLogout}>
            Logout
          </button>
        )}
      </div>
    </header>
  );
}

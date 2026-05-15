import React from "react";
import type { AuthUser, ThemeMode } from "../types";

function roleLabel(user: AuthUser | null) {
  if (!user) return "Guest";
  if (user.role === "superadmin") return "Super Admin";
  if (user.role === "admin") return "Admin";
  if (user.role === "employee") return "Employee";
  return "Client";
}

function roleBadgeClass(user: AuthUser | null) {
  if (!user) return "statusBadge status-archived";
  if (user.role === "superadmin") return "statusBadge status-paid";
  if (user.role === "admin") return "statusBadge status-approved";
  if (user.role === "employee") return "statusBadge status-pending_admin_approval";
  return "statusBadge status-approved";
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
        <h1 className="headerTitle">
          {user?.role === "superadmin"
            ? "Owner Command Center"
            : user?.role === "admin"
              ? "Admin Command Center"
              : user?.role === "employee"
                ? "Employee Portal"
                : user?.role === "client"
                  ? "Client Portal"
                  : "No More Dirt"}
        </h1>
      </div>

      <div className="headerActions">
        {user && (
          <div className="userPill">
            <div>
              <div className="userName">{user.displayName || user.email}</div>
              <div className="userEmail">{user.email}</div>
            </div>

            <span className={roleBadgeClass(user)}>{roleLabel(user)}</span>
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

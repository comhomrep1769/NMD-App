import type { AuthUser, AuthUserRole } from "../types";

export function isAdminRole(roleOrUser: AuthUserRole | AuthUser | null | undefined) {
  if (!roleOrUser) return false;

  const role = typeof roleOrUser === "string" ? roleOrUser : roleOrUser.role;

  return role === "admin" || role === "superadmin";
}

export function isSuperAdminRole(roleOrUser: AuthUserRole | AuthUser | null | undefined) {
  if (!roleOrUser) return false;

  const role = typeof roleOrUser === "string" ? roleOrUser : roleOrUser.role;

  return role === "superadmin";
}

export function getRoleLabel(roleOrUser: AuthUserRole | AuthUser | null | undefined) {
  if (!roleOrUser) return "Guest";

  const role = typeof roleOrUser === "string" ? roleOrUser : roleOrUser.role;

  if (role === "superadmin") return "Super Admin";
  if (role === "admin") return "Admin";
  if (role === "employee") return "Employee";
  return "Client";
}

export function getPortalLabel(roleOrUser: AuthUserRole | AuthUser | null | undefined) {
  if (!roleOrUser) return "Public Portal";

  const role = typeof roleOrUser === "string" ? roleOrUser : roleOrUser.role;

  if (role === "superadmin") return "Super Admin Portal";
  if (role === "admin") return "Admin Portal";
  if (role === "employee") return "Employee Portal";
  return "Client Portal";
}

export function getPortalPathForRole(role: AuthUserRole) {
  if (role === "admin" || role === "superadmin") return "/admin";
  if (role === "employee") return "/employee";
  return "/";
}

export function isRoleAllowedInPortal(role: AuthUserRole, portal: "admin" | "employee" | "client") {
  if (portal === "admin") return role === "admin" || role === "superadmin";
  if (portal === "employee") return role === "employee";
  return role === "client";
}

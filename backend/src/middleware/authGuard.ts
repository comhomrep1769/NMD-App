import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export type UserRole = "superadmin" | "admin" | "employee" | "client";

export type AuthPayload = {
  id: string;
  email: string;
  role: UserRole;
  displayName: string;
};

export type AuthenticatedRequest = Request & {
  authUser?: AuthPayload;
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is missing from backend environment variables.");
  }

  return secret;
}

function getBearerToken(req: Request) {
  const header = req.headers.authorization || "";

  if (header.toLowerCase().startsWith("bearer ")) {
    return header.slice(7).trim();
  }

  return "";
}

function normalizeRole(value: unknown): UserRole {
  const role = String(value || "").toLowerCase();

  if (role === "superadmin") return "superadmin";
  if (role === "admin") return "admin";
  if (role === "employee") return "employee";
  return "client";
}

function normalizeAuthPayload(value: unknown): AuthPayload {
  const raw = value as {
    id?: unknown;
    email?: unknown;
    role?: unknown;
    displayName?: unknown;
    display_name?: unknown;
    name?: unknown;
  };

  const email = String(raw.email || "");

  return {
    id: String(raw.id || ""),
    email,
    role: normalizeRole(raw.role),
    displayName: String(raw.displayName || raw.display_name || raw.name || email || "")
  };
}

export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const token = getBearerToken(req);

    if (!token) {
      return res.status(401).json({
        message: "Missing authorization token."
      });
    }

    const decoded = normalizeAuthPayload(jwt.verify(token, getJwtSecret()));

    if (!decoded.id || !decoded.email || !decoded.role) {
      return res.status(401).json({
        message: "Invalid authorization token."
      });
    }

    req.authUser = decoded;

    return next();
  } catch (err) {
    return res.status(401).json({
      message: err instanceof Error ? err.message : "Unauthorized."
    });
  }
}

export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  requireAuth(req, res, () => {
    const role = String(req.authUser?.role || "");

    if (role !== "superadmin" && role !== "admin") {
      return res.status(403).json({
        message: "Only Admin or Super Admin can perform this action."
      });
    }

    return next();
  });
}

export function isAdminRole(role: unknown) {
  const value = String(role || "").toLowerCase();
  return value === "superadmin" || value === "admin";
}

export function getAuthUser(req: AuthenticatedRequest) {
  return req.authUser || null;
}

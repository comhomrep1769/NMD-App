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

const JWT_PATTERN = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is missing from backend environment variables.");
  }

  return secret;
}

function safeDecodeURIComponent(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function parseCookies(cookieHeader: string) {
  const cookies: Record<string, string> = {};

  cookieHeader.split(";").forEach((part) => {
    const index = part.indexOf("=");

    if (index === -1) return;

    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();

    if (!key) return;

    cookies[key] = safeDecodeURIComponent(value);
  });

  return cookies;
}

function findJwtInString(value: unknown) {
  if (typeof value !== "string") return "";

  const clean = value.trim();

  if (!clean) return "";

  if (clean.toLowerCase().startsWith("bearer ")) {
    const token = clean.slice(7).trim();
    return JWT_PATTERN.test(token) ? token : "";
  }

  if (JWT_PATTERN.test(clean)) {
    return clean;
  }

  return "";
}

function findJwtDeep(value: unknown, depth = 0): string {
  if (depth > 5 || value === null || value === undefined) return "";

  const direct = findJwtInString(value);
  if (direct) return direct;

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]"))
    ) {
      try {
        return findJwtDeep(JSON.parse(trimmed), depth + 1);
      } catch {
        return "";
      }
    }

    return "";
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findJwtDeep(item, depth + 1);
      if (found) return found;
    }

    return "";
  }

  if (typeof value === "object") {
    const objectValue = value as Record<string, unknown>;

    const likelyTokenKeys = [
      "token",
      "authToken",
      "accessToken",
      "jwt",
      "idToken",
      "bearerToken",
      "sessionToken",
      "nmdToken",
      "nmd_token"
    ];

    for (const key of likelyTokenKeys) {
      const found = findJwtDeep(objectValue[key], depth + 1);
      if (found) return found;
    }

    for (const nestedValue of Object.values(objectValue)) {
      const found = findJwtDeep(nestedValue, depth + 1);
      if (found) return found;
    }
  }

  return "";
}

function getBearerToken(req: Request) {
  const authorizationToken = findJwtInString(req.headers.authorization || "");
  if (authorizationToken) return authorizationToken;

  const xAuthToken = findJwtInString(req.headers["x-auth-token"]);
  if (xAuthToken) return xAuthToken;

  const xAccessToken = findJwtInString(req.headers["x-access-token"]);
  if (xAccessToken) return xAccessToken;

  const cookieHeader = req.headers.cookie || "";

  if (cookieHeader) {
    const cookies = parseCookies(cookieHeader);

    const cookieKeys = [
      "nmd_token",
      "nmdToken",
      "nmd_auth_token",
      "nmdAuthToken",
      "auth_token",
      "authToken",
      "access_token",
      "accessToken",
      "token",
      "jwt",
      "idToken",
      "bearerToken",
      "sessionToken"
    ];

    for (const key of cookieKeys) {
      const token = findJwtDeep(cookies[key]);
      if (token) return token;
    }

    const anyCookieToken = findJwtDeep(cookies);
    if (anyCookieToken) return anyCookieToken;
  }

  return "";
}

function normalizeRole(value: unknown): UserRole {
  const role = String(value || "").toLowerCase();

  if (role === "superadmin" || role === "super_admin" || role === "super-admin") {
    return "superadmin";
  }

  if (role === "admin") return "admin";
  if (role === "employee") return "employee";
  return "client";
}

function normalizeAuthPayload(value: unknown): AuthPayload {
  const raw = value as {
    id?: unknown;
    userId?: unknown;
    sub?: unknown;
    email?: unknown;
    role?: unknown;
    displayName?: unknown;
    display_name?: unknown;
    name?: unknown;
  };

  const email = String(raw.email || "");

  return {
    id: String(raw.id || raw.userId || raw.sub || ""),
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
        message:
          "Missing authorization token. Please log out, log back in, and try again. If this continues, the login flow is not saving a JWT token."
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
    const role = String(req.authUser?.role || "").toLowerCase();

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

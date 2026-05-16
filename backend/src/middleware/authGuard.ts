import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export type UserRole = "superadmin" | "admin" | "employee" | "client";

export type AuthPayload = {
  id: string;
  email: string;
  role: UserRole;
};

export type AuthenticatedRequest = Request & {
  user?: AuthPayload;
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

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const token = getBearerToken(req);

    if (!token) {
      return res.status(401).json({
        message: "Missing authorization token."
      });
    }

    const decoded = jwt.verify(token, getJwtSecret()) as AuthPayload;

    if (!decoded.id || !decoded.email || !decoded.role) {
      return res.status(401).json({
        message: "Invalid authorization token."
      });
    }

    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({
      message: err instanceof Error ? err.message : "Unauthorized."
    });
  }
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    const role = req.user?.role;

    if (role !== "superadmin" && role !== "admin") {
      return res.status(403).json({
        message: "Only Admin or Super Admin can perform this action."
      });
    }

    return next();
  });
}

export function isAdminRole(role: unknown) {
  return role === "superadmin" || role === "admin";
}

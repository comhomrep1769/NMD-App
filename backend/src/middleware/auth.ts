import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

type JwtPayload = {
  id: string;
  email: string;
  role: "admin" | "employee";
};

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing auth token" });
  }

  const token = header.replace("Bearer ", "");

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch {
    return res.status(401).json({ error: "Invalid auth token" });
  }
}

export function requireRole(role: "admin" | "employee") {
  return function (req: Request, res: Response, next: NextFunction) {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.user.role !== role) {
      return res.status(403).json({ error: "Forbidden" });
    }

    next();
  };
}

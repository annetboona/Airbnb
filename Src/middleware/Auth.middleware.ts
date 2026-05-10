import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { log } from "node:console";

const JWT_SECRET = process.env["JWT_SECRET"];
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET must be defined");
}
const jwtSecret: string = JWT_SECRET;

export interface AuthRequest extends Request {
  userId?: string | undefined;
  role?: string | undefined;
  file?: Express.Multer.File | undefined;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided", authorization: authHeader });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as unknown as { userId: string; role: string };
    req.userId = decoded.userId;
    req.role = typeof decoded.role === "string" ? decoded.role.trim().toUpperCase() : undefined;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token", details: (error as Error).message });
  }
}

export function requireHost(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.role !== "HOST") {
    return res.status(403).json({ error: "Only hosts can perform this action", role: req.role });
  }
  next();
}

export function requireGuest(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.role !== "GUEST") {
    console.log("Access denied. User role:", req.role);
    return res.status(403).json({ error: "Only guests can perform this action", role: req.role });
  }
  next();
}

/** Guest may only load their own user id path; ADMIN may load anyone’s */
export function requireGuestSelfOrAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  const targetUserId = req.params["id"] as string | undefined;
  if (req.role === "ADMIN") {
    next();
    return;
  }
  if (req.role === "GUEST" && targetUserId && req.userId === targetUserId) {
    next();
    return;
  }
  return res.status(403).json({
    error: "You may only load your own bookings",
    role: req.role,
  });
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.role !== "ADMIN") {
    return res.status(403).json({ error: "Only admins can perform this action" });
  }
  next();
}
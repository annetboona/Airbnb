import type { Request, Response, NextFunction } from "express";

type RateLimitEntry = {
  count: number;
  windowStart: number;
};

const generalWindowMs = 15 * 60 * 1000;
const strictWindowMs = 15 * 60 * 1000;
const generalMax = 100;
const strictMax = 20;

const generalRateMap = new Map<string, RateLimitEntry>();
const strictRateMap = new Map<string, RateLimitEntry>();

const getClientIp = (req: Request) => {
  return (
    req.ip ||
    (req.headers["x-forwarded-for"] as string) ||
    req.socket.remoteAddress ||
    "unknown"
  );
};

const getRetryAfter = (
  ip: string,
  map: Map<string, RateLimitEntry>,
  max: number,
  windowMs: number
): number | null => {
  const now = Date.now();
  const entry = map.get(ip);

  if (!entry || now - entry.windowStart >= windowMs) {
    map.set(ip, { count: 1, windowStart: now });
    return null;
  }

  if (entry.count >= max) {
    return Math.ceil((windowMs - (now - entry.windowStart)) / 1000);
  }

  entry.count += 1;
  map.set(ip, entry);
  return null;
};

export const generalRateLimiter = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const ip = getClientIp(req);
  const retryAfter = getRetryAfter(ip, generalRateMap, generalMax, generalWindowMs);

  if (retryAfter !== null) {
    res.setHeader("Retry-After", retryAfter.toString());
    return res.status(429).json({
      error: `Too many requests. Please try again in ${retryAfter} seconds.`,
    });
  }

  next();
};

export const strictRateLimiter = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.method !== "POST") {
    return next();
  }

  const ip = getClientIp(req);
  const retryAfter = getRetryAfter(ip, strictRateMap, strictMax, strictWindowMs);

  if (retryAfter !== null) {
    res.setHeader("Retry-After", retryAfter.toString());
    return res.status(429).json({
      error: `Too many POST requests. Please try again in ${retryAfter} seconds.`,
    });
  }

  next();
};
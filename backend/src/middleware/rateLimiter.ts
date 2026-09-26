import { NextFunction, Request, Response } from "express";

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
}

interface ClientRecord {
  count: number;
  resetTime: number;
}

export function createRateLimiter(options: RateLimitOptions) {
  const {
    windowMs,
    max,
    message = "Too many requests, please try again later.",
  } = options;

  const clientStore = new Map<string, ClientRecord>();

  // Periodically clean up expired records to prevent unbounded memory growth
  const interval = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of clientStore.entries()) {
      if (now > record.resetTime) {
        clientStore.delete(key);
      }
    }
  }, 60000);
  interval.unref();

  return (req: Request, res: Response, next: NextFunction) => {
    const clientKey =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.ip ||
      req.socket.remoteAddress ||
      "unknown_client";

    const now = Date.now();
    let record = clientStore.get(clientKey);

    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + windowMs };
      clientStore.set(clientKey, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, max - record.count);
    const resetSeconds = Math.ceil(record.resetTime / 1000);

    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", remaining);
    res.setHeader("X-RateLimit-Reset", resetSeconds);

    if (record.count > max) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader("Retry-After", retryAfter);
      return res.status(429).json({ message });
    }

    next();
  };
}

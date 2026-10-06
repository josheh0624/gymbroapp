import { NextFunction, Request, Response } from "express";

/**
 * In-memory sliding daily quota store.
 * Keyed by `${userId || ip}:${currentDateUtc}` -> count.
 */
interface DailyUsageRecord {
  count: number;
  lastUpdated: number;
}

const dailyUsageMap = new Map<string, DailyUsageRecord>();

const DEFAULT_DAILY_LIMIT = 50;

/**
 * Gets UTC date string in format YYYY-MM-DD
 */
function getCurrentUtcDate(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Calculates seconds remaining until UTC midnight
 */
function getSecondsUntilUtcMidnight(): number {
  const now = new Date();
  const midnight = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0),
  );
  return Math.floor((midnight.getTime() - now.getTime()) / 1000);
}

/**
 * Periodically purge stale days from memory (runs every 6 hours)
 */
setInterval(() => {
  const today = getCurrentUtcDate();
  for (const key of dailyUsageMap.keys()) {
    if (!key.endsWith(`:${today}`)) {
      dailyUsageMap.delete(key);
    }
  }
}, 6 * 60 * 60 * 1000);

/**
 * Daily Per-User Message Quota Middleware.
 * Prevents denial-of-wallet and API token billing exhaustion.
 */
export function dailyQuotaLimiter(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const limit = parseInt(
    process.env.AI_DAILY_MESSAGE_LIMIT || String(DEFAULT_DAILY_LIMIT),
    10,
  );

  // Authenticated user ID or fall back to client IP for dev/unauthenticated
  const authenticatedUserId =
    (req as any).user?.id && (req as any).user.id !== "dev-user"
      ? (req as any).user.id
      : req.ip || "dev-user";

  const today = getCurrentUtcDate();
  const quotaKey = `${authenticatedUserId}:${today}`;

  const currentRecord = dailyUsageMap.get(quotaKey) || {
    count: 0,
    lastUpdated: Date.now(),
  };

  const secondsUntilReset = getSecondsUntilUtcMidnight();

  // Attach quota telemetry headers
  res.setHeader("X-Daily-Quota-Limit", limit);
  res.setHeader(
    "X-Daily-Quota-Remaining",
    Math.max(0, limit - currentRecord.count),
  );
  res.setHeader("X-Daily-Quota-Reset", secondsUntilReset);

  if (currentRecord.count >= limit) {
    console.warn(
      `[QUOTA EXCEEDED] User/IP "${authenticatedUserId}" reached daily limit of ${limit} requests.`,
    );

    return res.status(429).json({
      error: `You've hit your daily training consultation limit of ${limit} messages, bro! Take a rest interval, hit the gym floor, and let's crush your workouts again tomorrow!`,
      quotaExceeded: true,
      resetInSeconds: secondsUntilReset,
    });
  }

  // Increment usage for this request
  currentRecord.count += 1;
  currentRecord.lastUpdated = Date.now();
  dailyUsageMap.set(quotaKey, currentRecord);

  next();
}

/**
 * Helper to inspect quota programmatically or in unit tests
 */
export function getUserDailyUsage(userId: string): {
  count: number;
  limit: number;
  remaining: number;
} {
  const limit = parseInt(
    process.env.AI_DAILY_MESSAGE_LIMIT || String(DEFAULT_DAILY_LIMIT),
    10,
  );
  const today = getCurrentUtcDate();
  const quotaKey = `${userId}:${today}`;
  const record = dailyUsageMap.get(quotaKey);
  const count = record ? record.count : 0;
  return {
    count,
    limit,
    remaining: Math.max(0, limit - count),
  };
}

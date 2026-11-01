/**
 * In-memory sliding window rate limiter for security-sensitive endpoints (Authentication, Orders, Password Resets).
 * Mitigates brute-force credential stuffing, password spray, and denial-of-service spam.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const globalForRateLimit = globalThis as unknown as {
  rateLimitStore?: Map<string, RateLimitRecord>;
};

const rateLimitStore =
  globalForRateLimit.rateLimitStore || new Map<string, RateLimitRecord>();

if (process.env.NODE_ENV !== "production") {
  globalForRateLimit.rateLimitStore = rateLimitStore;
}

// Cleanup stale records every 5 minutes to avoid memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < 600_000); // 10 minutes max window
      if (record.timestamps.length === 0) {
        rateLimitStore.delete(key);
      }
    }
  }, 300_000);
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetInSeconds: number;
}

/**
 * Checks and records an action against a rate limit window
 * @param identifier Unique identifier, e.g. IP address or "login:ip:email"
 * @param limit Max allowed attempts in the window
 * @param windowSeconds Window length in seconds
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 10,
  windowSeconds: number = 60
): RateLimitResult {
  const isLocalDev =
    process.env.NODE_ENV !== "production" &&
    (identifier.includes("127.0.0.1") || identifier.includes("::1"));

  // In local development, provide generous headroom so automated audit suites don't self-choke
  const effectiveLimit = isLocalDev ? Math.max(limit * 20, 200) : limit;

  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const cutoff = now - windowMs;

  let record = rateLimitStore.get(identifier);
  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(identifier, record);
  }

  // Filter timestamps within window
  record.timestamps = record.timestamps.filter((ts) => ts > cutoff);

  if (record.timestamps.length >= effectiveLimit) {
    const oldest = record.timestamps[0];
    const resetInSeconds = Math.ceil((oldest + windowMs - now) / 1000);
    return {
      success: false,
      remaining: 0,
      resetInSeconds: Math.max(1, resetInSeconds),
    };
  }

  // Record this attempt
  record.timestamps.push(now);
  return {
    success: true,
    remaining: effectiveLimit - record.timestamps.length,
    resetInSeconds: windowSeconds,
  };
}

/**
 * Extracts client IP safely from Next.js request headers
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}

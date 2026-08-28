import { Errors } from "@/lib/errors";

/**
 * Rate limiting abstraction.
 *
 * Ships an in-memory fixed-window limiter suitable for a single instance and
 * for the demo. The interface is deliberately storage-agnostic: in production
 * (multi-instance / serverless) swap `MemoryRateLimiter` for a shared store
 * (e.g. Upstash Redis) without changing call sites.
 */
export interface RateLimiter {
  /** Returns remaining budget, or throws Errors.rateLimited() when exceeded. */
  check(key: string): { remaining: number; resetAt: number };
}

interface Bucket {
  count: number;
  resetAt: number;
}

export class MemoryRateLimiter implements RateLimiter {
  private buckets = new Map<string, Bucket>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number
  ) {}

  check(key: string): { remaining: number; resetAt: number } {
    const now = Date.now();
    const existing = this.buckets.get(key);

    if (!existing || existing.resetAt <= now) {
      const bucket = { count: 1, resetAt: now + this.windowMs };
      this.buckets.set(key, bucket);
      this.sweep(now);
      return { remaining: this.limit - 1, resetAt: bucket.resetAt };
    }

    if (existing.count >= this.limit) {
      throw Errors.rateLimited(
        `Rate limit exceeded. Try again in ${Math.ceil(
          (existing.resetAt - now) / 1000
        )}s.`
      );
    }

    existing.count += 1;
    return { remaining: this.limit - existing.count, resetAt: existing.resetAt };
  }

  private sweep(now: number) {
    if (this.buckets.size < 1000) return;
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) this.buckets.delete(key);
    }
  }
}

/** Shared limiters for common surfaces. */
export const webhookLimiter = new MemoryRateLimiter(60, 60_000); // 60/min
export const writeApiLimiter = new MemoryRateLimiter(30, 60_000); // 30/min

/** Extract a stable client key from request headers (IP-based fallback). */
export function clientKey(headers: Headers, prefix = "ip"): string {
  const ip =
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    "unknown";
  return `${prefix}:${ip}`;
}

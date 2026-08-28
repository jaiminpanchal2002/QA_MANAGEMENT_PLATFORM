import { describe, expect, it, vi } from "vitest";
import { MemoryRateLimiter, clientKey } from "./rate-limit";
import { isAppError } from "@/lib/errors";

describe("MemoryRateLimiter", () => {
  it("allows requests up to the limit then rejects", () => {
    const rl = new MemoryRateLimiter(3, 60_000);
    expect(rl.check("k").remaining).toBe(2);
    expect(rl.check("k").remaining).toBe(1);
    expect(rl.check("k").remaining).toBe(0);
    try {
      rl.check("k");
      throw new Error("should have thrown");
    } catch (e) {
      expect(isAppError(e)).toBe(true);
      expect((e as { status: number }).status).toBe(429);
    }
  });

  it("scopes buckets per key", () => {
    const rl = new MemoryRateLimiter(1, 60_000);
    expect(() => rl.check("a")).not.toThrow();
    expect(() => rl.check("b")).not.toThrow();
    expect(() => rl.check("a")).toThrow();
  });

  it("resets after the window elapses", () => {
    vi.useFakeTimers();
    const rl = new MemoryRateLimiter(1, 1000);
    rl.check("k");
    expect(() => rl.check("k")).toThrow();
    vi.advanceTimersByTime(1001);
    expect(() => rl.check("k")).not.toThrow();
    vi.useRealTimers();
  });
});

describe("clientKey", () => {
  it("prefers x-forwarded-for first hop", () => {
    const h = new Headers({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" });
    expect(clientKey(h, "api")).toBe("api:1.2.3.4");
  });
  it("falls back to unknown", () => {
    expect(clientKey(new Headers(), "api")).toBe("api:unknown");
  });
});

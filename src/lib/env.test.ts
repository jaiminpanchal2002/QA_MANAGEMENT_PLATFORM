import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Regression tests for environment URL resolution — the logic that lets the
 * app build/deploy on Vercel without knowing the final URL up front, and that
 * tolerates a bare host (no scheme) for BETTER_AUTH_URL.
 */
const BASE = {
  DATABASE_URL: "postgresql://u:p@h/db",
  BETTER_AUTH_SECRET: "0123456789abcdef0123",
  INTEGRATION_WEBHOOK_SECRET: "0123456789abcdef0123",
};

async function loadEnv(overrides: Record<string, string | undefined>) {
  vi.resetModules();
  for (const [k, v] of Object.entries({
    BETTER_AUTH_URL: undefined,
    NEXT_PUBLIC_APP_URL: undefined,
    VERCEL_URL: undefined,
    VERCEL_PROJECT_PRODUCTION_URL: undefined,
    ...BASE,
    ...overrides,
  })) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  return import("./env");
}

describe("env URL resolution", () => {
  const snapshot = { ...process.env };
  beforeEach(() => vi.resetModules());
  afterEach(() => {
    process.env = { ...snapshot };
  });

  it("uses an explicit BETTER_AUTH_URL as-is", async () => {
    const m = await loadEnv({ BETTER_AUTH_URL: "https://app.example.com" });
    expect(m.getServerEnv().BETTER_AUTH_URL).toBe("https://app.example.com");
  });

  it("prepends https:// to a bare host (fixes 'Invalid url')", async () => {
    const m = await loadEnv({ BETTER_AUTH_URL: "app.example.com" });
    expect(m.getServerEnv().BETTER_AUTH_URL).toBe("https://app.example.com");
  });

  it("falls back to the Vercel production domain when unset", async () => {
    const m = await loadEnv({
      VERCEL_PROJECT_PRODUCTION_URL: "prod.vercel.app",
      VERCEL_URL: "deploy-xyz.vercel.app",
    });
    expect(m.getServerEnv().BETTER_AUTH_URL).toBe("https://prod.vercel.app");
  });

  it("falls back to the per-deploy Vercel URL if production domain absent", async () => {
    const m = await loadEnv({ VERCEL_URL: "deploy-xyz.vercel.app" });
    expect(m.getServerEnv().BETTER_AUTH_URL).toBe("https://deploy-xyz.vercel.app");
  });

  it("falls back to localhost for local dev", async () => {
    const m = await loadEnv({});
    expect(m.getServerEnv().BETTER_AUTH_URL).toBe("http://localhost:3000");
  });
});

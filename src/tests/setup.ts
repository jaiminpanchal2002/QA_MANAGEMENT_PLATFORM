import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import { config } from "dotenv";

// Load local env so DB-backed tests can find DATABASE_URL when present.
config({ path: ".env.local" });
config({ path: ".env" });

// Provide safe fallbacks for non-DB env so getServerEnv() passes in tests.
// DATABASE_URL is intentionally NOT defaulted — its absence makes DB-backed
// tests skip rather than fail.
process.env.BETTER_AUTH_SECRET ??= "test-better-auth-secret-0123456789";
process.env.BETTER_AUTH_URL ??= "http://localhost:3000";
process.env.NEXT_PUBLIC_APP_URL ??= "http://localhost:3000";
process.env.INTEGRATION_WEBHOOK_SECRET ??= "test-webhook-secret-0123456789";

afterEach(() => {
  cleanup();
});

import { z } from "zod";

/**
 * Runtime environment validation (fail-fast).
 *
 * This module is imported on the server only. It validates required
 * environment variables at process start so misconfiguration surfaces
 * immediately with a clear message instead of a confusing runtime crash.
 *
 * NEVER import this from a client component — it would leak server secrets
 * into the client bundle. Client-safe values live in NEXT_PUBLIC_* and are
 * exposed explicitly via `publicEnv` below.
 */
const serverSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required")
    .url("DATABASE_URL must be a valid connection string"),
  DATABASE_URL_UNPOOLED: z.string().optional(),
  BETTER_AUTH_SECRET: z
    .string()
    .min(16, "BETTER_AUTH_SECRET must be at least 16 characters"),
  // Optional + normalized: falls back to the Vercel-provided URL at build/run
  // time, so deployment does not require knowing the final URL up front. A
  // bare host (no scheme) is accepted and https:// is prepended.
  BETTER_AUTH_URL: z.string().optional(),
  BLOB_READ_WRITE_TOKEN: z.string().optional().default(""),
  RESEND_API_KEY: z.string().optional().default(""),
  EMAIL_FROM: z.string().optional().default("QA Platform <no-reply@example.com>"),
  // SMTP (e.g. Gmail app password). When SMTP_HOST + SMTP_USER + SMTP_PASSWORD
  // are all set, email is sent over SMTP; otherwise Resend, otherwise console.
  SMTP_HOST: z.string().optional().default(""),
  SMTP_PORT: z.coerce.number().int().positive().optional().default(587),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASSWORD: z.string().optional().default(""),
  // "true" forces implicit TLS (port 465). Otherwise STARTTLS is used.
  SMTP_SECURE: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  INTEGRATION_WEBHOOK_SECRET: z
    .string()
    .min(16, "INTEGRATION_WEBHOOK_SECRET must be at least 16 characters")
    .optional()
    .default("dev-insecure-webhook-secret-change-me"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  ALLOW_SEED: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  LOG_LEVEL: z
    .enum(["debug", "info", "warn", "error"])
    .optional()
    .default("info"),
});

const publicSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().optional(),
});

type ServerEnv = Omit<z.infer<typeof serverSchema>, "BETTER_AUTH_URL"> & {
  BETTER_AUTH_URL: string;
};
type PublicEnv = { NEXT_PUBLIC_APP_URL: string };

function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
}

/** Normalize a URL-ish value: prepend https:// to a bare host; else as-is. */
function normalizeUrl(value: string): string {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

/**
 * Resolve the canonical app URL. Precedence:
 *   1. explicit BETTER_AUTH_URL / NEXT_PUBLIC_APP_URL (normalized)
 *   2. Vercel's stable production domain, then the per-deploy URL
 *   3. localhost for local dev
 * This removes the build-time chicken-and-egg (needing the URL before deploy).
 */
function resolveAppUrl(explicit?: string): string {
  if (explicit && explicit.trim()) return normalizeUrl(explicit.trim());
  const vercel =
    process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

let cachedServerEnv: ServerEnv | null = null;

/**
 * Returns the validated server environment. Throws a descriptive error if
 * any required variable is missing or malformed.
 */
export function getServerEnv(): ServerEnv {
  if (cachedServerEnv) return cachedServerEnv;

  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      `Invalid server environment configuration:\n${formatIssues(parsed.error)}\n` +
        "Copy .env.example to .env.local and provide the required values."
    );
  }
  cachedServerEnv = {
    ...parsed.data,
    BETTER_AUTH_URL: resolveAppUrl(parsed.data.BETTER_AUTH_URL),
  };
  return cachedServerEnv;
}

const parsedPublic = publicSchema.safeParse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});

export const publicEnv: PublicEnv = {
  NEXT_PUBLIC_APP_URL: resolveAppUrl(
    parsedPublic.success ? parsedPublic.data.NEXT_PUBLIC_APP_URL : undefined
  ),
};

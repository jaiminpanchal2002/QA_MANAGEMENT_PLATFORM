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
  BETTER_AUTH_URL: z.string().url(),
  BLOB_READ_WRITE_TOKEN: z.string().optional().default(""),
  RESEND_API_KEY: z.string().optional().default(""),
  EMAIL_FROM: z.string().optional().default("QA Platform <no-reply@example.com>"),
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
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
});

type ServerEnv = z.infer<typeof serverSchema>;
type PublicEnv = z.infer<typeof publicSchema>;

function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
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
  cachedServerEnv = parsed.data;
  return cachedServerEnv;
}

const parsedPublic = publicSchema.safeParse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});

export const publicEnv: PublicEnv = parsedPublic.success
  ? parsedPublic.data
  : { NEXT_PUBLIC_APP_URL: "http://localhost:3000" };

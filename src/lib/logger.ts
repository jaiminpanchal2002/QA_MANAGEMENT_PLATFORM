/**
 * Minimal structured logger.
 *
 * - Emits single-line JSON in production (easy to ship to a log aggregator).
 * - Pretty prints in development.
 * - Redacts known-sensitive keys so secrets never reach logs.
 *
 * This is intentionally dependency-free so it can be used from any server
 * context (route handlers, server actions, background jobs).
 */
type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const SENSITIVE_KEYS = new Set([
  "password",
  "passwordhash",
  "token",
  "secret",
  "authorization",
  "cookie",
  "session",
  "apikey",
  "api_key",
  "better_auth_secret",
  "blob_read_write_token",
  "resend_api_key",
]);

function currentLevel(): LogLevel {
  const raw = (process.env.LOG_LEVEL ?? "info").toLowerCase();
  if (raw === "debug" || raw === "info" || raw === "warn" || raw === "error") {
    return raw;
  }
  return "info";
}

function redact(value: unknown, depth = 0): unknown {
  if (depth > 6) return "[truncated]";
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      out[key] = "[redacted]";
    } else {
      out[key] = redact(val, depth + 1);
    }
  }
  return out;
}

function emit(level: LogLevel, message: string, context?: Record<string, unknown>) {
  if (LEVEL_WEIGHT[level] < LEVEL_WEIGHT[currentLevel()]) return;

  const entry = {
    level,
    time: new Date().toISOString(),
    message,
    ...(context ? { context: redact(context) } : {}),
  };

  const line =
    process.env.NODE_ENV === "production"
      ? JSON.stringify(entry)
      : `[${level.toUpperCase()}] ${message}${
          context ? ` ${JSON.stringify(redact(context))}` : ""
        }`;

  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    // eslint-disable-next-line no-console
    console.log(line);
  }
}

export const logger = {
  debug: (msg: string, ctx?: Record<string, unknown>) => emit("debug", msg, ctx),
  info: (msg: string, ctx?: Record<string, unknown>) => emit("info", msg, ctx),
  warn: (msg: string, ctx?: Record<string, unknown>) => emit("warn", msg, ctx),
  error: (msg: string, ctx?: Record<string, unknown>) => emit("error", msg, ctx),
};

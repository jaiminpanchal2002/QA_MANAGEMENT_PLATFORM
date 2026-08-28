import { ZodError } from "zod";
import { logger } from "./logger";

/**
 * Centralized application error taxonomy.
 *
 * Route handlers and server actions throw these; the API layer converts them
 * into consistent HTTP responses via `toErrorResponse`. This keeps internal
 * details (stack traces, SQL errors) out of client responses while preserving
 * rich server-side logs.
 */
export type ErrorCode =
  | "BAD_REQUEST"
  | "VALIDATION"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL";

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  BAD_REQUEST: 400,
  VALIDATION: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL: 500,
};

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: unknown;
  readonly expose: boolean;

  constructor(
    code: ErrorCode,
    message: string,
    options?: { details?: unknown; cause?: unknown }
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    this.details = options?.details;
    // 5xx messages are never exposed verbatim to clients.
    this.expose = this.status < 500;
    if (options?.cause) this.cause = options.cause;
  }
}

export const Errors = {
  badRequest: (message = "Bad request", details?: unknown) =>
    new AppError("BAD_REQUEST", message, { details }),
  validation: (message = "Validation failed", details?: unknown) =>
    new AppError("VALIDATION", message, { details }),
  unauthenticated: (message = "Authentication required") =>
    new AppError("UNAUTHENTICATED", message),
  forbidden: (message = "You do not have permission to perform this action") =>
    new AppError("FORBIDDEN", message),
  notFound: (message = "Resource not found") =>
    new AppError("NOT_FOUND", message),
  conflict: (message = "Resource conflict", details?: unknown) =>
    new AppError("CONFLICT", message, { details }),
  rateLimited: (message = "Too many requests") =>
    new AppError("RATE_LIMITED", message),
  internal: (message = "Internal server error", cause?: unknown) =>
    new AppError("INTERNAL", message, { cause }),
};

export interface ApiErrorBody {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
}

/**
 * Normalize any thrown value into a safe, consistent API error payload.
 * Logs full details server-side; returns a client-safe body + status.
 */
export function toErrorResponse(error: unknown): {
  status: number;
  body: ApiErrorBody;
} {
  if (error instanceof ZodError) {
    const app = Errors.validation("Validation failed", flattenZod(error));
    return { status: app.status, body: bodyFor(app) };
  }

  if (error instanceof AppError) {
    if (!error.expose) {
      logger.error("Unhandled server error", {
        code: error.code,
        message: error.message,
        cause: serializeCause(error.cause),
      });
      return {
        status: error.status,
        body: {
          success: false,
          error: { code: error.code, message: "Internal server error" },
        },
      };
    }
    return { status: error.status, body: bodyFor(error) };
  }

  // Unknown error — never leak details.
  logger.error("Unexpected error", { error: serializeCause(error) });
  return {
    status: 500,
    body: {
      success: false,
      error: { code: "INTERNAL", message: "Internal server error" },
    },
  };
}

function bodyFor(error: AppError): ApiErrorBody {
  return {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      ...(error.details !== undefined ? { details: error.details } : {}),
    },
  };
}

function flattenZod(error: ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_root";
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

function serializeCause(cause: unknown): unknown {
  if (cause instanceof Error) {
    return { name: cause.name, message: cause.message, stack: cause.stack };
  }
  return cause;
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

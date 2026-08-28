import { isAppError } from "@/lib/errors";
import { ZodError } from "zod";

/**
 * Typed result contract for Server Actions. Actions never throw to the client;
 * they return `{ ok: true, data }` or `{ ok: false, error }` so forms can
 * render inline messages. Detailed errors are still logged server-side.
 */
export type ActionResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: { code: string; message: string; fields?: Record<string, string[]> };
    };

export function toActionError<T>(error: unknown): ActionResult<T> {
  if (error instanceof ZodError) {
    const fields: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const key = issue.path.join(".") || "_root";
      (fields[key] ??= []).push(issue.message);
    }
    return {
      ok: false,
      error: { code: "VALIDATION", message: "Please fix the errors", fields },
    };
  }
  if (isAppError(error)) {
    return {
      ok: false,
      error: {
        code: error.code,
        message: error.expose ? error.message : "Something went wrong",
      },
    };
  }
  return {
    ok: false,
    error: { code: "INTERNAL", message: "Something went wrong" },
  };
}

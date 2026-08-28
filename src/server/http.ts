import { NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";

/**
 * Consistent API envelope + handler wrapper for Route Handlers.
 * Every /api response is `{ success, data | error, meta? }`.
 */
export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export function ok<T>(data: T, meta?: PageMeta, status = 200) {
  return NextResponse.json(
    { success: true as const, data, ...(meta ? { meta } : {}) },
    { status }
  );
}

export function created<T>(data: T) {
  return ok(data, undefined, 201);
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

/**
 * Wrap a route handler so any thrown AppError/ZodError becomes a safe,
 * consistent JSON error with the correct status code. Internal errors never
 * leak stack traces or SQL details to the client.
 */
export function handle<Args extends unknown[]>(
  fn: (...args: Args) => Promise<Response>
) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (error) {
      const { status, body } = toErrorResponse(error);
      return NextResponse.json(body, { status });
    }
  };
}

import "server-only";
import { headers } from "next/headers";
import { publicEnv } from "@/lib/env";

/**
 * The origin the current request actually arrived on, derived from proxy
 * headers. Absolute links built from this (e.g. invitation accept URLs) point
 * back to the exact domain the user is on — not a guessed env URL, which can
 * resolve to a different deployment alias and 404. Falls back to the
 * configured app URL when there is no request context (e.g. a background job).
 */
export async function getRequestBaseUrl(): Promise<string> {
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (host) {
      const proto =
        h.get("x-forwarded-proto") ??
        (host.startsWith("localhost") || host.startsWith("127.0.0.1")
          ? "http"
          : "https");
      return `${proto}://${host}`;
    }
  } catch {
    // No request scope available — fall through to the configured URL.
  }
  return publicEnv.NEXT_PUBLIC_APP_URL;
}

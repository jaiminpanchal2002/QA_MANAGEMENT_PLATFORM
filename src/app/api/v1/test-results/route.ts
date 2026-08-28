import type { NextRequest } from "next/server";
import { created, handle } from "@/server/http";
import { Errors } from "@/lib/errors";
import { ingestTestResults } from "@/features/integrations/ingest";
import { clientKey, webhookLimiter } from "@/lib/security/rate-limit";

/**
 * POST /api/v1/test-results
 *
 * External CI/CD entry point. Authenticated with an integration bearer token
 * (Authorization: Bearer qa_...), NOT a user session. Payload is validated
 * with Zod and never trusted blindly. Results are matched to existing test
 * cases by reference and ingested as an automated test run.
 */
export const POST = handle(async (req: NextRequest) => {
  webhookLimiter.check(clientKey(req.headers, "webhook"));

  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token) {
    throw Errors.unauthenticated("Missing integration bearer token");
  }

  const body = await req.json().catch(() => {
    throw Errors.badRequest("Invalid JSON body");
  });

  const result = await ingestTestResults(token, body);
  return created(result);
});

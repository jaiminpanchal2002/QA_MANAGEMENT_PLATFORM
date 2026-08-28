import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  integrations,
  testCases,
  testExecutions,
  testRuns,
} from "@/db/schema";
import { Errors } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { recordAudit } from "@/lib/audit/audit";
import { extractPrefix, tokensMatch } from "@/lib/integrations/tokens";
import {
  testResultsPayloadSchema,
  type TestResultsPayload,
} from "./schema";

/** Resolve and authenticate an integration from a bearer token. */
async function authenticateIntegration(token: string) {
  const prefix = extractPrefix(token);
  if (!prefix) throw Errors.unauthenticated("Malformed integration token");

  const rows = await db
    .select()
    .from(integrations)
    .where(eq(integrations.tokenPrefix, prefix))
    .limit(5);

  const integration = rows.find(
    (r) => r.isActive && tokensMatch(token, r.tokenHash)
  );
  if (!integration) {
    logger.warn("Integration auth failed", { prefix });
    throw Errors.unauthenticated("Invalid integration token");
  }
  return integration;
}

const STATUS_MAP: Record<
  TestResultsPayload["results"][number]["status"],
  (typeof testExecutions.status.enumValues)[number]
> = {
  PASSED: "PASSED",
  FAILED: "FAILED",
  BLOCKED: "BLOCKED",
  SKIPPED: "SKIPPED",
  RETEST: "RETEST",
};

/**
 * Ingest externally-submitted test results into a new automated run.
 *
 * Results are matched to existing test cases by reference within the
 * integration's project. Unmatched references are counted and reported but
 * never trusted to create arbitrary records.
 */
export async function ingestTestResults(token: string, rawPayload: unknown) {
  const integration = await authenticateIntegration(token);
  const payload = testResultsPayloadSchema.parse(rawPayload);

  const orgId = integration.organizationId;
  const projectId = integration.projectId;

  const refs = [...new Set(payload.results.map((r) => r.testRef))];
  const matchedCases = await db
    .select({ id: testCases.id, reference: testCases.reference })
    .from(testCases)
    .where(
      and(
        eq(testCases.organizationId, orgId),
        eq(testCases.projectId, projectId),
        inArray(testCases.reference, refs)
      )
    );
  const refToId = new Map(matchedCases.map((c) => [c.reference, c.id]));

  const matchedResults = payload.results.filter((r) => refToId.has(r.testRef));
  const failed = matchedResults.some((r) => r.status === "FAILED");

  const runId = await db.transaction(async (tx) => {
    const [run] = await tx
      .insert(testRuns)
      .values({
        organizationId: orgId,
        projectId,
        name: payload.runName,
        environment: payload.environment,
        status: failed ? "FAILED" : "COMPLETED",
        isAutomated: "true",
        provider: payload.provider ?? integration.provider,
        startedAt: new Date(),
        completedAt: new Date(),
        createdBy: integration.createdBy,
      })
      .returning({ id: testRuns.id });

    if (matchedResults.length > 0) {
      await tx.insert(testExecutions).values(
        matchedResults.map((r) => ({
          organizationId: orgId,
          projectId,
          testRunId: run!.id,
          testCaseId: refToId.get(r.testRef)!,
          status: STATUS_MAP[r.status],
          environment: payload.environment,
          durationMs: r.durationMs,
          errorMessage: r.errorMessage,
          logs: r.logs,
          completedAt: new Date(),
        }))
      );
    }

    await tx
      .update(integrations)
      .set({ lastUsedAt: new Date() })
      .where(eq(integrations.id, integration.id));

    return run!.id;
  });

  await recordAudit({
    organizationId: orgId,
    actorId: integration.createdBy,
    action: "testresults.ingested",
    entityType: "test_run",
    entityId: runId,
    metadata: {
      integration: integration.name,
      submitted: payload.results.length,
      matched: matchedResults.length,
    },
  });

  return {
    runId,
    submitted: payload.results.length,
    matched: matchedResults.length,
    unmatched: payload.results.length - matchedResults.length,
  };
}

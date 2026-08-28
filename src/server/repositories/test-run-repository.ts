import "server-only";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db, type Database } from "@/db";
import {
  testCases,
  testExecutions,
  testRuns,
  type TestExecution,
  type TestRun,
} from "@/db/schema";

/** Tenant-scoped data access for test runs and their executions. */
export async function getTestRunById(
  organizationId: string,
  id: string
): Promise<TestRun | null> {
  const rows = await db
    .select()
    .from(testRuns)
    .where(and(eq(testRuns.id, id), eq(testRuns.organizationId, organizationId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function listTestRuns(params: {
  organizationId: string;
  projectId: string;
  page: number;
  pageSize: number;
  status?: (typeof testRuns.status.enumValues)[number];
}) {
  const { organizationId, projectId, page, pageSize, status } = params;
  const where = and(
    eq(testRuns.organizationId, organizationId),
    eq(testRuns.projectId, projectId),
    status ? eq(testRuns.status, status) : undefined
  );
  const [rows, total] = await Promise.all([
    db
      .select()
      .from(testRuns)
      .where(where)
      .orderBy(asc(testRuns.name))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.$count(testRuns, where),
  ]);
  return { rows, total };
}

export interface ExecutionWithCase extends TestExecution {
  caseReference: string;
  caseTitle: string;
}

/** A run plus its executions joined with the test-case reference/title. */
export async function getRunWithExecutions(
  organizationId: string,
  runId: string
): Promise<{ run: TestRun; executions: ExecutionWithCase[] } | null> {
  const run = await getTestRunById(organizationId, runId);
  if (!run) return null;

  const executions = await db
    .select({
      execution: testExecutions,
      caseReference: testCases.reference,
      caseTitle: testCases.title,
    })
    .from(testExecutions)
    .innerJoin(testCases, eq(testExecutions.testCaseId, testCases.id))
    .where(
      and(
        eq(testExecutions.organizationId, organizationId),
        eq(testExecutions.testRunId, runId)
      )
    )
    .orderBy(asc(testCases.reference));

  return {
    run,
    executions: executions.map((r) => ({
      ...r.execution,
      caseReference: r.caseReference,
      caseTitle: r.caseTitle,
    })),
  };
}

export interface CreateRunData {
  organizationId: string;
  projectId: string;
  name: string;
  environment?: string | null;
  testPlanId?: string | null;
  testCaseIds: string[];
  createdBy: string;
}

/**
 * Create a run and one execution per selected test case, in a transaction.
 * Only test cases that actually belong to the project are included (guards
 * against injecting ids from elsewhere).
 */
export async function createRunWithExecutions(
  data: CreateRunData
): Promise<TestRun> {
  return db.transaction(async (tx) => {
    const validCases = await tx
      .select({ id: testCases.id })
      .from(testCases)
      .where(
        and(
          eq(testCases.organizationId, data.organizationId),
          eq(testCases.projectId, data.projectId),
          inArray(testCases.id, data.testCaseIds)
        )
      );
    if (validCases.length === 0) {
      throw new Error("No valid test cases for this project");
    }

    const [run] = await tx
      .insert(testRuns)
      .values({
        organizationId: data.organizationId,
        projectId: data.projectId,
        testPlanId: data.testPlanId ?? null,
        name: data.name,
        environment: data.environment ?? null,
        status: "NOT_STARTED",
        createdBy: data.createdBy,
      })
      .returning();

    await tx.insert(testExecutions).values(
      validCases.map((c) => ({
        organizationId: data.organizationId,
        projectId: data.projectId,
        testRunId: run!.id,
        testCaseId: c.id,
        status: "NOT_EXECUTED" as const,
        environment: data.environment ?? null,
      }))
    );

    return run!;
  });
}

/** Recompute a run's rolled-up status from its executions. */
export async function recomputeRunStatus(
  organizationId: string,
  runId: string,
  tx: Database = db
): Promise<(typeof testRuns.status.enumValues)[number]> {
  const execs = await tx
    .select({ status: testExecutions.status })
    .from(testExecutions)
    .where(
      and(
        eq(testExecutions.organizationId, organizationId),
        eq(testExecutions.testRunId, runId)
      )
    );

  const total = execs.length;
  const notExecuted = execs.filter((e) => e.status === "NOT_EXECUTED").length;
  const anyFailed = execs.some((e) => e.status === "FAILED");
  const anyBlocked = execs.some((e) => e.status === "BLOCKED");
  const allPassed = total > 0 && execs.every((e) => e.status === "PASSED");

  let status: (typeof testRuns.status.enumValues)[number];
  if (notExecuted === total) status = "NOT_STARTED";
  else if (notExecuted > 0) status = "RUNNING";
  else if (anyFailed) status = "FAILED";
  else if (anyBlocked) status = "BLOCKED";
  else if (allPassed) status = "PASSED";
  else status = "COMPLETED";

  const startedAt = notExecuted < total ? new Date() : null;
  const completedAt = notExecuted === 0 ? new Date() : null;

  await tx
    .update(testRuns)
    .set({
      status,
      ...(startedAt ? { startedAt } : {}),
      ...(completedAt ? { completedAt } : {}),
    })
    .where(
      and(eq(testRuns.id, runId), eq(testRuns.organizationId, organizationId))
    );

  return status;
}

export interface ExecuteData {
  status: (typeof testExecutions.status.enumValues)[number];
  errorMessage?: string | null;
  durationMs?: number | null;
  browser?: string | null;
  comment?: string | null;
  executedBy: string;
}

/** Update a single execution's result, verifying it belongs to the run. */
export async function updateExecution(
  organizationId: string,
  runId: string,
  executionId: string,
  data: ExecuteData,
  tx: Database = db
): Promise<TestExecution | null> {
  const rows = await tx
    .update(testExecutions)
    .set({
      status: data.status,
      errorMessage: data.errorMessage ?? null,
      durationMs: data.durationMs ?? null,
      browser: data.browser ?? null,
      comment: data.comment ?? null,
      executedBy: data.executedBy,
      completedAt: new Date(),
    })
    .where(
      and(
        eq(testExecutions.id, executionId),
        eq(testExecutions.testRunId, runId),
        eq(testExecutions.organizationId, organizationId)
      )
    )
    .returning();
  return rows[0] ?? null;
}

export async function cancelRun(
  organizationId: string,
  runId: string
): Promise<TestRun | null> {
  const rows = await db
    .update(testRuns)
    .set({ status: "CANCELLED", completedAt: new Date() })
    .where(
      and(eq(testRuns.id, runId), eq(testRuns.organizationId, organizationId))
    )
    .returning();
  return rows[0] ?? null;
}

export async function getExecutionsForRun(
  organizationId: string,
  runId: string
) {
  return db
    .select()
    .from(testExecutions)
    .where(
      and(
        eq(testExecutions.organizationId, organizationId),
        eq(testExecutions.testRunId, runId)
      )
    );
}

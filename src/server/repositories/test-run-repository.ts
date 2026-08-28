import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { testExecutions, testRuns, type TestRun } from "@/db/schema";

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
}) {
  const { organizationId, projectId, page, pageSize } = params;
  const where = and(
    eq(testRuns.organizationId, organizationId),
    eq(testRuns.projectId, projectId)
  );
  const [rows, total] = await Promise.all([
    db
      .select()
      .from(testRuns)
      .where(where)
      .orderBy(desc(testRuns.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.$count(testRuns, where),
  ]);
  return { rows, total };
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

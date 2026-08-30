import "server-only";
import { and, count, desc, eq, ilike, inArray, isNull, or } from "drizzle-orm";
import { db } from "@/db";
import {
  defects,
  projects,
  testCases,
  testExecutions,
  testRuns,
} from "@/db/schema";

/**
 * Cross-project ("org-wide") read models that power the top-level workspace
 * pages — the Test Case library, the Defect triage board, the Test Run activity
 * feed and the planning overview. These deliberately differ from the
 * project-scoped repositories: each joins the project so the row can be shown
 * and linked in an organization-wide list. All queries are tenant-scoped.
 */

// --- Test Case library -----------------------------------------------------
export async function listOrgTestCases(params: {
  organizationId: string;
  page: number;
  pageSize: number;
  search?: string;
  status?: (typeof testCases.status.enumValues)[number];
  priority?: (typeof testCases.priority.enumValues)[number];
}) {
  const where = and(
    eq(testCases.organizationId, params.organizationId),
    isNull(testCases.deletedAt),
    params.status ? eq(testCases.status, params.status) : undefined,
    params.priority ? eq(testCases.priority, params.priority) : undefined,
    params.search
      ? or(
          ilike(testCases.title, `%${params.search}%`),
          ilike(testCases.reference, `%${params.search}%`)
        )
      : undefined
  );

  const [rows, total] = await Promise.all([
    db
      .select({
        id: testCases.id,
        reference: testCases.reference,
        title: testCases.title,
        priority: testCases.priority,
        type: testCases.type,
        status: testCases.status,
        automationStatus: testCases.automationStatus,
        projectId: testCases.projectId,
        projectKey: projects.key,
        projectName: projects.name,
      })
      .from(testCases)
      .innerJoin(projects, eq(testCases.projectId, projects.id))
      .where(where)
      .orderBy(desc(testCases.createdAt))
      .limit(params.pageSize)
      .offset((params.page - 1) * params.pageSize),
    db.$count(testCases, where),
  ]);
  return { rows, total };
}

// --- Defect triage ---------------------------------------------------------
export async function defectStatusSummary(organizationId: string) {
  return db
    .select({ status: defects.status, c: count() })
    .from(defects)
    .where(
      and(eq(defects.organizationId, organizationId), isNull(defects.deletedAt))
    )
    .groupBy(defects.status);
}

export async function listOrgDefects(params: {
  organizationId: string;
  page: number;
  pageSize: number;
  search?: string;
  status?: (typeof defects.status.enumValues)[number];
  severity?: (typeof defects.severity.enumValues)[number];
}) {
  const where = and(
    eq(defects.organizationId, params.organizationId),
    isNull(defects.deletedAt),
    params.status ? eq(defects.status, params.status) : undefined,
    params.severity ? eq(defects.severity, params.severity) : undefined,
    params.search
      ? or(
          ilike(defects.title, `%${params.search}%`),
          ilike(defects.reference, `%${params.search}%`)
        )
      : undefined
  );

  const [rows, total] = await Promise.all([
    db
      .select({
        id: defects.id,
        reference: defects.reference,
        title: defects.title,
        severity: defects.severity,
        status: defects.status,
        createdAt: defects.createdAt,
        projectId: defects.projectId,
        projectKey: projects.key,
        projectName: projects.name,
      })
      .from(defects)
      .innerJoin(projects, eq(defects.projectId, projects.id))
      .where(where)
      .orderBy(desc(defects.createdAt))
      .limit(params.pageSize)
      .offset((params.page - 1) * params.pageSize),
    db.$count(defects, where),
  ]);
  return { rows, total };
}

// --- Test Run activity -----------------------------------------------------
export async function listOrgTestRuns(params: {
  organizationId: string;
  page: number;
  pageSize: number;
  status?: (typeof testRuns.status.enumValues)[number];
}) {
  const where = and(
    eq(testRuns.organizationId, params.organizationId),
    params.status ? eq(testRuns.status, params.status) : undefined
  );

  const [rows, total] = await Promise.all([
    db
      .select({
        id: testRuns.id,
        name: testRuns.name,
        environment: testRuns.environment,
        status: testRuns.status,
        isAutomated: testRuns.isAutomated,
        createdAt: testRuns.createdAt,
        projectId: testRuns.projectId,
        projectKey: projects.key,
        projectName: projects.name,
      })
      .from(testRuns)
      .innerJoin(projects, eq(testRuns.projectId, projects.id))
      .where(where)
      .orderBy(desc(testRuns.createdAt))
      .limit(params.pageSize)
      .offset((params.page - 1) * params.pageSize),
    db.$count(testRuns, where),
  ]);

  const runIds = rows.map((r) => r.id);
  const counts = runIds.length
    ? await db
        .select({
          runId: testExecutions.testRunId,
          status: testExecutions.status,
          c: count(),
        })
        .from(testExecutions)
        .where(
          and(
            eq(testExecutions.organizationId, params.organizationId),
            inArray(testExecutions.testRunId, runIds)
          )
        )
        .groupBy(testExecutions.testRunId, testExecutions.status)
    : [];

  const byRun = new Map<string, { passed: number; failed: number; total: number }>();
  for (const c of counts) {
    const e = byRun.get(c.runId) ?? { passed: 0, failed: 0, total: 0 };
    if (c.status === "PASSED") e.passed += c.c;
    if (c.status === "FAILED") e.failed += c.c;
    e.total += c.c;
    byRun.set(c.runId, e);
  }

  return {
    rows: rows.map((r) => ({
      ...r,
      passed: byRun.get(r.id)?.passed ?? 0,
      failed: byRun.get(r.id)?.failed ?? 0,
      totalExecutions: byRun.get(r.id)?.total ?? 0,
    })),
    total,
  };
}

// --- Planning overview (per project) ---------------------------------------
export async function planningByProject(organizationId: string) {
  const rows = await db
    .select({
      projectId: testCases.projectId,
      status: testCases.status,
      c: count(),
    })
    .from(testCases)
    .where(
      and(
        eq(testCases.organizationId, organizationId),
        isNull(testCases.deletedAt)
      )
    )
    .groupBy(testCases.projectId, testCases.status);

  const runCounts = await db
    .select({
      projectId: testRuns.projectId,
      c: count(),
    })
    .from(testRuns)
    .where(eq(testRuns.organizationId, organizationId))
    .groupBy(testRuns.projectId);

  const projectRows = await db
    .select({ id: projects.id, name: projects.name, key: projects.key })
    .from(projects)
    .where(
      and(eq(projects.organizationId, organizationId), isNull(projects.deletedAt))
    )
    .orderBy(projects.name);

  const tcByProject = new Map<
    string,
    { total: number; active: number; draft: number }
  >();
  for (const r of rows) {
    const e = tcByProject.get(r.projectId) ?? { total: 0, active: 0, draft: 0 };
    e.total += r.c;
    if (r.status === "ACTIVE") e.active += r.c;
    if (r.status === "DRAFT") e.draft += r.c;
    tcByProject.set(r.projectId, e);
  }
  const runByProject = new Map(runCounts.map((r) => [r.projectId, r.c]));

  return projectRows.map((p) => {
    const tc = tcByProject.get(p.id) ?? { total: 0, active: 0, draft: 0 };
    return {
      id: p.id,
      name: p.name,
      key: p.key,
      testCases: tc.total,
      active: tc.active,
      draft: tc.draft,
      runs: runByProject.get(p.id) ?? 0,
    };
  });
}

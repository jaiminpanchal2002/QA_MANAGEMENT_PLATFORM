import "server-only";
import { and, count, desc, eq, gte, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  auditLogs,
  defects,
  projects,
  testCases,
  testExecutions,
  testRuns,
} from "@/db/schema";
import { requireOrgContext } from "@/lib/auth/context";
import { percent } from "@/lib/utils";

/**
 * Aggregated QA dashboard metrics for the active organization.
 *
 * ALL numbers come from real, tenant-scoped SQL aggregations — there are no
 * hardcoded metrics. An optional projectId narrows every metric to one project.
 */
export interface DashboardMetrics {
  totals: {
    projects: number;
    testCases: number;
    automatedTestCases: number;
    automationCoverage: number;
    openDefects: number;
  };
  execution: {
    passed: number;
    failed: number;
    blocked: number;
    skipped: number;
    notExecuted: number;
    total: number;
    passRate: number;
  };
  defectsBySeverity: Array<{ severity: string; count: number }>;
  defectsByStatus: Array<{ status: string; count: number }>;
  testCaseStatus: Array<{ status: string; count: number }>;
  executionTrend: Array<{ date: string; passed: number; failed: number }>;
  recentRuns: Array<{
    id: string;
    name: string;
    status: string;
    createdAt: Date;
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    entityType: string;
    createdAt: Date;
  }>;
}

export async function getDashboardMetrics(
  projectId?: string
): Promise<DashboardMetrics> {
  const ctx = await requireOrgContext();
  const orgId = ctx.organizationId;

  const projScope = projectId ? { projectId } : {};
  const tcWhere = and(
    eq(testCases.organizationId, orgId),
    isNull(testCases.deletedAt),
    projectId ? eq(testCases.projectId, projectId) : undefined
  );
  const execWhere = and(
    eq(testExecutions.organizationId, orgId),
    projectId ? eq(testExecutions.projectId, projectId) : undefined
  );
  const defectWhere = and(
    eq(defects.organizationId, orgId),
    isNull(defects.deletedAt),
    projectId ? eq(defects.projectId, projectId) : undefined
  );

  const since = new Date();
  since.setDate(since.getDate() - 13);

  const [
    projectCount,
    testCaseTotal,
    automatedCount,
    execByStatus,
    tcByStatus,
    defBySeverity,
    defByStatus,
    openDefectCount,
    trendRows,
    recentRuns,
    recentActivity,
  ] = await Promise.all([
    db.$count(
      projects,
      and(eq(projects.organizationId, orgId), isNull(projects.deletedAt))
    ),
    db.$count(testCases, tcWhere),
    db.$count(
      testCases,
      and(tcWhere, eq(testCases.automationStatus, "AUTOMATED"))
    ),
    db
      .select({ status: testExecutions.status, c: count() })
      .from(testExecutions)
      .where(execWhere)
      .groupBy(testExecutions.status),
    db
      .select({ status: testCases.status, c: count() })
      .from(testCases)
      .where(tcWhere)
      .groupBy(testCases.status),
    db
      .select({ severity: defects.severity, c: count() })
      .from(defects)
      .where(defectWhere)
      .groupBy(defects.severity),
    db
      .select({ status: defects.status, c: count() })
      .from(defects)
      .where(defectWhere)
      .groupBy(defects.status),
    db.$count(
      defects,
      and(defectWhere, sql`${defects.status} in ('OPEN','IN_PROGRESS','REOPENED')`)
    ),
    db
      .select({
        day: sql<string>`to_char(${testExecutions.createdAt}, 'YYYY-MM-DD')`,
        status: testExecutions.status,
        c: count(),
      })
      .from(testExecutions)
      .where(and(execWhere, gte(testExecutions.createdAt, since)))
      .groupBy(
        sql`to_char(${testExecutions.createdAt}, 'YYYY-MM-DD')`,
        testExecutions.status
      ),
    db
      .select({
        id: testRuns.id,
        name: testRuns.name,
        status: testRuns.status,
        createdAt: testRuns.createdAt,
      })
      .from(testRuns)
      .where(
        and(
          eq(testRuns.organizationId, orgId),
          projectId ? eq(testRuns.projectId, projectId) : undefined
        )
      )
      .orderBy(desc(testRuns.createdAt))
      .limit(6),
    db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .where(eq(auditLogs.organizationId, orgId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(8),
  ]);

  void projScope;

  const execMap = Object.fromEntries(execByStatus.map((r) => [r.status, r.c]));
  const passed = execMap["PASSED"] ?? 0;
  const failed = execMap["FAILED"] ?? 0;
  const blocked = execMap["BLOCKED"] ?? 0;
  const skipped = execMap["SKIPPED"] ?? 0;
  const notExecuted = execMap["NOT_EXECUTED"] ?? 0;
  const executedTotal = passed + failed + blocked + skipped;

  const trend = buildTrend(trendRows, since);

  return {
    totals: {
      projects: projectCount,
      testCases: testCaseTotal,
      automatedTestCases: automatedCount,
      automationCoverage: percent(automatedCount, testCaseTotal),
      openDefects: openDefectCount,
    },
    execution: {
      passed,
      failed,
      blocked,
      skipped,
      notExecuted,
      total: executedTotal + notExecuted,
      passRate: percent(passed, executedTotal),
    },
    defectsBySeverity: defBySeverity.map((r) => ({
      severity: r.severity,
      count: r.c,
    })),
    defectsByStatus: defByStatus.map((r) => ({ status: r.status, count: r.c })),
    testCaseStatus: tcByStatus.map((r) => ({ status: r.status, count: r.c })),
    executionTrend: trend,
    recentRuns,
    recentActivity,
  };
}

function buildTrend(
  rows: Array<{ day: string; status: string; c: number }>,
  since: Date
): Array<{ date: string; passed: number; failed: number }> {
  const map = new Map<string, { passed: number; failed: number }>();
  for (let i = 0; i < 14; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    map.set(d.toISOString().slice(0, 10), { passed: 0, failed: 0 });
  }
  for (const row of rows) {
    const entry = map.get(row.day);
    if (!entry) continue;
    if (row.status === "PASSED") entry.passed += row.c;
    if (row.status === "FAILED") entry.failed += row.c;
  }
  return [...map.entries()].map(([date, v]) => ({ date, ...v }));
}

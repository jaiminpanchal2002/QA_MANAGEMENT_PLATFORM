import "server-only";
import { and, count, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { defects, projects, testCases, testExecutions } from "@/db/schema";
import { requireOrgContext } from "@/lib/auth/context";
import { percent } from "@/lib/utils";
import {
  getDashboardMetrics,
  type DashboardMetrics,
} from "@/features/dashboard/service";

/** One row of the per-project report table. All figures are tenant-scoped. */
export interface ProjectReportRow {
  id: string;
  name: string;
  key: string;
  testCases: number;
  automated: number;
  automationCoverage: number;
  passed: number;
  executed: number;
  passRate: number;
  openDefects: number;
}

export interface ReportsData {
  metrics: DashboardMetrics;
  projects: ProjectReportRow[];
}

const EXECUTED_STATUSES = new Set(["PASSED", "FAILED", "BLOCKED", "SKIPPED"]);

/**
 * Organization-wide QA reporting: the same real aggregations the dashboard
 * uses, plus a per-project breakdown (coverage, execution, pass rate, open
 * defects) computed with grouped SQL — no per-project N+1 queries.
 */
export async function getReportsData(): Promise<ReportsData> {
  const ctx = await requireOrgContext();
  const orgId = ctx.organizationId;

  const [metrics, projectRows, tcRows, execRows, defRows] = await Promise.all([
    getDashboardMetrics(),
    db
      .select({ id: projects.id, name: projects.name, key: projects.key })
      .from(projects)
      .where(
        and(eq(projects.organizationId, orgId), isNull(projects.deletedAt))
      )
      .orderBy(projects.name),
    db
      .select({
        projectId: testCases.projectId,
        total: count(),
        automated: sql<number>`count(*) filter (where ${testCases.automationStatus} = 'AUTOMATED')::int`,
      })
      .from(testCases)
      .where(
        and(eq(testCases.organizationId, orgId), isNull(testCases.deletedAt))
      )
      .groupBy(testCases.projectId),
    db
      .select({
        projectId: testExecutions.projectId,
        status: testExecutions.status,
        c: count(),
      })
      .from(testExecutions)
      .where(eq(testExecutions.organizationId, orgId))
      .groupBy(testExecutions.projectId, testExecutions.status),
    db
      .select({ projectId: defects.projectId, c: count() })
      .from(defects)
      .where(
        and(
          eq(defects.organizationId, orgId),
          isNull(defects.deletedAt),
          sql`${defects.status} in ('OPEN','IN_PROGRESS','REOPENED')`
        )
      )
      .groupBy(defects.projectId),
  ]);

  const tcMap = new Map(tcRows.map((r) => [r.projectId, r]));
  const defMap = new Map(defRows.map((r) => [r.projectId, r.c]));
  const execMap = new Map<string, { passed: number; executed: number }>();
  for (const r of execRows) {
    const e = execMap.get(r.projectId) ?? { passed: 0, executed: 0 };
    if (r.status === "PASSED") e.passed += r.c;
    if (EXECUTED_STATUSES.has(r.status)) e.executed += r.c;
    execMap.set(r.projectId, e);
  }

  const projectReports: ProjectReportRow[] = projectRows.map((p) => {
    const tc = tcMap.get(p.id);
    const ex = execMap.get(p.id) ?? { passed: 0, executed: 0 };
    const testCasesCount = tc?.total ?? 0;
    const automated = tc?.automated ?? 0;
    return {
      id: p.id,
      name: p.name,
      key: p.key,
      testCases: testCasesCount,
      automated,
      automationCoverage: percent(automated, testCasesCount),
      passed: ex.passed,
      executed: ex.executed,
      passRate: percent(ex.passed, ex.executed),
      openDefects: defMap.get(p.id) ?? 0,
    };
  });

  return { metrics, projects: projectReports };
}

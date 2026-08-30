import "server-only";
import { z } from "zod";
import { requireOrgContext } from "@/lib/auth/context";
import { buildPageMeta } from "@/lib/validation/common";
import * as repo from "@/server/repositories/workspace-repository";
import {
  defects,
  testCases,
  testRuns,
} from "@/db/schema";

const pageInt = z.coerce.number().int().min(1).default(1);

/** Org-wide Test Case library (search + status/priority filter + pagination). */
export async function getTestCaseLibrary(input: {
  page?: string;
  search?: string;
  status?: string;
  priority?: string;
}) {
  const ctx = await requireOrgContext();
  const page = pageInt.parse(input.page ?? 1);
  const pageSize = 20;
  const status = z
    .enum(testCases.status.enumValues)
    .optional()
    .catch(undefined)
    .parse(input.status || undefined);
  const priority = z
    .enum(testCases.priority.enumValues)
    .optional()
    .catch(undefined)
    .parse(input.priority || undefined);

  const { rows, total } = await repo.listOrgTestCases({
    organizationId: ctx.organizationId,
    page,
    pageSize,
    search: input.search?.trim() || undefined,
    status,
    priority,
  });
  return { rows, meta: buildPageMeta(page, pageSize, total) };
}

/** Org-wide Defect triage (status summary + search + severity/status filter). */
export async function getDefectTriage(input: {
  page?: string;
  search?: string;
  status?: string;
  severity?: string;
}) {
  const ctx = await requireOrgContext();
  const page = pageInt.parse(input.page ?? 1);
  const pageSize = 20;
  const status = z
    .enum(defects.status.enumValues)
    .optional()
    .catch(undefined)
    .parse(input.status || undefined);
  const severity = z
    .enum(defects.severity.enumValues)
    .optional()
    .catch(undefined)
    .parse(input.severity || undefined);

  const [{ rows, total }, summary] = await Promise.all([
    repo.listOrgDefects({
      organizationId: ctx.organizationId,
      page,
      pageSize,
      search: input.search?.trim() || undefined,
      status,
      severity,
    }),
    repo.defectStatusSummary(ctx.organizationId),
  ]);
  return { rows, summary, meta: buildPageMeta(page, pageSize, total) };
}

/** Org-wide Test Run activity feed (status filter + pagination). */
export async function getRunActivity(input: {
  page?: string;
  status?: string;
}) {
  const ctx = await requireOrgContext();
  const page = pageInt.parse(input.page ?? 1);
  const pageSize = 15;
  const status = z
    .enum(testRuns.status.enumValues)
    .optional()
    .catch(undefined)
    .parse(input.status || undefined);

  const { rows, total } = await repo.listOrgTestRuns({
    organizationId: ctx.organizationId,
    page,
    pageSize,
    status,
  });
  return { rows, meta: buildPageMeta(page, pageSize, total) };
}

/** Planning overview: per-project coverage. */
export async function getPlanningOverview() {
  const ctx = await requireOrgContext();
  return repo.planningByProject(ctx.organizationId);
}

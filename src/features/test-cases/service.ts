import "server-only";
import { requireProjectPermission } from "@/lib/auth/context";
import { recordAudit } from "@/lib/audit/audit";
import { Errors } from "@/lib/errors";
import * as repo from "@/server/repositories/test-case-repository";
import { buildPageMeta } from "@/lib/validation/common";
import {
  createTestCaseSchema,
  listTestCasesSchema,
  type ListTestCasesInput,
} from "./schema";

/** Test case application service — always project-scoped + permission-checked. */
export async function listTestCasesService(projectId: string, input: unknown) {
  const ctx = await requireProjectPermission(projectId, "testcase.view");
  const params: ListTestCasesInput = listTestCasesSchema.parse(input);

  const { rows, total } = await repo.listTestCases({
    organizationId: ctx.organizationId,
    projectId,
    page: params.page,
    pageSize: params.pageSize,
    search: params.search,
    status: params.status,
    priority: params.priority,
    type: params.type,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  });

  return { data: rows, meta: buildPageMeta(params.page, params.pageSize, total) };
}

export async function getTestCaseService(projectId: string, id: string) {
  const ctx = await requireProjectPermission(projectId, "testcase.view");
  const testCase = await repo.getTestCaseById(ctx.organizationId, id);
  if (!testCase || testCase.projectId !== projectId) {
    throw Errors.notFound("Test case not found");
  }
  return testCase;
}

export async function createTestCaseService(projectId: string, input: unknown) {
  const ctx = await requireProjectPermission(projectId, "testcase.create");
  const data = createTestCaseSchema.parse(input);

  const testCase = await repo.createTestCase({
    organizationId: ctx.organizationId,
    projectId,
    title: data.title,
    description: data.description,
    preconditions: data.preconditions,
    expectedResult: data.expectedResult,
    priority: data.priority,
    severity: data.severity,
    type: data.type,
    status: data.status,
    automationStatus: data.automationStatus,
    component: data.component,
    tags: data.tags,
    assignedTo: data.assignedTo,
    requirementId: data.requirementId,
    createdBy: ctx.user.id,
    steps: data.steps,
  });

  await recordAudit({
    organizationId: ctx.organizationId,
    actorId: ctx.user.id,
    action: "testcase.created",
    entityType: "test_case",
    entityId: testCase.id,
    metadata: { reference: testCase.reference, title: testCase.title },
  });

  return testCase;
}

export async function deleteTestCaseService(projectId: string, id: string) {
  const ctx = await requireProjectPermission(projectId, "testcase.delete");
  const deleted = await repo.softDeleteTestCase(ctx.organizationId, id);
  if (!deleted) throw Errors.notFound("Test case not found");

  await recordAudit({
    organizationId: ctx.organizationId,
    actorId: ctx.user.id,
    action: "testcase.deleted",
    entityType: "test_case",
    entityId: id,
  });

  return { id };
}

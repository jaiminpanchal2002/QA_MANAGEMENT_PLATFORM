import "server-only";
import { requireProjectPermission } from "@/lib/auth/context";
import { recordAudit } from "@/lib/audit/audit";
import { Errors } from "@/lib/errors";
import { buildPageMeta } from "@/lib/validation/common";
import * as repo from "@/server/repositories/defect-repository";
import {
  createDefectSchema,
  listDefectsSchema,
  updateDefectStatusSchema,
  type ListDefectsInput,
} from "./schema";

/** Defect application service — always project-scoped + permission-checked. */
export async function listDefectsService(projectId: string, input: unknown) {
  const ctx = await requireProjectPermission(projectId, "defect.view");
  const params: ListDefectsInput = listDefectsSchema.parse(input);

  const { rows, total } = await repo.listDefects({
    organizationId: ctx.organizationId,
    projectId,
    page: params.page,
    pageSize: params.pageSize,
    search: params.search,
    status: params.status,
    severity: params.severity,
  });

  return { data: rows, meta: buildPageMeta(params.page, params.pageSize, total) };
}

export async function createDefectService(projectId: string, input: unknown) {
  const ctx = await requireProjectPermission(projectId, "defect.create");
  const data = createDefectSchema.parse(input);

  const defect = await repo.createDefect({
    organizationId: ctx.organizationId,
    projectId,
    title: data.title,
    description: data.description,
    priority: data.priority,
    severity: data.severity,
    environment: data.environment,
    stepsToReproduce: data.stepsToReproduce,
    expectedResult: data.expectedResult,
    actualResult: data.actualResult,
    assignedTo: data.assignedTo,
    reportedBy: ctx.user.id,
    testExecutionId: data.testExecutionId,
  });

  await recordAudit({
    organizationId: ctx.organizationId,
    actorId: ctx.user.id,
    action: "defect.created",
    entityType: "defect",
    entityId: defect.id,
    metadata: { reference: defect.reference, title: defect.title },
  });

  return defect;
}

export async function updateDefectStatusService(
  projectId: string,
  defectId: string,
  input: unknown
) {
  const ctx = await requireProjectPermission(projectId, "defect.update");
  const { status } = updateDefectStatusSchema.parse(input);

  // Ensure the defect belongs to the permission-checked project (prevents
  // same-tenant cross-project id substitution).
  const existing = await repo.getDefectById(ctx.organizationId, defectId);
  if (!existing || existing.projectId !== projectId) {
    throw Errors.notFound("Defect not found");
  }

  const updated = await repo.updateDefectStatus(
    ctx.organizationId,
    defectId,
    status
  );
  if (!updated) throw Errors.notFound("Defect not found");

  await recordAudit({
    organizationId: ctx.organizationId,
    actorId: ctx.user.id,
    action: "defect.status_changed",
    entityType: "defect",
    entityId: defectId,
    metadata: { reference: updated.reference, status },
  });

  return updated;
}

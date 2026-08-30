import "server-only";
import {
  requireOrgContext,
  requireOrgPermission,
  requireProjectPermission,
} from "@/lib/auth/context";
import { can } from "@/lib/authorization/rbac";
import { recordAudit } from "@/lib/audit/audit";
import { Errors } from "@/lib/errors";
import * as repo from "@/server/repositories/project-repository";
import {
  createProjectSchema,
  listProjectsSchema,
  updateProjectSchema,
  type CreateProjectInput,
  type ListProjectsInput,
  type UpdateProjectInput,
} from "./schema";
import { buildPageMeta } from "@/lib/validation/common";

/**
 * Projects application service.
 *
 * Every method establishes the trusted auth/tenant context first, then calls
 * the tenant-scoped repository. Callers (route handlers, server actions, UI)
 * never pass an organizationId — it is derived from the session, so the client
 * can never target another tenant.
 */
export async function listProjectsService(input: unknown) {
  const ctx = await requireOrgContext();
  const params: ListProjectsInput = listProjectsSchema.parse(input);

  const { rows, total } = await repo.listProjects({
    organizationId: ctx.organizationId,
    page: params.page,
    pageSize: params.pageSize,
    search: params.search,
    status: params.status,
  });

  return {
    data: rows,
    meta: buildPageMeta(params.page, params.pageSize, total),
  };
}

export async function getProjectService(projectId: string) {
  // Enforces tenant + project-view permission (404 for cross-tenant IDs).
  const ctx = await requireProjectPermission(projectId, "project.view");
  const project = await repo.getProjectById(ctx.organizationId, projectId);
  if (!project) throw Errors.notFound("Project not found");
  return project;
}

/**
 * Project detail + the caller's write capabilities, so the workspace can hide
 * actions the user can't perform (read-only members see no create/edit
 * controls, rather than buttons that fail server-side).
 */
export async function getProjectWorkspaceService(projectId: string) {
  const ctx = await requireProjectPermission(projectId, "project.view");
  const project = await repo.getProjectById(ctx.organizationId, projectId);
  if (!project) throw Errors.notFound("Project not found");

  const perms = { orgRole: ctx.orgRole, projectRole: ctx.projectRole };
  return {
    project,
    canCreateTestCase: can(perms, "testcase.create"),
    canCreateDefect: can(perms, "defect.create"),
    canUpdateDefect: can(perms, "defect.update"),
  };
}

export async function createProjectService(input: unknown) {
  const ctx = await requireOrgPermission("project.create");
  const data: CreateProjectInput = createProjectSchema.parse(input);

  if (await repo.projectKeyExists(ctx.organizationId, data.key)) {
    throw Errors.conflict(`Project key "${data.key}" is already in use`);
  }

  const project = await repo.createProject({
    organizationId: ctx.organizationId,
    name: data.name,
    key: data.key,
    description: data.description ?? null,
    ownerId: ctx.user.id,
  });

  await recordAudit({
    organizationId: ctx.organizationId,
    actorId: ctx.user.id,
    action: "project.created",
    entityType: "project",
    entityId: project.id,
    metadata: { key: project.key, name: project.name },
  });

  return project;
}

export async function updateProjectService(
  projectId: string,
  input: unknown
) {
  const ctx = await requireProjectPermission(projectId, "project.update");
  const data: UpdateProjectInput = updateProjectSchema.parse(input);

  const updated = await repo.updateProject(ctx.organizationId, projectId, {
    name: data.name,
    description: data.description,
    status: data.status,
  });
  if (!updated) throw Errors.notFound("Project not found");

  await recordAudit({
    organizationId: ctx.organizationId,
    actorId: ctx.user.id,
    action: "project.updated",
    entityType: "project",
    entityId: projectId,
    metadata: { changes: data },
  });

  return updated;
}

export async function deleteProjectService(projectId: string) {
  const ctx = await requireProjectPermission(projectId, "project.delete");
  const deleted = await repo.softDeleteProject(ctx.organizationId, projectId);
  if (!deleted) throw Errors.notFound("Project not found");

  await recordAudit({
    organizationId: ctx.organizationId,
    actorId: ctx.user.id,
    action: "project.deleted",
    entityType: "project",
    entityId: projectId,
  });

  return { id: projectId };
}

import type { NextRequest } from "next/server";
import { handle, noContent, ok } from "@/server/http";
import {
  deleteProjectService,
  getProjectService,
  updateProjectService,
} from "@/features/projects/service";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/v1/projects/:id — tenant + permission enforced (404 cross-tenant). */
export const GET = handle(async (_req: NextRequest, ctx: Ctx) => {
  const { id } = await ctx.params;
  const project = await getProjectService(id);
  return ok(project);
});

/** PATCH /api/v1/projects/:id — update (requires project.update). */
export const PATCH = handle(async (req: NextRequest, ctx: Ctx) => {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const project = await updateProjectService(id, body);
  return ok(project);
});

/** DELETE /api/v1/projects/:id — soft delete (requires project.delete). */
export const DELETE = handle(async (_req: NextRequest, ctx: Ctx) => {
  const { id } = await ctx.params;
  await deleteProjectService(id);
  return noContent();
});

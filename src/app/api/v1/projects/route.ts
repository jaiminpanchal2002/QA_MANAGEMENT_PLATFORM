import type { NextRequest } from "next/server";
import { created, handle, ok } from "@/server/http";
import { searchParamsToObject } from "@/lib/validation/common";
import {
  createProjectService,
  listProjectsService,
} from "@/features/projects/service";
import { clientKey, writeApiLimiter } from "@/lib/security/rate-limit";

/**
 * GET /api/v1/projects
 * List projects in the caller's active organization (server-side pagination,
 * search, status filter). Auth + tenant scoping enforced in the service.
 */
export const GET = handle(async (req: NextRequest) => {
  const query = searchParamsToObject(req.nextUrl.searchParams);
  const { data, meta } = await listProjectsService(query);
  return ok(data, meta);
});

/**
 * POST /api/v1/projects
 * Create a project (requires project.create). Body validated with Zod.
 */
export const POST = handle(async (req: NextRequest) => {
  writeApiLimiter.check(clientKey(req.headers, "projects-write"));
  const body = await req.json().catch(() => ({}));
  const project = await createProjectService(body);
  return created(project);
});

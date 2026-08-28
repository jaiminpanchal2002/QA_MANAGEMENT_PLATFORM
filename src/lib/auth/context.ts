import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import {
  memberships,
  organizations,
  projectMembers,
  projects,
} from "@/db/schema";
import { auth } from "./auth";
import { Errors } from "@/lib/errors";
import { can } from "@/lib/authorization/rbac";
import type {
  OrgRole,
  Permission,
  ProjectRole,
} from "@/lib/authorization/permissions";

export const ACTIVE_ORG_COOKIE = "qa_active_org";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
}

export interface OrgContext {
  user: SessionUser;
  organizationId: string;
  organizationName: string;
  orgRole: OrgRole;
}

export interface ProjectContext extends OrgContext {
  projectId: string;
  projectRole: ProjectRole | null;
}

/**
 * Resolve the current Better Auth session. Memoized per-request so multiple
 * guards in one render/action don't re-hit the session store.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;
  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    emailVerified: session.user.emailVerified,
    image: session.user.image,
  };
});

/** Throw 401 if the request is not authenticated. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw Errors.unauthenticated();
  return user;
}

/** All (non-deleted) organizations the user belongs to, with their role. */
export const getUserOrganizations = cache(async (userId: string) => {
  return db
    .select({
      organizationId: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      role: memberships.role,
    })
    .from(memberships)
    .innerJoin(
      organizations,
      eq(memberships.organizationId, organizations.id)
    )
    .where(
      and(eq(memberships.userId, userId), isNull(organizations.deletedAt))
    )
    .orderBy(organizations.createdAt);
});

/**
 * Resolve the active organization context.
 *
 * The active org is chosen from a cookie, but ALWAYS validated against the
 * user's real memberships — a client-supplied cookie can never grant access
 * to an org the user does not belong to. Falls back to the first membership.
 * Returns null when the user has no organization yet (onboarding).
 */
export async function getOrgContext(): Promise<OrgContext | null> {
  const user = await getSessionUser();
  if (!user) return null;

  const orgs = await getUserOrganizations(user.id);
  if (orgs.length === 0) return null;

  const cookieStore = await cookies();
  const requested = cookieStore.get(ACTIVE_ORG_COOKIE)?.value;
  const active =
    orgs.find((o) => o.organizationId === requested) ?? orgs[0]!;

  return {
    user,
    organizationId: active.organizationId,
    organizationName: active.name,
    orgRole: active.role,
  };
}

/** Throw 401/403 unless the user has an active organization. */
export async function requireOrgContext(): Promise<OrgContext> {
  const user = await requireUser();
  const ctx = await getOrgContext();
  if (!ctx) {
    throw Errors.forbidden("You are not a member of any organization");
  }
  return { ...ctx, user };
}

/** Require an org-level permission; throws 403 if missing. */
export async function requireOrgPermission(
  permission: Permission
): Promise<OrgContext> {
  const ctx = await requireOrgContext();
  if (!can({ orgRole: ctx.orgRole }, permission)) {
    throw Errors.forbidden(`Missing permission: ${permission}`);
  }
  return ctx;
}

/**
 * Load a project scoped to the caller's organization and resolve their
 * effective project role. Returns null if the project does not exist *in this
 * tenant* — cross-tenant IDs are indistinguishable from non-existent ones,
 * which prevents existence-leaking (IDOR) via 404-vs-403.
 */
async function loadProjectInOrg(organizationId: string, projectId: string) {
  const rows = await db
    .select({ id: projects.id, name: projects.name })
    .from(projects)
    .where(
      and(
        eq(projects.id, projectId),
        eq(projects.organizationId, organizationId),
        isNull(projects.deletedAt)
      )
    )
    .limit(1);
  return rows[0] ?? null;
}

async function getProjectRole(
  projectId: string,
  userId: string
): Promise<ProjectRole | null> {
  const rows = await db
    .select({ role: projectMembers.role })
    .from(projectMembers)
    .where(
      and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, userId)
      )
    )
    .limit(1);
  return rows[0]?.role ?? null;
}

/**
 * The primary IDOR guard for project-scoped resources. Verifies, in order:
 *   1. authentication
 *   2. active organization membership
 *   3. the project belongs to that organization (else 404)
 *   4. the caller holds `permission` for the project (else 403)
 */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function requireProjectPermission(
  projectId: string,
  permission: Permission
): Promise<ProjectContext> {
  const ctx = await requireOrgContext();

  // Reject malformed ids before they reach the DB (a non-UUID would raise a
  // Postgres type error → 500). Treated as not-found to avoid leaking anything.
  if (!UUID_RE.test(projectId)) throw Errors.notFound("Project not found");

  const project = await loadProjectInOrg(ctx.organizationId, projectId);
  if (!project) throw Errors.notFound("Project not found");

  const projectRole = await getProjectRole(projectId, ctx.user.id);

  if (!can({ orgRole: ctx.orgRole, projectRole }, permission)) {
    throw Errors.forbidden(`Missing permission: ${permission}`);
  }

  return { ...ctx, projectId, projectRole };
}

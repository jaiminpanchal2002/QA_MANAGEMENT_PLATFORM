import {
  isOrgPermission,
  ORG_ROLE_PERMISSIONS,
  PROJECT_ROLE_PERMISSIONS,
  type OrgPermission,
  type OrgRole,
  type Permission,
  type ProjectPermission,
  type ProjectRole,
} from "./permissions";

/**
 * Pure, side-effect-free RBAC evaluation. These functions never touch the
 * database or session — they only answer "does this role grant this
 * permission?". The trusted server layer (./context.ts) loads roles from the
 * DB and calls these. Keeping evaluation pure makes it exhaustively testable.
 */

export function hasOrgPermission(
  role: OrgRole,
  permission: OrgPermission
): boolean {
  return ORG_ROLE_PERMISSIONS[role].includes(permission);
}

export function hasProjectPermission(
  projectRole: ProjectRole,
  permission: ProjectPermission
): boolean {
  return PROJECT_ROLE_PERMISSIONS[projectRole].includes(permission);
}

/**
 * Resolve a permission given the caller's org role and (optionally) their
 * project role. Org OWNER/ADMIN implicitly hold every project permission so
 * they can administer any project in their tenant.
 */
export function can(
  input: {
    orgRole: OrgRole;
    projectRole?: ProjectRole | null;
  },
  permission: Permission
): boolean {
  if (isOrgPermission(permission)) {
    return hasOrgPermission(input.orgRole, permission);
  }

  // Project-scoped permission.
  if (input.orgRole === "OWNER" || input.orgRole === "ADMIN") return true;
  if (!input.projectRole) return false;
  return hasProjectPermission(input.projectRole, permission);
}

/** Whether an org role can administer members / roles. */
export function canManageMembers(role: OrgRole): boolean {
  return hasOrgPermission(role, "organization.manage_members");
}

/**
 * Guard against privilege escalation: a caller can only assign a role at or
 * below their own level. OWNER > ADMIN > MEMBER > VIEWER.
 */
const ORG_ROLE_RANK: Record<OrgRole, number> = {
  OWNER: 4,
  ADMIN: 3,
  MEMBER: 2,
  VIEWER: 1,
};

export function canAssignOrgRole(
  actorRole: OrgRole,
  targetRole: OrgRole
): boolean {
  // Only OWNER may grant OWNER.
  if (targetRole === "OWNER") return actorRole === "OWNER";
  return ORG_ROLE_RANK[actorRole] >= ORG_ROLE_RANK[targetRole] &&
    canManageMembers(actorRole);
}

export function orgRoleRank(role: OrgRole): number {
  return ORG_ROLE_RANK[role];
}

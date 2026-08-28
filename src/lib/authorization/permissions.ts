/**
 * Centralized permission catalog.
 *
 * Every authorization decision in the app resolves to one of these permission
 * strings. Permissions are never checked ad-hoc in components — UI and API
 * both call the RBAC helpers in ./rbac.ts, which read the role→permission
 * maps defined here. This is the single source of truth for the RBAC matrix.
 */

export const ORG_ROLES = ["OWNER", "ADMIN", "MEMBER", "VIEWER"] as const;
export type OrgRole = (typeof ORG_ROLES)[number];

export const PROJECT_ROLES = [
  "PROJECT_ADMIN",
  "QA_LEAD",
  "QA_ENGINEER",
  "DEVELOPER",
  "VIEWER",
] as const;
export type ProjectRole = (typeof PROJECT_ROLES)[number];

/** Permissions resolved purely by organization role. */
export const ORG_PERMISSIONS = [
  "organization.view",
  "organization.update",
  "organization.delete",
  "organization.manage_members",
  "team.view",
  "team.create",
  "team.update",
  "team.delete",
  "project.create",
  "integration.manage",
  "audit.view",
  "settings.update",
] as const;
export type OrgPermission = (typeof ORG_PERMISSIONS)[number];

/**
 * Permissions resolved by project role (with org OWNER/ADMIN overriding to
 * full project access). These govern data inside a specific project.
 */
export const PROJECT_PERMISSIONS = [
  "project.view",
  "project.update",
  "project.delete",
  "requirement.view",
  "requirement.create",
  "requirement.update",
  "requirement.delete",
  "testsuite.view",
  "testsuite.create",
  "testsuite.update",
  "testsuite.delete",
  "testcase.view",
  "testcase.create",
  "testcase.update",
  "testcase.delete",
  "testcase.execute",
  "testplan.view",
  "testplan.create",
  "testplan.update",
  "testplan.delete",
  "testrun.view",
  "testrun.create",
  "testrun.execute",
  "testrun.cancel",
  "defect.view",
  "defect.create",
  "defect.update",
  "defect.assign",
  "defect.delete",
  "comment.view",
  "comment.create",
  "attachment.view",
  "attachment.create",
  "attachment.delete",
  "report.view",
  "report.export",
] as const;
export type ProjectPermission = (typeof PROJECT_PERMISSIONS)[number];

export type Permission = OrgPermission | ProjectPermission;

// --- Organization role → org permissions ----------------------------------
export const ORG_ROLE_PERMISSIONS: Record<OrgRole, readonly OrgPermission[]> = {
  OWNER: [
    "organization.view",
    "organization.update",
    "organization.delete",
    "organization.manage_members",
    "team.view",
    "team.create",
    "team.update",
    "team.delete",
    "project.create",
    "integration.manage",
    "audit.view",
    "settings.update",
  ],
  ADMIN: [
    "organization.view",
    "organization.update",
    "organization.manage_members",
    "team.view",
    "team.create",
    "team.update",
    "team.delete",
    "project.create",
    "integration.manage",
    "audit.view",
    "settings.update",
  ],
  MEMBER: ["organization.view", "team.view", "project.create"],
  VIEWER: ["organization.view", "team.view"],
};

// --- Project role → project permissions ------------------------------------
const PROJECT_ADMIN_PERMS: readonly ProjectPermission[] = [...PROJECT_PERMISSIONS];

const QA_LEAD_PERMS: readonly ProjectPermission[] = [
  "project.view",
  "project.update",
  "requirement.view",
  "requirement.create",
  "requirement.update",
  "requirement.delete",
  "testsuite.view",
  "testsuite.create",
  "testsuite.update",
  "testsuite.delete",
  "testcase.view",
  "testcase.create",
  "testcase.update",
  "testcase.delete",
  "testcase.execute",
  "testplan.view",
  "testplan.create",
  "testplan.update",
  "testplan.delete",
  "testrun.view",
  "testrun.create",
  "testrun.execute",
  "testrun.cancel",
  "defect.view",
  "defect.create",
  "defect.update",
  "defect.assign",
  "defect.delete",
  "comment.view",
  "comment.create",
  "attachment.view",
  "attachment.create",
  "attachment.delete",
  "report.view",
  "report.export",
];

const QA_ENGINEER_PERMS: readonly ProjectPermission[] = [
  "project.view",
  "requirement.view",
  "testsuite.view",
  "testsuite.create",
  "testsuite.update",
  "testcase.view",
  "testcase.create",
  "testcase.update",
  "testcase.execute",
  "testplan.view",
  "testplan.create",
  "testplan.update",
  "testrun.view",
  "testrun.create",
  "testrun.execute",
  "defect.view",
  "defect.create",
  "defect.update",
  "comment.view",
  "comment.create",
  "attachment.view",
  "attachment.create",
  "report.view",
];

const DEVELOPER_PERMS: readonly ProjectPermission[] = [
  "project.view",
  "requirement.view",
  "testsuite.view",
  "testcase.view",
  "testplan.view",
  "testrun.view",
  "defect.view",
  "defect.create",
  "defect.update",
  "comment.view",
  "comment.create",
  "attachment.view",
  "attachment.create",
  "report.view",
];

const PROJECT_VIEWER_PERMS: readonly ProjectPermission[] = [
  "project.view",
  "requirement.view",
  "testsuite.view",
  "testcase.view",
  "testplan.view",
  "testrun.view",
  "defect.view",
  "comment.view",
  "attachment.view",
  "report.view",
];

export const PROJECT_ROLE_PERMISSIONS: Record<
  ProjectRole,
  readonly ProjectPermission[]
> = {
  PROJECT_ADMIN: PROJECT_ADMIN_PERMS,
  QA_LEAD: QA_LEAD_PERMS,
  QA_ENGINEER: QA_ENGINEER_PERMS,
  DEVELOPER: DEVELOPER_PERMS,
  VIEWER: PROJECT_VIEWER_PERMS,
};

const ORG_PERMISSION_SET = new Set<string>(ORG_PERMISSIONS);

export function isOrgPermission(p: Permission): p is OrgPermission {
  return ORG_PERMISSION_SET.has(p);
}

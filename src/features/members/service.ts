import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { memberships, user } from "@/db/schema";
import { requireOrgContext, requireOrgPermission } from "@/lib/auth/context";
import { canAssignOrgRole } from "@/lib/authorization/rbac";
import type { OrgRole } from "@/lib/authorization/permissions";
import { recordAudit } from "@/lib/audit/audit";
import { Errors } from "@/lib/errors";
import * as repo from "@/server/repositories/organization-repository";
import {
  addMemberSchema,
  removeMemberSchema,
  updateMemberRoleSchema,
} from "./schema";

/** List members of the active organization (org.view is implicit for members). */
export async function listMembersService() {
  const ctx = await requireOrgContext();
  const rows = await db
    .select({
      id: memberships.id,
      userId: user.id,
      name: user.name,
      email: user.email,
      role: memberships.role,
      joinedAt: memberships.createdAt,
    })
    .from(memberships)
    .innerJoin(user, eq(memberships.userId, user.id))
    .where(eq(memberships.organizationId, ctx.organizationId))
    .orderBy(memberships.createdAt);

  return { members: rows, context: ctx };
}

/**
 * Add an existing user (looked up by email) to the active organization.
 *
 * Enforces, in order: manage-members permission → no privilege escalation
 * (you may only grant a role at/below your own) → the target account exists →
 * they are not already a member. Invitations for users without an account are
 * a separate flow (see the `invitations` table).
 */
export async function addMemberService(input: unknown) {
  const ctx = await requireOrgPermission("organization.manage_members");
  const data = addMemberSchema.parse(input);

  if (!canAssignOrgRole(ctx.orgRole, data.role)) {
    throw Errors.forbidden(`You cannot assign the ${data.role} role`);
  }

  const target = await repo.findUserByEmail(data.email);
  if (!target) {
    throw Errors.notFound(
      "No account uses that email. Ask them to sign up first, then add them."
    );
  }

  if (await repo.membershipExists(ctx.organizationId, target.id)) {
    throw Errors.conflict("That user is already a member of this organization");
  }

  const membership = await repo.addMembership({
    organizationId: ctx.organizationId,
    userId: target.id,
    role: data.role,
  });

  await recordAudit({
    organizationId: ctx.organizationId,
    actorId: ctx.user.id,
    action: "member.added",
    entityType: "membership",
    entityId: membership.id,
    metadata: { email: target.email, role: data.role },
  });

  return { id: membership.id };
}

/**
 * Load a membership in the active org and assert the actor is allowed to
 * administer it — i.e. the actor outranks (or equals, per policy) the target's
 * *current* role. Blocks an ADMIN from touching an OWNER, and self-service.
 */
async function loadManageableMember(
  ctx: Awaited<ReturnType<typeof requireOrgPermission>>,
  membershipId: string
) {
  const membership = await repo.getMembershipById(
    ctx.organizationId,
    membershipId
  );
  if (!membership) throw Errors.notFound("Member not found");

  if (membership.userId === ctx.user.id) {
    throw Errors.forbidden("You cannot change your own membership");
  }
  if (!canAssignOrgRole(ctx.orgRole, membership.role as OrgRole)) {
    throw Errors.forbidden("You cannot manage a member with a higher role");
  }
  return membership;
}

export async function updateMemberRoleService(input: unknown) {
  const ctx = await requireOrgPermission("organization.manage_members");
  const data = updateMemberRoleSchema.parse(input);

  const membership = await loadManageableMember(ctx, data.membershipId);

  if (!canAssignOrgRole(ctx.orgRole, data.role)) {
    throw Errors.forbidden(`You cannot assign the ${data.role} role`);
  }

  // Never leave an organization without an owner.
  if (
    membership.role === "OWNER" &&
    data.role !== "OWNER" &&
    (await repo.countOwners(ctx.organizationId, membership.id)) === 0
  ) {
    throw Errors.conflict(
      "This is the last owner — promote another owner first"
    );
  }

  const updated = await repo.updateMembershipRole(
    ctx.organizationId,
    data.membershipId,
    data.role
  );
  if (!updated) throw Errors.notFound("Member not found");

  await recordAudit({
    organizationId: ctx.organizationId,
    actorId: ctx.user.id,
    action: "member.role_updated",
    entityType: "membership",
    entityId: updated.id,
    metadata: { from: membership.role, to: data.role },
  });

  return { id: updated.id, role: updated.role };
}

export async function removeMemberService(input: unknown) {
  const ctx = await requireOrgPermission("organization.manage_members");
  const data = removeMemberSchema.parse(input);

  const membership = await loadManageableMember(ctx, data.membershipId);

  if (
    membership.role === "OWNER" &&
    (await repo.countOwners(ctx.organizationId, membership.id)) === 0
  ) {
    throw Errors.conflict("You cannot remove the organization's last owner");
  }

  const removed = await repo.deleteMembership(
    ctx.organizationId,
    data.membershipId
  );
  if (!removed) throw Errors.notFound("Member not found");

  await recordAudit({
    organizationId: ctx.organizationId,
    actorId: ctx.user.id,
    action: "member.removed",
    entityType: "membership",
    entityId: data.membershipId,
    metadata: { role: membership.role },
  });

  return { id: data.membershipId };
}

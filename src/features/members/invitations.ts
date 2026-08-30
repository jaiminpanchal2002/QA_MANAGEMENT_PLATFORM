import "server-only";
import { randomBytes } from "node:crypto";
import {
  requireOrgContext,
  requireOrgPermission,
  requireUser,
} from "@/lib/auth/context";
import { canAssignOrgRole } from "@/lib/authorization/rbac";
import { recordAudit } from "@/lib/audit/audit";
import { Errors } from "@/lib/errors";
import { mailer } from "@/lib/email/mailer";
import { invitationEmailHtml } from "@/lib/email/templates";
import { getRequestBaseUrl } from "@/lib/http/request-url";
import * as repo from "@/server/repositories/organization-repository";
import { addMemberSchema, removeMemberSchema } from "./schema";

const INVITE_TTL_DAYS = 7;

/**
 * Add an existing user OR invite a new one, from a single entry point.
 *
 * If an account already uses the email, they are added to the org immediately.
 * Otherwise a tokenized invitation is created and emailed; the recipient signs
 * up (setting their own password) and is added on acceptance. This is why an
 * admin never creates passwords for other people.
 */
export async function addOrInviteMemberService(
  input: unknown
): Promise<{ status: "added" | "invited"; email: string; delivered?: boolean }> {
  const ctx = await requireOrgPermission("organization.manage_members");
  const data = addMemberSchema.parse(input);

  if (!canAssignOrgRole(ctx.orgRole, data.role)) {
    throw Errors.forbidden(`You cannot assign the ${data.role} role`);
  }

  const existing = await repo.findUserByEmail(data.email);

  // Path 1 — the person already has an account: add them directly.
  if (existing) {
    if (await repo.membershipExists(ctx.organizationId, existing.id)) {
      throw Errors.conflict(
        "That user is already a member of this organization"
      );
    }
    const membership = await repo.addMembership({
      organizationId: ctx.organizationId,
      userId: existing.id,
      role: data.role,
    });
    await recordAudit({
      organizationId: ctx.organizationId,
      actorId: ctx.user.id,
      action: "member.added",
      entityType: "membership",
      entityId: membership.id,
      metadata: { email: data.email, role: data.role },
    });
    return { status: "added", email: data.email };
  }

  // Path 2 — no account yet: create + email an invitation.
  if (await repo.getPendingInvitationByEmail(ctx.organizationId, data.email)) {
    throw Errors.conflict("An invitation is already pending for that email");
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(
    Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000
  );
  const invitation = await repo.createInvitation({
    organizationId: ctx.organizationId,
    email: data.email,
    role: data.role,
    token,
    invitedBy: ctx.user.id,
    expiresAt,
  });

  const baseUrl = await getRequestBaseUrl();
  const { delivered } = await mailer.send({
    to: data.email,
    subject: `You're invited to ${ctx.organizationName} on QA Platform`,
    html: invitationEmailHtml({
      orgName: ctx.organizationName,
      inviterName: ctx.user.name || ctx.user.email,
      role: data.role,
      acceptUrl: `${baseUrl}/invitations/${token}`,
      ttlDays: INVITE_TTL_DAYS,
    }),
  });

  await recordAudit({
    organizationId: ctx.organizationId,
    actorId: ctx.user.id,
    action: "member.invited",
    entityType: "invitation",
    entityId: invitation.id,
    metadata: { email: data.email, role: data.role, delivered },
  });

  return { status: "invited", email: data.email, delivered };
}

/** Public-by-token: details the accept page needs to render an invitation. */
export async function getInvitationForToken(token: string) {
  const invitation = await repo.getInvitationByToken(token);
  if (!invitation) return null;

  const org = await repo.getOrganizationById(invitation.organizationId);
  const expired = invitation.expiresAt.getTime() < Date.now();
  const state: "pending" | "accepted" | "revoked" | "expired" =
    invitation.status === "ACCEPTED"
      ? "accepted"
      : invitation.status === "REVOKED"
        ? "revoked"
        : expired
          ? "expired"
          : "pending";

  return {
    email: invitation.email,
    role: invitation.role,
    organizationName: org?.name ?? "an organization",
    state,
  };
}

/**
 * Accept an invitation as the signed-in user. The session email must match the
 * invited address, so a link can't be used to join an org you weren't invited
 * to. Idempotent if you are already a member. Returns the organization id so
 * the caller can set it active.
 */
export async function acceptInvitationService(
  token: string
): Promise<{ organizationId: string }> {
  const ctx = await requireUser();
  const invitation = await repo.getInvitationByToken(token);
  if (!invitation || invitation.status === "REVOKED") {
    throw Errors.notFound("This invitation is no longer valid");
  }
  if (invitation.expiresAt.getTime() < Date.now()) {
    throw Errors.badRequest("This invitation has expired");
  }
  if (invitation.email.toLowerCase() !== ctx.email.toLowerCase()) {
    throw Errors.forbidden(
      `This invitation was sent to ${invitation.email}. Sign in with that email to accept.`
    );
  }

  if (!(await repo.membershipExists(invitation.organizationId, ctx.id))) {
    await repo.addMembership({
      organizationId: invitation.organizationId,
      userId: ctx.id,
      role: invitation.role,
    });
  }

  if (invitation.status !== "ACCEPTED") {
    await repo.markInvitationAccepted(invitation.id);
    await recordAudit({
      organizationId: invitation.organizationId,
      actorId: ctx.id,
      action: "member.invitation_accepted",
      entityType: "invitation",
      entityId: invitation.id,
      metadata: { email: invitation.email, role: invitation.role },
    });
  }

  return { organizationId: invitation.organizationId };
}

export async function listPendingInvitationsService() {
  const ctx = await requireOrgContext();
  const invites = await repo.listPendingInvitations(ctx.organizationId);
  return invites;
}

export async function revokeInvitationService(input: unknown) {
  const ctx = await requireOrgPermission("organization.manage_members");
  const { membershipId: id } = removeMemberSchema.parse(input);
  const revoked = await repo.revokeInvitation(ctx.organizationId, id);
  if (!revoked) throw Errors.notFound("Invitation not found");
  await recordAudit({
    organizationId: ctx.organizationId,
    actorId: ctx.user.id,
    action: "member.invitation_revoked",
    entityType: "invitation",
    entityId: id,
  });
  return { id };
}

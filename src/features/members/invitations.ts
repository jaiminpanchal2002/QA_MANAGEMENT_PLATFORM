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
import { publicEnv } from "@/lib/env";
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

  const { delivered } = await mailer.send({
    to: data.email,
    subject: `You're invited to ${ctx.organizationName} on QA Platform`,
    html: invitationEmail({
      orgName: ctx.organizationName,
      inviterName: ctx.user.name || ctx.user.email,
      role: data.role,
      acceptUrl: `${publicEnv.NEXT_PUBLIC_APP_URL}/invitations/${token}`,
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

function invitationEmail(opts: {
  orgName: string;
  inviterName: string;
  role: string;
  acceptUrl: string;
}): string {
  const org = escapeHtml(opts.orgName);
  const inviter = escapeHtml(opts.inviterName);
  return `
    <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:480px;margin:auto;color:#0f172a">
      <h2 style="margin:0 0 8px">You've been invited to ${org}</h2>
      <p style="color:#475569;margin:0 0 16px">
        ${inviter} invited you to join <strong>${org}</strong> on QA Platform
        as <strong>${escapeHtml(opts.role)}</strong>.
      </p>
      <p style="margin:0 0 24px">
        <a href="${opts.acceptUrl}"
           style="display:inline-block;background:#4f46e5;color:#fff;padding:11px 18px;border-radius:8px;text-decoration:none;font-weight:600">
          Accept invitation
        </a>
      </p>
      <p style="color:#64748b;font-size:12px;margin:0">
        Or paste this link into your browser:<br/>
        <span style="color:#4f46e5;word-break:break-all">${opts.acceptUrl}</span>
      </p>
      <p style="color:#94a3b8;font-size:12px;margin:16px 0 0">
        This invitation expires in ${INVITE_TTL_DAYS} days. If you didn't expect
        it, you can ignore this email.
      </p>
    </div>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

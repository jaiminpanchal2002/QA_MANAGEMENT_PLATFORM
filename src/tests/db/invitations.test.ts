// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { cleanupFixtures, hasDb, makeOrg, makeUser } from "./harness";
import * as repo from "@/server/repositories/organization-repository";

/**
 * DB-backed tests for the invitation lifecycle: create → lookup by token →
 * pending-by-email → accept, plus revoke. Skipped without DATABASE_URL.
 */
const d = hasDb ? describe : describe.skip;

d("invitation repository", () => {
  const ctx = { org: "", owner: "" };

  beforeAll(async () => {
    ctx.owner = await makeUser("Inv Owner");
    ctx.org = await makeOrg("Invite Org", ctx.owner);
  }, 60_000);

  afterAll(async () => {
    await cleanupFixtures();
  }, 60_000);

  it("creates an invitation and resolves it by token", async () => {
    const token = `tok_${Date.now()}`;
    const inv = await repo.createInvitation({
      organizationId: ctx.org,
      email: "newbie@example.com",
      role: "MEMBER",
      token,
      invitedBy: ctx.owner,
      expiresAt: new Date(Date.now() + 86_400_000),
    });
    expect(inv.status).toBe("PENDING");

    const byToken = await repo.getInvitationByToken(token);
    expect(byToken?.email).toBe("newbie@example.com");

    const pending = await repo.getPendingInvitationByEmail(
      ctx.org,
      "newbie@example.com"
    );
    expect(pending?.id).toBe(inv.id);

    const list = await repo.listPendingInvitations(ctx.org);
    expect(list.some((r) => r.id === inv.id)).toBe(true);
  });

  it("marks an invitation accepted (no longer pending)", async () => {
    const token = `tok_accept_${Date.now()}`;
    const inv = await repo.createInvitation({
      organizationId: ctx.org,
      email: "accepts@example.com",
      role: "VIEWER",
      token,
      invitedBy: ctx.owner,
      expiresAt: new Date(Date.now() + 86_400_000),
    });
    await repo.markInvitationAccepted(inv.id);

    const after = await repo.getInvitationByToken(token);
    expect(after?.status).toBe("ACCEPTED");
    expect(
      await repo.getPendingInvitationByEmail(ctx.org, "accepts@example.com")
    ).toBeNull();
  });

  it("revokes a pending invitation (org-scoped)", async () => {
    const token = `tok_revoke_${Date.now()}`;
    const inv = await repo.createInvitation({
      organizationId: ctx.org,
      email: "revoke@example.com",
      role: "MEMBER",
      token,
      invitedBy: ctx.owner,
      expiresAt: new Date(Date.now() + 86_400_000),
    });
    // Wrong org can't revoke it.
    const otherOrg = await makeOrg("Other Invite Org", ctx.owner);
    expect(await repo.revokeInvitation(otherOrg, inv.id)).toBe(false);
    // Correct org can.
    expect(await repo.revokeInvitation(ctx.org, inv.id)).toBe(true);
    expect(
      await repo.getPendingInvitationByEmail(ctx.org, "revoke@example.com")
    ).toBeNull();
  });
});

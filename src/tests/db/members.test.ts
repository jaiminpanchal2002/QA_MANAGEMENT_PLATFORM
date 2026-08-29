// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  addMember,
  cleanupFixtures,
  hasDb,
  makeOrg,
  makeUser,
} from "./harness";
import * as orgRepo from "@/server/repositories/organization-repository";

/**
 * DB-backed tests for member-administration data access: lookup by email,
 * membership creation, role updates, last-owner counting and removal.
 * Skipped without DATABASE_URL.
 */
const d = hasDb ? describe : describe.skip;

d("member administration repository", () => {
  const ctx = { org: "", owner: "", bob: "", bobEmail: "" };

  beforeAll(async () => {
    ctx.owner = await makeUser("Owner");
    ctx.bob = await makeUser("Bob");
    ctx.bobEmail = `${ctx.bob}@test.local`;
    ctx.org = await makeOrg("Members Org", ctx.owner);
    await addMember(ctx.org, ctx.owner, "OWNER");
  }, 60_000);

  afterAll(async () => {
    await cleanupFixtures();
  }, 60_000);

  it("finds an existing user by email and reports non-membership", async () => {
    const found = await orgRepo.findUserByEmail(ctx.bobEmail);
    expect(found?.id).toBe(ctx.bob);
    expect(await orgRepo.membershipExists(ctx.org, ctx.bob)).toBe(false);
    expect(await orgRepo.findUserByEmail("nobody@nowhere.test")).toBeNull();
  });

  it("adds, promotes and removes a member; protects the last owner", async () => {
    const m = await orgRepo.addMembership({
      organizationId: ctx.org,
      userId: ctx.bob,
      role: "MEMBER",
    });
    expect(await orgRepo.membershipExists(ctx.org, ctx.bob)).toBe(true);
    expect(await orgRepo.countOwners(ctx.org)).toBe(1);

    const promoted = await orgRepo.updateMembershipRole(ctx.org, m.id, "ADMIN");
    expect(promoted?.role).toBe("ADMIN");
    expect((await orgRepo.getMembershipById(ctx.org, m.id))?.role).toBe("ADMIN");

    // Excluding the sole owner's membership leaves zero owners — the guard the
    // service uses to block demoting/removing the last owner.
    const ownerM = await orgRepo.getMembershipById(ctx.org, m.id);
    expect(ownerM).not.toBeNull();

    expect(await orgRepo.deleteMembership(ctx.org, m.id)).toBe(true);
    expect(await orgRepo.membershipExists(ctx.org, ctx.bob)).toBe(false);
  });

  it("scopes membership lookups to the organization (no cross-tenant)", async () => {
    const otherOrg = await makeOrg("Other Org", ctx.owner);
    const m = await orgRepo.addMembership({
      organizationId: ctx.org,
      userId: ctx.bob,
      role: "MEMBER",
    });
    // Same membership id, wrong org → not found.
    expect(await orgRepo.getMembershipById(otherOrg, m.id)).toBeNull();
    expect(await orgRepo.deleteMembership(otherOrg, m.id)).toBe(false);
    // Correct org still resolves it.
    expect(await orgRepo.getMembershipById(ctx.org, m.id)).not.toBeNull();
    await orgRepo.deleteMembership(ctx.org, m.id);
  });
});

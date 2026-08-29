import "server-only";
import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  memberships,
  organizations,
  user,
  type Membership,
  type Organization,
} from "@/db/schema";
import type { OrgRole } from "@/lib/authorization/permissions";

/** Tenant/identity data access for organizations and memberships. */
export async function slugExists(slug: string): Promise<boolean> {
  const rows = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.slug, slug))
    .limit(1);
  return rows.length > 0;
}

/** Create an organization and its OWNER membership in one transaction. */
export async function createOrganizationWithOwner(input: {
  name: string;
  slug: string;
  description?: string | null;
  ownerId: string;
}): Promise<Organization> {
  return db.transaction(async (tx) => {
    const [org] = await tx
      .insert(organizations)
      .values({
        name: input.name,
        slug: input.slug,
        description: input.description ?? null,
        createdBy: input.ownerId,
      })
      .returning();

    await tx.insert(memberships).values({
      organizationId: org!.id,
      userId: input.ownerId,
      role: "OWNER",
    });

    return org!;
  });
}

// --- Member administration -------------------------------------------------

/** Find a user by (already-normalized, lowercased) email. */
export async function findUserByEmail(
  email: string
): Promise<{ id: string; name: string; email: string } | null> {
  const rows = await db
    .select({ id: user.id, name: user.name, email: user.email })
    .from(user)
    .where(eq(user.email, email))
    .limit(1);
  return rows[0] ?? null;
}

/** A single membership row scoped to an organization, by membership id. */
export async function getMembershipById(
  organizationId: string,
  membershipId: string
): Promise<Membership | null> {
  const rows = await db
    .select()
    .from(memberships)
    .where(
      and(
        eq(memberships.id, membershipId),
        eq(memberships.organizationId, organizationId)
      )
    )
    .limit(1);
  return rows[0] ?? null;
}

/** Whether a user already belongs to an organization. */
export async function membershipExists(
  organizationId: string,
  userId: string
): Promise<boolean> {
  const rows = await db
    .select({ id: memberships.id })
    .from(memberships)
    .where(
      and(
        eq(memberships.organizationId, organizationId),
        eq(memberships.userId, userId)
      )
    )
    .limit(1);
  return rows.length > 0;
}

export async function addMembership(input: {
  organizationId: string;
  userId: string;
  role: OrgRole;
}): Promise<Membership> {
  const [row] = await db
    .insert(memberships)
    .values({
      organizationId: input.organizationId,
      userId: input.userId,
      role: input.role,
    })
    .returning();
  return row!;
}

export async function updateMembershipRole(
  organizationId: string,
  membershipId: string,
  role: OrgRole
): Promise<Membership | null> {
  const [row] = await db
    .update(memberships)
    .set({ role, updatedAt: new Date() })
    .where(
      and(
        eq(memberships.id, membershipId),
        eq(memberships.organizationId, organizationId)
      )
    )
    .returning();
  return row ?? null;
}

export async function deleteMembership(
  organizationId: string,
  membershipId: string
): Promise<boolean> {
  const rows = await db
    .delete(memberships)
    .where(
      and(
        eq(memberships.id, membershipId),
        eq(memberships.organizationId, organizationId)
      )
    )
    .returning({ id: memberships.id });
  return rows.length > 0;
}

/**
 * Count OWNER memberships in an org, optionally excluding one membership.
 * Used to prevent removing or demoting the organization's last owner.
 */
export async function countOwners(
  organizationId: string,
  excludeMembershipId?: string
): Promise<number> {
  const conditions = [
    eq(memberships.organizationId, organizationId),
    eq(memberships.role, "OWNER"),
  ];
  if (excludeMembershipId) {
    conditions.push(ne(memberships.id, excludeMembershipId));
  }
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(memberships)
    .where(and(...conditions));
  return rows[0]?.count ?? 0;
}

export async function getOrganizationForUser(
  organizationId: string,
  userId: string
): Promise<{ organization: Organization; role: string } | null> {
  const rows = await db
    .select({ organization: organizations, role: memberships.role })
    .from(memberships)
    .innerJoin(organizations, eq(memberships.organizationId, organizations.id))
    .where(
      and(
        eq(memberships.organizationId, organizationId),
        eq(memberships.userId, userId)
      )
    )
    .limit(1);
  return rows[0] ?? null;
}

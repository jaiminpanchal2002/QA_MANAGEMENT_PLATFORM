import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  memberships,
  organizations,
  type Organization,
} from "@/db/schema";

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

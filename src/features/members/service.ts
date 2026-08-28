import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { memberships, user } from "@/db/schema";
import { requireOrgContext } from "@/lib/auth/context";

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

import "server-only";
import { requireUser } from "@/lib/auth/context";
import { recordAudit } from "@/lib/audit/audit";
import { slugify } from "@/lib/utils";
import * as repo from "@/server/repositories/organization-repository";
import { createOrganizationSchema } from "./schema";

/**
 * Create an organization for the current user, who becomes its OWNER.
 * The slug is derived from the name and made unique.
 */
export async function createOrganizationService(input: unknown) {
  const user = await requireUser();
  const data = createOrganizationSchema.parse(input);

  const base = slugify(data.name) || "org";
  let slug = base;
  let attempt = 1;
  // Ensure a globally-unique slug (organizations.slug is unique).
  while (await repo.slugExists(slug)) {
    slug = `${base}-${attempt++}`;
    if (attempt > 50) {
      slug = `${base}-${Math.random().toString(36).slice(2, 8)}`;
      break;
    }
  }

  const org = await repo.createOrganizationWithOwner({
    name: data.name,
    slug,
    description: data.description ?? null,
    ownerId: user.id,
  });

  await recordAudit({
    organizationId: org.id,
    actorId: user.id,
    action: "organization.created",
    entityType: "organization",
    entityId: org.id,
    metadata: { name: org.name, slug: org.slug },
  });

  return org;
}

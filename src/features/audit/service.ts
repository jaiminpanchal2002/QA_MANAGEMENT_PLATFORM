import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, user } from "@/db/schema";
import { requireOrgPermission } from "@/lib/auth/context";
import { buildPageMeta, paginationSchema } from "@/lib/validation/common";

/** List audit entries for the active organization (requires audit.view). */
export async function listAuditLogsService(input: unknown) {
  const ctx = await requireOrgPermission("audit.view");
  const { page, pageSize } = paginationSchema.parse(input);

  const where = eq(auditLogs.organizationId, ctx.organizationId);

  const [rows, total] = await Promise.all([
    db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        actorName: user.name,
        metadata: auditLogs.metadata,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .leftJoin(user, eq(auditLogs.actorId, user.id))
      .where(where)
      .orderBy(desc(auditLogs.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.$count(auditLogs, where),
  ]);

  return { data: rows, meta: buildPageMeta(page, pageSize, total) };
}

import { index, jsonb, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { organizations } from "./organizations";
import { timestamps } from "./_shared";

/**
 * Immutable audit log. Rows are insert-only at the application layer — there
 * are no update/delete service methods, and normal users cannot mutate them.
 * `action` uses a dotted verb namespace, e.g. "project.created".
 */
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    actorId: text("actor_id").references(() => user.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    // Only createdAt is meaningful; audit rows are never updated.
    createdAt: timestamps.createdAt,
  },
  (t) => ({
    orgIdx: index("audit_logs_org_idx").on(t.organizationId),
    actorIdx: index("audit_logs_actor_idx").on(t.actorId),
    actionIdx: index("audit_logs_action_idx").on(t.action),
    entityIdx: index("audit_logs_entity_idx").on(t.entityType, t.entityId),
    createdAtIdx: index("audit_logs_created_at_idx").on(t.createdAt),
  })
);

export type AuditLog = typeof auditLogs.$inferSelect;

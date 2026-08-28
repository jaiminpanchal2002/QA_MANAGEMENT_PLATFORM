import {
  bigint,
  index,
  jsonb,
  pgTable,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { organizations } from "./organizations";
import { projects } from "./projects";
import {
  attachmentEntityType,
  commentEntityType,
  timestamps,
  softDelete,
} from "./_shared";

/**
 * Polymorphic comments attached to a domain entity. `entityType` + `entityId`
 * identify the target. Content is stored raw and sanitized at render time.
 */
export const comments = pgTable(
  "comments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "cascade",
    }),
    entityType: commentEntityType("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    body: text("body").notNull(),
    mentions: jsonb("mentions").$type<string[]>().notNull().default([]),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    ...timestamps,
    ...softDelete,
  },
  (t) => ({
    orgIdx: index("comments_org_idx").on(t.organizationId),
    entityIdx: index("comments_entity_idx").on(t.entityType, t.entityId),
    authorIdx: index("comments_author_idx").on(t.authorId),
  })
);

/**
 * Attachment metadata only — the binary lives in Vercel Blob under
 * `storageKey`. Access is authorized per-request against the org/project.
 */
export const attachments = pgTable(
  "attachments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "cascade",
    }),
    entityType: attachmentEntityType("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    filename: text("filename").notNull(),
    mimeType: text("mime_type").notNull(),
    size: bigint("size", { mode: "number" }).notNull(),
    storageKey: text("storage_key").notNull(),
    url: text("url").notNull(),
    uploadedBy: text("uploaded_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (t) => ({
    orgIdx: index("attachments_org_idx").on(t.organizationId),
    entityIdx: index("attachments_entity_idx").on(t.entityType, t.entityId),
  })
);

export type Comment = typeof comments.$inferSelect;
export type Attachment = typeof attachments.$inferSelect;

import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { attachments, type Attachment } from "@/db/schema";

/**
 * Tenant-scoped attachment metadata access. Private files are only served
 * after this returns a row for the caller's organization — a Blob URL alone
 * never authorizes access.
 */
export async function getAttachmentById(
  organizationId: string,
  id: string
): Promise<Attachment | null> {
  const rows = await db
    .select()
    .from(attachments)
    .where(
      and(
        eq(attachments.id, id),
        eq(attachments.organizationId, organizationId)
      )
    )
    .limit(1);
  return rows[0] ?? null;
}

export interface CreateAttachmentData {
  organizationId: string;
  projectId?: string | null;
  entityType: (typeof attachments.entityType.enumValues)[number];
  entityId: string;
  filename: string;
  mimeType: string;
  size: number;
  storageKey: string;
  url: string;
  uploadedBy: string;
}

export async function createAttachment(
  data: CreateAttachmentData
): Promise<Attachment> {
  const [row] = await db.insert(attachments).values(data).returning();
  return row!;
}

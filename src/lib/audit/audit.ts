import "server-only";
import { headers } from "next/headers";
import { db, type Database } from "@/db";
import { auditLogs } from "@/db/schema";
import { logger } from "@/lib/logger";

/**
 * Append-only audit service. There is deliberately no update/delete here —
 * the audit trail is immutable at the application layer. `action` follows a
 * dotted namespace, e.g. "project.created", "member.role_changed".
 */
export interface AuditInput {
  organizationId: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}

async function requestMeta(): Promise<{ ip: string | null; ua: string | null }> {
  try {
    const h = await headers();
    const ip =
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      h.get("x-real-ip") ??
      null;
    return { ip, ua: h.get("user-agent") };
  } catch {
    // Outside a request context (e.g. seed script).
    return { ip: null, ua: null };
  }
}

export async function recordAudit(
  input: AuditInput,
  tx: Database = db
): Promise<void> {
  try {
    const { ip, ua } = await requestMeta();
    await tx.insert(auditLogs).values({
      organizationId: input.organizationId,
      actorId: input.actorId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      metadata: input.metadata,
      ipAddress: ip,
      userAgent: ua,
    });
  } catch (error) {
    // Audit failures must never break the primary operation, but must be loud.
    logger.error("Failed to write audit log", {
      action: input.action,
      error: error instanceof Error ? error.message : "unknown",
    });
  }
}

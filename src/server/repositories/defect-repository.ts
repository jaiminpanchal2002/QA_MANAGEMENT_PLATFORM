import "server-only";
import { and, desc, eq, ilike, isNull, or } from "drizzle-orm";
import { db } from "@/db";
import { defects, type Defect } from "@/db/schema";
import { nextDefectSeq } from "./project-repository";

/** Tenant-scoped data access for defects. */
export async function getDefectById(
  organizationId: string,
  id: string
): Promise<Defect | null> {
  const rows = await db
    .select()
    .from(defects)
    .where(
      and(
        eq(defects.id, id),
        eq(defects.organizationId, organizationId),
        isNull(defects.deletedAt)
      )
    )
    .limit(1);
  return rows[0] ?? null;
}

export interface DefectListParams {
  organizationId: string;
  projectId: string;
  page: number;
  pageSize: number;
  search?: string;
  status?: (typeof defects.status.enumValues)[number];
  severity?: (typeof defects.severity.enumValues)[number];
}

export async function listDefects(params: DefectListParams) {
  const { organizationId, projectId, page, pageSize, search, status, severity } =
    params;
  const where = and(
    eq(defects.organizationId, organizationId),
    eq(defects.projectId, projectId),
    isNull(defects.deletedAt),
    status ? eq(defects.status, status) : undefined,
    severity ? eq(defects.severity, severity) : undefined,
    search
      ? or(
          ilike(defects.title, `%${search}%`),
          ilike(defects.reference, `%${search}%`)
        )
      : undefined
  );

  const [rows, total] = await Promise.all([
    db
      .select()
      .from(defects)
      .where(where)
      .orderBy(desc(defects.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.$count(defects, where),
  ]);
  return { rows, total };
}

export interface CreateDefectData {
  organizationId: string;
  projectId: string;
  title: string;
  description?: string | null;
  priority: (typeof defects.priority.enumValues)[number];
  severity: (typeof defects.severity.enumValues)[number];
  environment?: string | null;
  stepsToReproduce?: string | null;
  expectedResult?: string | null;
  actualResult?: string | null;
  assignedTo?: string | null;
  reportedBy: string;
  testExecutionId?: string | null;
}

export async function createDefect(data: CreateDefectData): Promise<Defect> {
  return db.transaction(async (tx) => {
    const seqInfo = await nextDefectSeq(data.organizationId, data.projectId, tx);
    if (!seqInfo) throw new Error("Project not found for sequence allocation");
    const reference = `${seqInfo.key}-BUG-${String(seqInfo.seq).padStart(3, "0")}`;

    const [defect] = await tx
      .insert(defects)
      .values({
        organizationId: data.organizationId,
        projectId: data.projectId,
        seq: seqInfo.seq,
        reference,
        title: data.title,
        description: data.description ?? null,
        priority: data.priority,
        severity: data.severity,
        environment: data.environment ?? null,
        stepsToReproduce: data.stepsToReproduce ?? null,
        expectedResult: data.expectedResult ?? null,
        actualResult: data.actualResult ?? null,
        assignedTo: data.assignedTo ?? null,
        reportedBy: data.reportedBy,
        testExecutionId: data.testExecutionId ?? null,
      })
      .returning();
    return defect!;
  });
}

export async function updateDefectStatus(
  organizationId: string,
  id: string,
  status: (typeof defects.status.enumValues)[number]
): Promise<Defect | null> {
  const rows = await db
    .update(defects)
    .set({ status })
    .where(
      and(
        eq(defects.id, id),
        eq(defects.organizationId, organizationId),
        isNull(defects.deletedAt)
      )
    )
    .returning();
  return rows[0] ?? null;
}

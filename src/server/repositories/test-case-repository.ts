import "server-only";
import { and, asc, desc, eq, ilike, inArray, isNull, or } from "drizzle-orm";
import { db, type Database } from "@/db";
import {
  testCases,
  testSteps,
  type TestCase,
  type TestStep,
} from "@/db/schema";
import { nextTestCaseSeq } from "./project-repository";

/** Tenant-scoped data access for test cases (+ their ordered steps). */
export interface TestCaseListParams {
  organizationId: string;
  projectId: string;
  page: number;
  pageSize: number;
  search?: string;
  status?: (typeof testCases.status.enumValues)[number];
  priority?: (typeof testCases.priority.enumValues)[number];
  type?: (typeof testCases.type.enumValues)[number];
  sortBy?: "createdAt" | "title" | "priority";
  sortOrder?: "asc" | "desc";
}

export async function listTestCases(
  params: TestCaseListParams
): Promise<{ rows: TestCase[]; total: number }> {
  const {
    organizationId,
    projectId,
    page,
    pageSize,
    search,
    status,
    priority,
    type,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = params;

  const where = and(
    eq(testCases.organizationId, organizationId),
    eq(testCases.projectId, projectId),
    isNull(testCases.deletedAt),
    status ? eq(testCases.status, status) : undefined,
    priority ? eq(testCases.priority, priority) : undefined,
    type ? eq(testCases.type, type) : undefined,
    search
      ? or(
          ilike(testCases.title, `%${search}%`),
          ilike(testCases.reference, `%${search}%`)
        )
      : undefined
  );

  const sortColumn =
    sortBy === "title"
      ? testCases.title
      : sortBy === "priority"
        ? testCases.priority
        : testCases.createdAt;
  const orderBy = sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);

  const [rows, total] = await Promise.all([
    db
      .select()
      .from(testCases)
      .where(where)
      .orderBy(orderBy)
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.$count(testCases, where),
  ]);

  return { rows, total };
}

export async function getTestCaseById(
  organizationId: string,
  id: string
): Promise<(TestCase & { steps: TestStep[] }) | null> {
  const rows = await db
    .select()
    .from(testCases)
    .where(
      and(
        eq(testCases.id, id),
        eq(testCases.organizationId, organizationId),
        isNull(testCases.deletedAt)
      )
    )
    .limit(1);
  const testCase = rows[0];
  if (!testCase) return null;

  const steps = await db
    .select()
    .from(testSteps)
    .where(
      and(
        eq(testSteps.testCaseId, id),
        eq(testSteps.organizationId, organizationId)
      )
    )
    .orderBy(asc(testSteps.stepNumber));

  return { ...testCase, steps };
}

export interface StepInput {
  action: string;
  expectedResult?: string | null;
  testData?: string | null;
}

export interface CreateTestCaseData {
  organizationId: string;
  projectId: string;
  title: string;
  description?: string | null;
  preconditions?: string | null;
  expectedResult?: string | null;
  priority: (typeof testCases.priority.enumValues)[number];
  severity: (typeof testCases.severity.enumValues)[number];
  type: (typeof testCases.type.enumValues)[number];
  status: (typeof testCases.status.enumValues)[number];
  automationStatus: (typeof testCases.automationStatus.enumValues)[number];
  component?: string | null;
  tags: string[];
  assignedTo?: string | null;
  requirementId?: string | null;
  createdBy: string;
  steps: StepInput[];
}

export async function createTestCase(
  data: CreateTestCaseData
): Promise<TestCase> {
  return db.transaction(async (tx) => {
    const seqInfo = await nextTestCaseSeq(
      data.organizationId,
      data.projectId,
      tx
    );
    if (!seqInfo) throw new Error("Project not found for sequence allocation");

    const reference = `${seqInfo.key}-TC-${String(seqInfo.seq).padStart(3, "0")}`;

    const [testCase] = await tx
      .insert(testCases)
      .values({
        organizationId: data.organizationId,
        projectId: data.projectId,
        seq: seqInfo.seq,
        reference,
        title: data.title,
        description: data.description ?? null,
        preconditions: data.preconditions ?? null,
        expectedResult: data.expectedResult ?? null,
        priority: data.priority,
        severity: data.severity,
        type: data.type,
        status: data.status,
        automationStatus: data.automationStatus,
        component: data.component ?? null,
        tags: data.tags,
        assignedTo: data.assignedTo ?? null,
        requirementId: data.requirementId ?? null,
        createdBy: data.createdBy,
      })
      .returning();

    if (data.steps.length > 0) {
      await tx.insert(testSteps).values(
        data.steps.map((step, index) => ({
          organizationId: data.organizationId,
          testCaseId: testCase!.id,
          stepNumber: index + 1,
          action: step.action,
          expectedResult: step.expectedResult ?? null,
          testData: step.testData ?? null,
        }))
      );
    }

    return testCase!;
  });
}

export async function softDeleteTestCase(
  organizationId: string,
  id: string
): Promise<boolean> {
  const rows = await db
    .update(testCases)
    .set({ deletedAt: new Date(), status: "ARCHIVED" })
    .where(
      and(
        eq(testCases.id, id),
        eq(testCases.organizationId, organizationId),
        isNull(testCases.deletedAt)
      )
    )
    .returning({ id: testCases.id });
  return rows.length > 0;
}

/** Bulk soft-delete, still tenant + project scoped. */
export async function bulkSoftDeleteTestCases(
  organizationId: string,
  projectId: string,
  ids: string[],
  tx: Database = db
): Promise<number> {
  if (ids.length === 0) return 0;
  const rows = await tx
    .update(testCases)
    .set({ deletedAt: new Date(), status: "ARCHIVED" })
    .where(
      and(
        eq(testCases.organizationId, organizationId),
        eq(testCases.projectId, projectId),
        inArray(testCases.id, ids),
        isNull(testCases.deletedAt)
      )
    )
    .returning({ id: testCases.id });
  return rows.length;
}

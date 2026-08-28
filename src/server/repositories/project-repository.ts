import "server-only";
import { and, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { projectMembers, projects, type Project } from "@/db/schema";

/**
 * Tenant-scoped data access for projects.
 *
 * EVERY function requires `organizationId` and includes it in the WHERE
 * clause. There is no `getProject(id)` that ignores tenancy — this is the
 * structural guard against cross-tenant reads/writes (IDOR).
 */
type ProjectStatusValue = (typeof projects.status.enumValues)[number];

export interface ProjectListParams {
  organizationId: string;
  page: number;
  pageSize: number;
  search?: string;
  status?: ProjectStatusValue;
}

export async function listProjects(
  params: ProjectListParams
): Promise<{ rows: Project[]; total: number }> {
  const { organizationId, page, pageSize, search, status } = params;

  const where = and(
    eq(projects.organizationId, organizationId),
    isNull(projects.deletedAt),
    status ? eq(projects.status, status) : undefined,
    search
      ? or(
          ilike(projects.name, `%${search}%`),
          ilike(projects.key, `%${search}%`)
        )
      : undefined
  );

  const [rows, total] = await Promise.all([
    db
      .select()
      .from(projects)
      .where(where)
      .orderBy(desc(projects.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.$count(projects, where),
  ]);

  return { rows, total };
}

export async function getProjectById(
  organizationId: string,
  id: string
): Promise<Project | null> {
  const rows = await db
    .select()
    .from(projects)
    .where(
      and(
        eq(projects.id, id),
        eq(projects.organizationId, organizationId),
        isNull(projects.deletedAt)
      )
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function projectKeyExists(
  organizationId: string,
  key: string
): Promise<boolean> {
  const rows = await db
    .select({ id: projects.id })
    .from(projects)
    .where(
      and(
        eq(projects.organizationId, organizationId),
        eq(projects.key, key),
        isNull(projects.deletedAt)
      )
    )
    .limit(1);
  return rows.length > 0;
}

export interface CreateProjectData {
  organizationId: string;
  name: string;
  key: string;
  description?: string | null;
  ownerId: string;
}

/**
 * Create a project and register its owner as a PROJECT_ADMIN in one
 * transaction, so a project is never left without an administrator.
 */
export async function createProject(
  data: CreateProjectData
): Promise<Project> {
  return db.transaction(async (tx) => {
    const [project] = await tx
      .insert(projects)
      .values({
        organizationId: data.organizationId,
        name: data.name,
        key: data.key,
        description: data.description ?? null,
        ownerId: data.ownerId,
      })
      .returning();

    await tx.insert(projectMembers).values({
      organizationId: data.organizationId,
      projectId: project!.id,
      userId: data.ownerId,
      role: "PROJECT_ADMIN",
    });

    return project!;
  });
}

export interface UpdateProjectData {
  name?: string;
  description?: string | null;
  status?: ProjectStatusValue;
}

export async function updateProject(
  organizationId: string,
  id: string,
  data: UpdateProjectData
): Promise<Project | null> {
  const rows = await db
    .update(projects)
    .set(data)
    .where(
      and(
        eq(projects.id, id),
        eq(projects.organizationId, organizationId),
        isNull(projects.deletedAt)
      )
    )
    .returning();
  return rows[0] ?? null;
}

export async function softDeleteProject(
  organizationId: string,
  id: string
): Promise<boolean> {
  const rows = await db
    .update(projects)
    .set({ deletedAt: new Date(), status: "ARCHIVED" })
    .where(
      and(
        eq(projects.id, id),
        eq(projects.organizationId, organizationId),
        isNull(projects.deletedAt)
      )
    )
    .returning({ id: projects.id });
  return rows.length > 0;
}

/** Reserve the next per-project test-case sequence number atomically. */
export async function nextTestCaseSeq(
  organizationId: string,
  projectId: string,
  tx = db
): Promise<{ seq: number; key: string } | null> {
  const rows = await tx
    .update(projects)
    .set({ testCaseSeq: sql`${projects.testCaseSeq} + 1` })
    .where(
      and(eq(projects.id, projectId), eq(projects.organizationId, organizationId))
    )
    .returning({ seq: projects.testCaseSeq, key: projects.key });
  return rows[0] ?? null;
}

/** Reserve the next per-project defect sequence number atomically. */
export async function nextDefectSeq(
  organizationId: string,
  projectId: string,
  tx = db
): Promise<{ seq: number; key: string } | null> {
  const rows = await tx
    .update(projects)
    .set({ defectSeq: sql`${projects.defectSeq} + 1` })
    .where(
      and(eq(projects.id, projectId), eq(projects.organizationId, organizationId))
    )
    .returning({ seq: projects.defectSeq, key: projects.key });
  return rows[0] ?? null;
}

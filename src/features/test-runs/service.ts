import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { testRuns } from "@/db/schema";
import { requireProjectPermission } from "@/lib/auth/context";
import { recordAudit } from "@/lib/audit/audit";
import { Errors } from "@/lib/errors";
import { buildPageMeta } from "@/lib/validation/common";
import * as repo from "@/server/repositories/test-run-repository";
import { SimulatedProvider } from "@/features/automation/providers/simulated";
import {
  createRunSchema,
  executeSchema,
  listRunsSchema,
  type ExecuteInput,
} from "./schema";

export async function listRunsService(projectId: string, input: unknown) {
  const ctx = await requireProjectPermission(projectId, "testrun.view");
  const params = listRunsSchema.parse(input);
  const { rows, total } = await repo.listTestRuns({
    organizationId: ctx.organizationId,
    projectId,
    page: params.page,
    pageSize: params.pageSize,
    status: params.status,
  });
  return { data: rows, meta: buildPageMeta(params.page, params.pageSize, total) };
}

export async function createRunService(projectId: string, input: unknown) {
  const ctx = await requireProjectPermission(projectId, "testrun.create");
  const data = createRunSchema.parse(input);

  const run = await repo.createRunWithExecutions({
    organizationId: ctx.organizationId,
    projectId,
    name: data.name,
    environment: data.environment,
    testPlanId: data.testPlanId,
    testCaseIds: data.testCaseIds,
    createdBy: ctx.user.id,
  });

  await recordAudit({
    organizationId: ctx.organizationId,
    actorId: ctx.user.id,
    action: "testrun.created",
    entityType: "test_run",
    entityId: run.id,
    metadata: { name: run.name, cases: data.testCaseIds.length },
  });

  return run;
}

async function loadRunInProject(
  organizationId: string,
  projectId: string,
  runId: string
) {
  const result = await repo.getRunWithExecutions(organizationId, runId);
  if (!result || result.run.projectId !== projectId) {
    throw Errors.notFound("Test run not found");
  }
  return result;
}

export async function getRunService(projectId: string, runId: string) {
  const ctx = await requireProjectPermission(projectId, "testrun.view");
  return loadRunInProject(ctx.organizationId, projectId, runId);
}

export async function executeService(
  projectId: string,
  runId: string,
  executionId: string,
  input: unknown
) {
  const ctx = await requireProjectPermission(projectId, "testcase.execute");
  const data: ExecuteInput = executeSchema.parse(input);

  // Ensure the run (and thus the execution) belongs to this project.
  await loadRunInProject(ctx.organizationId, projectId, runId);

  const status = await db.transaction(async (tx) => {
    const updated = await repo.updateExecution(
      ctx.organizationId,
      runId,
      executionId,
      {
        status: data.status,
        errorMessage: data.errorMessage,
        durationMs: data.durationMs,
        browser: data.browser,
        comment: data.comment,
        executedBy: ctx.user.id,
      },
      tx
    );
    if (!updated) throw Errors.notFound("Execution not found");
    return repo.recomputeRunStatus(ctx.organizationId, runId, tx);
  });

  await recordAudit({
    organizationId: ctx.organizationId,
    actorId: ctx.user.id,
    action: "testcase.executed",
    entityType: "test_execution",
    entityId: executionId,
    metadata: { runId, status: data.status },
  });

  return { runStatus: status };
}

export async function cancelRunService(projectId: string, runId: string) {
  const ctx = await requireProjectPermission(projectId, "testrun.cancel");
  await loadRunInProject(ctx.organizationId, projectId, runId);

  const cancelled = await repo.cancelRun(ctx.organizationId, runId);
  if (!cancelled) throw Errors.notFound("Test run not found");

  await recordAudit({
    organizationId: ctx.organizationId,
    actorId: ctx.user.id,
    action: "testrun.cancelled",
    entityType: "test_run",
    entityId: runId,
  });

  return cancelled;
}

/**
 * Auto-execute a run via the (simulated) automation provider. Demonstrates the
 * end-to-end adapter flow: createRun → collectResults → normalize → persist.
 * A real provider implements the same interface and swaps in unchanged.
 */
export async function autoRunService(projectId: string, runId: string) {
  const ctx = await requireProjectPermission(projectId, "testrun.execute");
  const { run, executions } = await loadRunInProject(
    ctx.organizationId,
    projectId,
    runId
  );

  const provider = new SimulatedProvider();
  const handle = await provider.createRun({
    runId: run.id,
    provider: "SIMULATED",
    environment: run.environment ?? undefined,
    testRefs: executions.map((e) => e.caseReference),
  });
  await provider.startRun(handle.externalJobId);
  const results = await provider.collectResults(handle.externalJobId);
  const byRef = new Map(results.map((r) => [r.testRef, r]));

  const runStatus = await db.transaction(async (tx) => {
    for (const exec of executions) {
      const result = byRef.get(exec.caseReference);
      if (!result) continue;
      await repo.updateExecution(
        ctx.organizationId,
        runId,
        exec.id,
        {
          status: result.status,
          errorMessage: result.errorMessage ?? null,
          durationMs: result.durationMs ?? null,
          browser: "automated",
          executedBy: ctx.user.id,
        },
        tx
      );
    }
    // Mark the run as automated. (The provider enum is reserved for real CI
    // providers; the simulated demo provider isn't one of them.)
    await tx
      .update(testRuns)
      .set({ isAutomated: "true" })
      .where(
        and(
          eq(testRuns.id, runId),
          eq(testRuns.organizationId, ctx.organizationId)
        )
      );
    return repo.recomputeRunStatus(ctx.organizationId, runId, tx);
  });

  await recordAudit({
    organizationId: ctx.organizationId,
    actorId: ctx.user.id,
    action: "testrun.auto_executed",
    entityType: "test_run",
    entityId: runId,
    metadata: { provider: "SIMULATED", cases: executions.length },
  });

  return { runStatus };
}

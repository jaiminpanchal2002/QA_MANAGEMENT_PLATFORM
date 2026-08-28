"use server";
import { revalidatePath } from "next/cache";
import {
  autoRunService,
  cancelRunService,
  createRunService,
  executeService,
} from "./service";
import { toActionError, type ActionResult } from "@/lib/actions";
import type { CreateRunInput, ExecuteInput } from "./schema";

export async function createRunAction(
  projectId: string,
  input: CreateRunInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const run = await createRunService(projectId, input);
    revalidatePath(`/projects/${projectId}/runs`);
    revalidatePath(`/projects/${projectId}`);
    return { ok: true, data: { id: run.id } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function executeAction(
  projectId: string,
  runId: string,
  executionId: string,
  input: ExecuteInput
): Promise<ActionResult<{ runStatus: string }>> {
  try {
    const result = await executeService(projectId, runId, executionId, input);
    revalidatePath(`/projects/${projectId}/runs/${runId}`);
    revalidatePath("/dashboard");
    return { ok: true, data: result };
  } catch (error) {
    return toActionError(error);
  }
}

export async function cancelRunAction(
  projectId: string,
  runId: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const run = await cancelRunService(projectId, runId);
    revalidatePath(`/projects/${projectId}/runs/${runId}`);
    return { ok: true, data: { id: run.id } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function autoRunAction(
  projectId: string,
  runId: string
): Promise<ActionResult<{ runStatus: string }>> {
  try {
    const result = await autoRunService(projectId, runId);
    revalidatePath(`/projects/${projectId}/runs/${runId}`);
    revalidatePath("/dashboard");
    return { ok: true, data: result };
  } catch (error) {
    return toActionError(error);
  }
}

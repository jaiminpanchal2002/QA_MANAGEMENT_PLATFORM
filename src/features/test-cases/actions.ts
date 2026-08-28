"use server";
import { revalidatePath } from "next/cache";
import {
  createTestCaseService,
  deleteTestCaseService,
} from "./service";
import { toActionError, type ActionResult } from "@/lib/actions";
import type { CreateTestCaseInput } from "./schema";

export async function createTestCaseAction(
  projectId: string,
  input: CreateTestCaseInput
): Promise<ActionResult<{ id: string; reference: string }>> {
  try {
    const tc = await createTestCaseService(projectId, input);
    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/dashboard");
    return { ok: true, data: { id: tc.id, reference: tc.reference } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteTestCaseAction(
  projectId: string,
  id: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const result = await deleteTestCaseService(projectId, id);
    revalidatePath(`/projects/${projectId}`);
    return { ok: true, data: result };
  } catch (error) {
    return toActionError(error);
  }
}

"use server";
import { revalidatePath } from "next/cache";
import {
  createDefectService,
  updateDefectStatusService,
} from "./service";
import { toActionError, type ActionResult } from "@/lib/actions";
import type { CreateDefectInput } from "./schema";

export async function createDefectAction(
  projectId: string,
  input: CreateDefectInput
): Promise<ActionResult<{ id: string; reference: string }>> {
  try {
    const defect = await createDefectService(projectId, input);
    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/dashboard");
    return { ok: true, data: { id: defect.id, reference: defect.reference } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateDefectStatusAction(
  projectId: string,
  defectId: string,
  status: string
): Promise<ActionResult<{ id: string; status: string }>> {
  try {
    const updated = await updateDefectStatusService(projectId, defectId, {
      status,
    });
    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/dashboard");
    return { ok: true, data: { id: updated.id, status: updated.status } };
  } catch (error) {
    return toActionError(error);
  }
}

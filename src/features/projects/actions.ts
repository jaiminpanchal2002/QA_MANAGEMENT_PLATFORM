"use server";
import { revalidatePath } from "next/cache";
import {
  createProjectService,
  deleteProjectService,
  updateProjectService,
} from "./service";
import { toActionError, type ActionResult } from "@/lib/actions";
import type { CreateProjectInput, UpdateProjectInput } from "./schema";

export async function createProjectAction(
  input: CreateProjectInput
): Promise<ActionResult<{ id: string; key: string }>> {
  try {
    const project = await createProjectService(input);
    revalidatePath("/projects");
    revalidatePath("/dashboard");
    return { ok: true, data: { id: project.id, key: project.key } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateProjectAction(
  projectId: string,
  input: UpdateProjectInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const project = await updateProjectService(projectId, input);
    revalidatePath("/projects");
    revalidatePath(`/projects/${projectId}`);
    return { ok: true, data: { id: project.id } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteProjectAction(
  projectId: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const result = await deleteProjectService(projectId);
    revalidatePath("/projects");
    return { ok: true, data: result };
  } catch (error) {
    return toActionError(error);
  }
}

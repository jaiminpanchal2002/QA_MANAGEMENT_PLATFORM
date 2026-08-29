"use server";
import { revalidatePath } from "next/cache";
import {
  addMemberService,
  removeMemberService,
  updateMemberRoleService,
} from "./service";
import { toActionError, type ActionResult } from "@/lib/actions";
import type {
  AddMemberInput,
  RemoveMemberInput,
  UpdateMemberRoleInput,
} from "./schema";

export async function addMemberAction(
  input: AddMemberInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const data = await addMemberService(input);
    revalidatePath("/settings");
    return { ok: true, data };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateMemberRoleAction(
  input: UpdateMemberRoleInput
): Promise<ActionResult<{ id: string; role: string }>> {
  try {
    const data = await updateMemberRoleService(input);
    revalidatePath("/settings");
    return { ok: true, data };
  } catch (error) {
    return toActionError(error);
  }
}

export async function removeMemberAction(
  input: RemoveMemberInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const data = await removeMemberService(input);
    revalidatePath("/settings");
    return { ok: true, data };
  } catch (error) {
    return toActionError(error);
  }
}

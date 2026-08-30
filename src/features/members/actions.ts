"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  removeMemberService,
  updateMemberRoleService,
} from "./service";
import {
  acceptInvitationService,
  addOrInviteMemberService,
  revokeInvitationService,
} from "./invitations";
import { ACTIVE_ORG_COOKIE } from "@/lib/auth/context";
import { toActionError, type ActionResult } from "@/lib/actions";
import type {
  AddMemberInput,
  RemoveMemberInput,
  UpdateMemberRoleInput,
} from "./schema";

/** Add an existing user, or email an invitation to a new one. */
export async function addOrInviteMemberAction(
  input: AddMemberInput
): Promise<
  ActionResult<{ status: "added" | "invited"; email: string; delivered?: boolean }>
> {
  try {
    const data = await addOrInviteMemberService(input);
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

export async function revokeInvitationAction(
  input: RemoveMemberInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const data = await revokeInvitationService(input);
    revalidatePath("/settings");
    return { ok: true, data };
  } catch (error) {
    return toActionError(error);
  }
}

/** Accept an invitation and make that organization the active tenant. */
export async function acceptInvitationAction(
  token: string
): Promise<ActionResult<{ organizationId: string }>> {
  try {
    const data = await acceptInvitationService(token);
    const cookieStore = await cookies();
    cookieStore.set(ACTIVE_ORG_COOKIE, data.organizationId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
    revalidatePath("/", "layout");
    return { ok: true, data };
  } catch (error) {
    return toActionError(error);
  }
}

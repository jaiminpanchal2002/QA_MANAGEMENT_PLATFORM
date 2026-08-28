"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createOrganizationService } from "./service";
import { ACTIVE_ORG_COOKIE } from "@/lib/auth/context";
import { toActionError, type ActionResult } from "@/lib/actions";

/**
 * Create an organization and make it the caller's active tenant (cookie).
 * Returns a typed result so the client form can render field/errors inline.
 */
export async function createOrganizationAction(input: {
  name: string;
  description?: string | null;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const org = await createOrganizationService(input);
    const cookieStore = await cookies();
    cookieStore.set(ACTIVE_ORG_COOKIE, org.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
    revalidatePath("/", "layout");
    return { ok: true, data: { id: org.id } };
  } catch (error) {
    return toActionError(error);
  }
}

/** Switch the active organization (validated against membership server-side). */
export async function switchOrganizationAction(
  organizationId: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const cookieStore = await cookies();
    cookieStore.set(ACTIVE_ORG_COOKIE, organizationId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
    revalidatePath("/", "layout");
    return { ok: true, data: { id: organizationId } };
  } catch (error) {
    return toActionError(error);
  }
}

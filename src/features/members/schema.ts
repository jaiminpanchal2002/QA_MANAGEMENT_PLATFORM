import { z } from "zod";
import { emailSchema } from "@/features/auth/schema";
import { ORG_ROLES } from "@/lib/authorization/permissions";

/** Org roles are a non-empty tuple — safe to hand directly to z.enum. */
export const orgRoleSchema = z.enum(ORG_ROLES);

/** Add an existing user (looked up by email) to the active organization. */
export const addMemberSchema = z.object({
  email: emailSchema,
  role: orgRoleSchema,
});

/** Change an existing member's organization role. */
export const updateMemberRoleSchema = z.object({
  membershipId: z.string().uuid("Invalid member"),
  role: orgRoleSchema,
});

export const removeMemberSchema = z.object({
  membershipId: z.string().uuid("Invalid member"),
});

export type AddMemberInput = z.infer<typeof addMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
export type RemoveMemberInput = z.infer<typeof removeMemberSchema>;

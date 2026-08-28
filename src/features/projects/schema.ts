import { z } from "zod";
import {
  nonEmptyString,
  paginationSchema,
  projectKeySchema,
} from "@/lib/validation/common";

export const createProjectSchema = z.object({
  name: nonEmptyString(120),
  key: projectKeySchema,
  description: z.string().trim().max(2000).optional().nullable(),
});

export const updateProjectSchema = z.object({
  name: nonEmptyString(120).optional(),
  description: z.string().trim().max(2000).optional().nullable(),
  status: z.enum(["ACTIVE", "ARCHIVED", "ON_HOLD"]).optional(),
});

export const listProjectsSchema = paginationSchema.extend({
  search: z.string().trim().max(120).optional(),
  status: z.enum(["ACTIVE", "ARCHIVED", "ON_HOLD"]).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ListProjectsInput = z.infer<typeof listProjectsSchema>;

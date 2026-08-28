import { z } from "zod";
import { nonEmptyString } from "@/lib/validation/common";

export const createOrganizationSchema = z.object({
  name: nonEmptyString(120),
  description: z.string().trim().max(500).optional().nullable(),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;

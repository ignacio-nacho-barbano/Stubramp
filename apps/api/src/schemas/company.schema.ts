import { z } from "zod";

export const createCompanyInput = z.object({
  name: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "slug must be lowercase alphanumeric/hyphen"),
});

export const listCompaniesQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

export type CreateCompanyInput = z.infer<typeof createCompanyInput>;

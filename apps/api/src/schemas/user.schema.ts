import { z } from "zod";

export const ROLES = [
  "SUPERUSER",
  "ADMIN",
  "ACCOUNTANT",
  "APPROVER",
  "EMPLOYEE",
] as const;

export const createUserInput = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8),
  role: z.enum(ROLES),
  // Superuser-only target company; ADMINs are forced into their own company.
  companyId: z.string().uuid().optional(),
});

export const listUsersQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

export const userIdParams = z.object({
  id: z.string().uuid(),
});

export type CreateUserInput = z.infer<typeof createUserInput>;

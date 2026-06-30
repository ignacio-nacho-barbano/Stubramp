import { z } from "zod";

export const createVendorInput = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  bankRef: z.string().optional(),
});

export const listVendorsQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

export const vendorIdParams = z.object({
  id: z.string().uuid(),
});

export type CreateVendorInput = z.infer<typeof createVendorInput>;

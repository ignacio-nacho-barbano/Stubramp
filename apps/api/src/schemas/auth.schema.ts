import { z } from "zod";

export const loginInput = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Public self-serve signup: creates a brand-new company plus its first (ADMIN)
// user. `companySize` is a marketing detail with no column on the model — it is
// accepted but not persisted.
export const signupInput = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  companyName: z.string().min(1),
  companySize: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginInput>;
export type SignupInput = z.infer<typeof signupInput>;

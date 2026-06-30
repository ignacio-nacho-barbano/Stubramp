import { z } from "zod";

export const loginInput = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const refreshInput = z.object({
  refreshToken: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginInput>;
export type RefreshInput = z.infer<typeof refreshInput>;

import { z } from 'zod';

const email = z.string().trim().toLowerCase().pipe(z.email());

export const signupSchema = z.object({
  email,
  password: z.string().min(8).max(128),
  name: z.string().trim().min(1).max(100),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1),
});

// derived from the schemas so the runtime contract and the types cannot drift
export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

import { z } from 'zod';

/*
 * Client-side copies of the API's rules, for instant feedback. The API checks
 * everything again (including common passwords and "contains your name"), and
 * its field-level answers are shown next to the same fields.
 */

export const PASSWORD_MIN_LENGTH = 10;

const email = z
  .string()
  .trim()
  .min(1, { error: 'Enter your email address' })
  .pipe(z.email({ error: 'Enter a valid email address' }));

const newPassword = z
  .string()
  .min(PASSWORD_MIN_LENGTH, { error: `Use at least ${PASSWORD_MIN_LENGTH} characters` })
  .max(128, { error: 'Use at most 128 characters' });

const name = z
  .string()
  .trim()
  .min(2, { error: 'Enter your name' })
  .max(80, { error: 'Use at most 80 characters' });

export const organizationName = z
  .string()
  .trim()
  .min(2, { error: 'Enter your organisation name' })
  .max(100, { error: 'Use at most 100 characters' });

export const signInSchema = z.object({
  email,
  password: z.string().min(1, { error: 'Enter your password' }),
});
export type SignInValues = z.infer<typeof signInSchema>;

export const signUpSchema = z.object({ name, email, organizationName, password: newPassword });
export type SignUpValues = z.infer<typeof signUpSchema>;

export const acceptInviteSchema = z.object({ name, password: newPassword });
export type AcceptInviteValues = z.infer<typeof acceptInviteSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, { error: 'Enter your current password' }),
  newPassword,
});
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export const PASSWORD_HINT = `At least ${PASSWORD_MIN_LENGTH} characters. A short phrase of a few unrelated words works well.`;

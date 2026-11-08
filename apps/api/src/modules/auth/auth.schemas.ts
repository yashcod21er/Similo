import { z } from 'zod';
import { PASSWORD_MAX_LENGTH } from '../../lib/passwords.js';
import { emailSchema, organizationNameSchema, personNameSchema } from '../../lib/validation.js';

/*
 * Request shapes for the auth endpoints. Password *strength* (length, common
 * passwords, contains your name) is checked in the service, where the user's
 * name and email are known; here we only bound the size.
 */

const passwordField = (label: string) =>
  z
    .string({ error: label })
    .min(1, { error: label })
    .max(PASSWORD_MAX_LENGTH, { error: `Use at most ${PASSWORD_MAX_LENGTH} characters` });

export const signUpSchema = z.object({
  name: personNameSchema,
  email: emailSchema,
  password: passwordField('Choose a password'),
  organizationName: organizationNameSchema,
});
export type SignUpInput = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
  email: emailSchema,
  password: passwordField('Enter your password'),
});
export type SignInInput = z.infer<typeof signInSchema>;

export const changePasswordSchema = z.object({
  currentPassword: passwordField('Enter your current password'),
  newPassword: passwordField('Choose a new password'),
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const acceptInviteSchema = z.object({
  name: personNameSchema,
  password: passwordField('Choose a password'),
});
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;

/** Invite tokens are 43-character base64url strings; reject anything else early. */
export const inviteTokenSchema = z
  .string()
  .min(20)
  .max(128)
  .regex(/^[A-Za-z0-9_-]+$/);

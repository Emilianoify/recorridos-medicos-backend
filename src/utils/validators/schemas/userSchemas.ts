import { z } from 'zod';
import { ERROR_MESSAGES } from '../../../constants/messages/error.messages';
import { UserState } from '../../../enums/UserState';
import { USER_STATE_VALUES } from '../enumValidators';

export const userStateSchema = z.enum(
  USER_STATE_VALUES as [string, ...string[]],
  {
    errorMap: () => ({ message: ERROR_MESSAGES.AUTH.INVALID_USER_STATE }),
  }
);

export const userBaseSchema = z.object({
  username: z
    .string()
    .min(3, ERROR_MESSAGES.AUTH.INVALID_USERNAME)
    .max(50, ERROR_MESSAGES.AUTH.INVALID_USERNAME)
    .regex(/^[a-zA-Z0-9_]+$/, ERROR_MESSAGES.AUTH.INVALID_USERNAME_FORMAT),

  firstname: z
    .string()
    .min(2, ERROR_MESSAGES.AUTH.INVALID_FIRSTNAME)
    .max(100, ERROR_MESSAGES.AUTH.INVALID_FIRSTNAME)
    .regex(
      /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
      ERROR_MESSAGES.AUTH.INVALID_FIRSTNAME_FORMAT
    ),

  lastname: z
    .string()
    .min(2, ERROR_MESSAGES.AUTH.INVALID_LASTNAME)
    .max(100, ERROR_MESSAGES.AUTH.INVALID_LASTNAME)
    .regex(
      /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
      ERROR_MESSAGES.AUTH.INVALID_LASTNAME_FORMAT
    ),

  corporative_email: z
    .string()
    .email(ERROR_MESSAGES.AUTH.INVALID_EMAIL)
    .min(5, ERROR_MESSAGES.AUTH.INVALID_EMAIL)
    .max(255, ERROR_MESSAGES.AUTH.INVALID_EMAIL),

  password: z
    .string()
    .min(8, ERROR_MESSAGES.AUTH.INVALID_PASSWORD)
    .max(255, ERROR_MESSAGES.AUTH.INVALID_PASSWORD)
    .regex(/^(?=.*[A-Z])(?=.*\d).{8,}$/, ERROR_MESSAGES.AUTH.WEAK_PASSWORD),

  roleId: z.string().uuid(ERROR_MESSAGES.AUTH.INVALID_ROLE_ID),

  state: userStateSchema.optional().default(UserState.ACTIVE),
  passwordResetToken: z.string().optional().nullable(),
  passwordResetExpires: z.date().optional().nullable(),
});

export const createUserSchema = userBaseSchema
  .extend({
    username: z
      .string()
      .min(3, ERROR_MESSAGES.AUTH.INVALID_USERNAME)
      .max(50, ERROR_MESSAGES.AUTH.INVALID_USERNAME)
      .regex(/^[a-zA-Z0-9_]+$/, ERROR_MESSAGES.AUTH.INVALID_USERNAME_FORMAT),

    firstname: z
      .string()
      .min(2, ERROR_MESSAGES.AUTH.INVALID_FIRSTNAME)
      .max(100, ERROR_MESSAGES.AUTH.INVALID_FIRSTNAME)
      .regex(
        /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
        ERROR_MESSAGES.AUTH.INVALID_FIRSTNAME_FORMAT
      ),

    lastname: z
      .string()
      .min(2, ERROR_MESSAGES.AUTH.INVALID_LASTNAME)
      .max(100, ERROR_MESSAGES.AUTH.INVALID_LASTNAME)
      .regex(
        /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
        ERROR_MESSAGES.AUTH.INVALID_LASTNAME_FORMAT
      ),

    corporative_email: z
      .string()
      .email(ERROR_MESSAGES.AUTH.INVALID_EMAIL)
      .min(5, ERROR_MESSAGES.AUTH.INVALID_EMAIL)
      .max(255, ERROR_MESSAGES.AUTH.INVALID_EMAIL),

    password: z
      .string()
      .min(8, ERROR_MESSAGES.AUTH.INVALID_PASSWORD)
      .max(255, ERROR_MESSAGES.AUTH.INVALID_PASSWORD)
      .regex(/^(?=.*[A-Z])(?=.*\d).{8,}$/, ERROR_MESSAGES.AUTH.WEAK_PASSWORD),

    roleId: z.string().uuid(ERROR_MESSAGES.AUTH.INVALID_ROLE_ID),
  })
  .strict();

export const updateUserSchema = userBaseSchema
  .partial()
  .extend({
    password: z
      .string()
      .min(8, ERROR_MESSAGES.AUTH.INVALID_PASSWORD)
      .max(255, ERROR_MESSAGES.AUTH.INVALID_PASSWORD)
      .regex(/^(?=.*[A-Z])(?=.*\d).{8,}$/, ERROR_MESSAGES.AUTH.WEAK_PASSWORD)
      .optional(),

    state: userStateSchema.optional(),
  })
  .strict();

// Schema para login
export const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, ERROR_MESSAGES.AUTH.IDENTIFIER_REQUIRED)
    .max(255, ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS),

  password: z
    .string()
    .min(1, ERROR_MESSAGES.AUTH.EMPTY_PASSWORD)
    .max(255, ERROR_MESSAGES.AUTH.INVALID_PASSWORD),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, ERROR_MESSAGES.AUTH.CURRENT_PASSWORD_REQUIRED),

    newPassword: z
      .string()
      .min(8, ERROR_MESSAGES.AUTH.INVALID_PASSWORD)
      .max(255, ERROR_MESSAGES.AUTH.INVALID_PASSWORD)
      .regex(/^(?=.*[A-Z])(?=.*\d).{8,}$/, ERROR_MESSAGES.AUTH.WEAK_PASSWORD),
  })
  .refine(data => data.currentPassword !== data.newPassword, {
    message: ERROR_MESSAGES.AUTH.SAME_PASSWORD,
    path: ['newPassword'],
  });

// Schema para reset de contraseña
export const resetPasswordSchema = z.object({
  token: z.string().min(1, ERROR_MESSAGES.AUTH.INVALID_RESET_TOKEN),

  newPassword: z
    .string()
    .min(8, ERROR_MESSAGES.AUTH.INVALID_PASSWORD)
    .max(255, ERROR_MESSAGES.AUTH.INVALID_PASSWORD)
    .regex(/^(?=.*[A-Z])(?=.*\d).{8,}$/, ERROR_MESSAGES.AUTH.WEAK_PASSWORD),
});

export const userResponseSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  firstname: z.string(),
  lastname: z.string(),
  corporative_email: z.string().email(),
  roleId: z.string().uuid(),
  state: userStateSchema,
  lastLogin: z.date().optional().nullable(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  deletedAt: z.date().optional().nullable(),
});

// Type inferidos
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;

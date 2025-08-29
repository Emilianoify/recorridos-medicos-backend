import { ERROR_MESSAGES } from '../../../constants/messages/error.messages';

const { z } = require('zod');

// Esquema para registro de usuario
export const UserRegisterSchema = z.object({
  username: z
    .string()
    .min(1, { message: ERROR_MESSAGES.AUTH.EMPTY_USERNAME })
    .min(3, { message: ERROR_MESSAGES.AUTH.INVALID_USERNAME })
    .max(50, { message: ERROR_MESSAGES.AUTH.INVALID_USERNAME })
    .regex(/^[a-zA-Z0-9]+$/, {
      message: ERROR_MESSAGES.AUTH.INVALID_USERNAME,
    })
    .trim(),

  firstname: z
    .string()
    .min(1, { message: ERROR_MESSAGES.AUTH.EMPTY_FIRSTNAME })
    .min(2, { message: ERROR_MESSAGES.AUTH.INVALID_FIRSTNAME })
    .max(100, { message: ERROR_MESSAGES.AUTH.INVALID_FIRSTNAME })
    .trim(),

  lastname: z
    .string()
    .min(1, { message: ERROR_MESSAGES.AUTH.EMPTY_LASTNAME })
    .min(2, { message: ERROR_MESSAGES.AUTH.INVALID_LASTNAME })
    .max(100, { message: ERROR_MESSAGES.AUTH.INVALID_LASTNAME })
    .trim(),

  corporative_email: z
    .string()
    .min(1, { message: ERROR_MESSAGES.AUTH.EMPTY_EMAIL })
    .email({ message: ERROR_MESSAGES.AUTH.INVALID_EMAIL })
    .trim(),

  password: z
    .string()
    .min(1, { message: ERROR_MESSAGES.AUTH.EMPTY_PASSWORD })
    .min(8, { message: ERROR_MESSAGES.AUTH.WEAK_PASSWORD })
    .regex(/[A-Z]/, { message: ERROR_MESSAGES.AUTH.WEAK_PASSWORD })
    .regex(/[0-9]/, { message: ERROR_MESSAGES.AUTH.WEAK_PASSWORD })
    .trim(),

  roleId: z.union([z.string(), z.number()]).refine(
    (value: string) => {
      if (typeof value === 'string') {
        return value.trim().length > 0;
      }
      return value !== undefined && value !== null;
    },
    {
      message: ERROR_MESSAGES.AUTH.EMPTY_ROLE,
    }
  ),
});

// Esquema para login de usuario

export const LoginSchema = z.object({
  username: z
    .string()
    .min(1, ERROR_MESSAGES.AUTH.EMPTY_USERNAME)
    .max(255, ERROR_MESSAGES.AUTH.INVALID_USERNAME),
  password: z
    .string()
    .min(1, ERROR_MESSAGES.AUTH.EMPTY_PASSWORD)
    .max(255, ERROR_MESSAGES.AUTH.INVALID_PASSWORD),
});

interface ChangePassword {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const ChangePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, ERROR_MESSAGES.AUTH.CURRENT_PASSWORD_REQUIRED),
    newPassword: UserRegisterSchema.password,
    confirmPassword: z
      .string()
      .min(1, ERROR_MESSAGES.AUTH.CONFIRM_PASSWORD_REQUIRED),
  })
  .refine((data: ChangePassword) => data.newPassword === data.confirmPassword, {
    message: ERROR_MESSAGES.AUTH.PASSWORD_DOESNT_MATCH,
  });

export const ResetPasswordRequestSchema = z.object({
  email: z.string().email({ message: ERROR_MESSAGES.AUTH.INVALID_EMAIL }),
});

export const ResetPasswordSchema = z.object({
  token: z
    .string()
    .min(1, { message: ERROR_MESSAGES.AUTH.INVALID_TOKEN })
    .trim(),

  newPassword: UserRegisterSchema.password,
});

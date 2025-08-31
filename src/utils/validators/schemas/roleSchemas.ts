import { z } from 'zod';
import { ERROR_MESSAGES } from '../../../constants/messages/error.messages';

// Schema base para validaciones comunes
export const roleBaseSchema = z.object({
  name: z
    .string()
    .min(2, ERROR_MESSAGES.ROLE.INVALID_ROLE_NAME)
    .max(100, ERROR_MESSAGES.ROLE.INVALID_ROLE_NAME)
    .regex(
      /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
      ERROR_MESSAGES.ROLE.INVALID_ROLE_NAME_FORMAT
    ),

  description: z
    .string()
    .max(500, ERROR_MESSAGES.ROLE.INVALID_ROLE_DESCRIPTION)
    .optional()
    .nullable(),

  permissions: z.array(z.string()).optional().nullable().default([]),

  isActive: z.boolean().optional().default(true),
});

// Schema para crear un nuevo rol
export const createRoleSchema = roleBaseSchema.extend({
  name: z
    .string()
    .min(2, ERROR_MESSAGES.ROLE.INVALID_ROLE_NAME)
    .max(100, ERROR_MESSAGES.ROLE.INVALID_ROLE_NAME)
    .regex(
      /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
      ERROR_MESSAGES.ROLE.INVALID_ROLE_NAME_FORMAT
    ),
});

// Schema para actualizar un rol (todos los campos opcionales)
export const updateRoleSchema = roleBaseSchema
  .partial()
  .extend({
    name: z
      .string()
      .min(2, ERROR_MESSAGES.ROLE.INVALID_ROLE_NAME)
      .max(100, ERROR_MESSAGES.ROLE.INVALID_ROLE_NAME)
      .regex(
        /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
        ERROR_MESSAGES.ROLE.INVALID_ROLE_NAME_FORMAT
      )
      .optional(),
  })
  .strict();

// Schema para validar el nombre del rol
export const roleNameSchema = z.object({
  name: z
    .string()
    .min(2, ERROR_MESSAGES.ROLE.INVALID_ROLE_NAME)
    .max(100, ERROR_MESSAGES.ROLE.INVALID_ROLE_NAME)
    .regex(
      /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
      ERROR_MESSAGES.ROLE.INVALID_ROLE_NAME_FORMAT
    ),
});

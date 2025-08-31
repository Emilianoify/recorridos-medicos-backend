import { z } from 'zod';
import { ERROR_MESSAGES } from '../../../constants/messages/error.messages';

export const specialtyBaseSchema = z.object({
  name: z
    .string()
    .min(2, ERROR_MESSAGES.SPECIALTY.INVALID_SPECIALTY_NAME)
    .max(100, ERROR_MESSAGES.SPECIALTY.INVALID_SPECIALTY_NAME)
    .regex(
      /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-()]+$/,
      ERROR_MESSAGES.SPECIALTY.INVALID_SPECIALTY_NAME
    ),

  description: z
    .string()
    .max(500, ERROR_MESSAGES.SPECIALTY.INVALID_SPECIALTY_DESCRIPTION)
    .optional()
    .nullable(),

  isActive: z.boolean().optional().default(true),
});

export const createSpecialtySchema = specialtyBaseSchema.extend({
  name: z
    .string()
    .min(2, ERROR_MESSAGES.SPECIALTY.INVALID_SPECIALTY_NAME)
    .max(100, ERROR_MESSAGES.SPECIALTY.INVALID_SPECIALTY_NAME)
    .regex(
      /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-()]+$/,
      ERROR_MESSAGES.SPECIALTY.INVALID_SPECIALTY_NAME
    ),
});

export const updateSpecialtySchema = specialtyBaseSchema.partial().strict();

export const specialtyNameSchema = z.object({
  name: z
    .string()
    .min(2, ERROR_MESSAGES.SPECIALTY.INVALID_SPECIALTY_NAME)
    .max(100, ERROR_MESSAGES.SPECIALTY.INVALID_SPECIALTY_NAME)
    .regex(
      /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-()]+$/,
      ERROR_MESSAGES.SPECIALTY.INVALID_SPECIALTY_NAME
    ),
});

export const specialtyResponseSchema = specialtyBaseSchema.extend({
  id: z.string().uuid(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  deletedAt: z.date().optional().nullable(),
});

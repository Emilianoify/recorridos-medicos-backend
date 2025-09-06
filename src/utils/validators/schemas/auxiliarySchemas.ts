import { z } from 'zod';
import { ERROR_MESSAGES } from '../../../constants/messages/error.messages';

// ConfirmationStatus Schemas
export const confirmationStatusBaseSchema = z.object({
  name: z
    .string()
    .min(2, ERROR_MESSAGES.CONFIRMATION_STATUS.INVALID_NAME)
    .max(50, ERROR_MESSAGES.CONFIRMATION_STATUS.INVALID_NAME)
    .regex(
      /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
      ERROR_MESSAGES.CONFIRMATION_STATUS.INVALID_NAME_FORMAT
    ),

  description: z
    .string()
    .max(200, ERROR_MESSAGES.CONFIRMATION_STATUS.INVALID_DESCRIPTION)
    .optional()
    .nullable(),

  isActive: z.boolean().optional().default(true),
});

export const createConfirmationStatusSchema =
  confirmationStatusBaseSchema.extend({
    name: z
      .string()
      .min(2, ERROR_MESSAGES.CONFIRMATION_STATUS.INVALID_NAME)
      .max(50, ERROR_MESSAGES.CONFIRMATION_STATUS.INVALID_NAME),
  });

export const updateConfirmationStatusSchema = confirmationStatusBaseSchema
  .partial()
  .strict();

// RejectionReason Schemas
export const rejectionReasonBaseSchema = z.object({
  name: z
    .string()
    .min(2, ERROR_MESSAGES.REJECTION_REASON.INVALID_NAME)
    .max(100, ERROR_MESSAGES.REJECTION_REASON.INVALID_NAME)
    .regex(
      /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s.,'-]+$/,
      ERROR_MESSAGES.REJECTION_REASON.INVALID_NAME_FORMAT
    ),

  description: z
    .string()
    .max(300, ERROR_MESSAGES.REJECTION_REASON.INVALID_DESCRIPTION)
    .optional()
    .nullable(),

  category: z
    .string()
    .min(2, ERROR_MESSAGES.REJECTION_REASON.INVALID_CATEGORY)
    .max(50, ERROR_MESSAGES.REJECTION_REASON.INVALID_CATEGORY)
    .optional()
    .nullable(),

  requiresReschedule: z.boolean().optional().default(false), // CORREGIDO: false por defecto

  isActive: z.boolean().optional().default(true),
});

export const createRejectionReasonSchema = rejectionReasonBaseSchema.extend({
  name: z
    .string()
    .min(2, ERROR_MESSAGES.REJECTION_REASON.INVALID_NAME)
    .max(100, ERROR_MESSAGES.REJECTION_REASON.INVALID_NAME),
});

export const updateRejectionReasonSchema = rejectionReasonBaseSchema
  .partial()
  .strict();

// NotCompletedReason Schemas
export const notCompletedReasonBaseSchema = z.object({
  name: z
    .string()
    .min(2, ERROR_MESSAGES.NOT_COMPLETED_REASON.INVALID_NAME)
    .max(100, ERROR_MESSAGES.NOT_COMPLETED_REASON.INVALID_NAME)
    .regex(
      /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s.,'-]+$/,
      ERROR_MESSAGES.NOT_COMPLETED_REASON.INVALID_NAME_FORMAT
    ),

  description: z
    .string()
    .max(300, ERROR_MESSAGES.NOT_COMPLETED_REASON.INVALID_DESCRIPTION)
    .optional()
    .nullable(),

  category: z
    .string()
    .min(2, ERROR_MESSAGES.NOT_COMPLETED_REASON.INVALID_CATEGORY)
    .max(50, ERROR_MESSAGES.NOT_COMPLETED_REASON.INVALID_CATEGORY)
    .optional()
    .nullable(),

  requiresReschedule: z.boolean().optional().default(true),

  suggestedAction: z // AGREGADO: este campo estaba en el lugar equivocado
    .string()
    .max(100, ERROR_MESSAGES.NOT_COMPLETED_REASON.INVALID_SUGGESTED_ACTION)
    .optional()
    .nullable(),

  isActive: z.boolean().optional().default(true),
});

export const createNotCompletedReasonSchema =
  notCompletedReasonBaseSchema.extend({
    name: z
      .string()
      .min(2, ERROR_MESSAGES.NOT_COMPLETED_REASON.INVALID_NAME)
      .max(100, ERROR_MESSAGES.NOT_COMPLETED_REASON.INVALID_NAME),
  });

export const updateNotCompletedReasonSchema = notCompletedReasonBaseSchema
  .partial()
  .strict();

// Response schemas
export const confirmationStatusResponseSchema =
  confirmationStatusBaseSchema.extend({
    id: z.string().uuid(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
    deletedAt: z.date().optional().nullable(),
  });

export const rejectionReasonResponseSchema = rejectionReasonBaseSchema.extend({
  id: z.string().uuid(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  deletedAt: z.date().optional().nullable(),
});

export const notCompletedReasonResponseSchema =
  notCompletedReasonBaseSchema.extend({
    id: z.string().uuid(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
    deletedAt: z.date().optional().nullable(),
  });

// Types
export type CreateConfirmationStatusInput = z.infer<
  typeof createConfirmationStatusSchema
>;
export type UpdateConfirmationStatusInput = z.infer<
  typeof updateConfirmationStatusSchema
>;
export type CreateRejectionReasonInput = z.infer<
  typeof createRejectionReasonSchema
>;
export type UpdateRejectionReasonInput = z.infer<
  typeof updateRejectionReasonSchema
>;
export type CreateNotCompletedReasonInput = z.infer<
  typeof createNotCompletedReasonSchema
>;
export type UpdateNotCompletedReasonInput = z.infer<
  typeof updateNotCompletedReasonSchema
>;

import { z } from 'zod';
import { ERROR_MESSAGES } from '../../../constants/messages/error.messages';
import { VisitStatus } from '../../../enums/Visits';
import {
  CONFIRMATION_METHOD_VALUES,
  VISIT_STATUS_VALUES,
} from '../enumValidators';

// Esquemas para enums
export const visitStatusSchema = z.enum(
  VISIT_STATUS_VALUES as [string, ...string[]],
  {
    errorMap: () => ({ message: ERROR_MESSAGES.VISIT.INVALID_STATUS }),
  }
);

export const confirmationMethodSchema = z.enum(
  CONFIRMATION_METHOD_VALUES as [string, ...string[]],
  {
    errorMap: () => ({
      message: ERROR_MESSAGES.VISIT.INVALID_CONFIRMATION_METHOD,
    }),
  }
);

// Esquema para geolocalización
export const geoLocationSchema = z
  .object({
    lat: z
      .number()
      .min(-90, ERROR_MESSAGES.VISIT.INVALID_LATITUDE)
      .max(90, ERROR_MESSAGES.VISIT.INVALID_LATITUDE),
    lng: z
      .number()
      .min(-180, ERROR_MESSAGES.VISIT.INVALID_LONGITUDE)
      .max(180, ERROR_MESSAGES.VISIT.INVALID_LONGITUDE),
    accuracy: z.number().min(0).optional(),
    timestamp: z.date(),
    address: z.string().max(200).optional(),
  })
  .optional()
  .nullable();

// Schema base para Visit
export const visitBaseSchema = z.object({
  patientId: z.string().uuid(ERROR_MESSAGES.VISIT.INVALID_PATIENT_ID),

  journeyId: z.string().uuid(ERROR_MESSAGES.VISIT.INVALID_JOURNEY_ID),

  status: visitStatusSchema.default(VisitStatus.SCHEDULED),

  scheduledDateTime: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
      ERROR_MESSAGES.VISIT.INVALID_DATETIME
    ),

  orderInJourney: z
    .number()
    .int()
    .min(1, ERROR_MESSAGES.VISIT.INVALID_ORDER)
    .max(100, ERROR_MESSAGES.VISIT.INVALID_ORDER),

  confirmationStatusId: z
    .string()
    .uuid(ERROR_MESSAGES.VISIT.INVALID_CONFIRMATION_STATUS_ID)
    .optional()
    .nullable(),

  confirmationDateTime: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
      ERROR_MESSAGES.VISIT.INVALID_DATETIME
    )
    .optional()
    .nullable(),

  confirmationMethod: confirmationMethodSchema.optional().nullable(),

  confirmedByUserId: z
    .string()
    .uuid(ERROR_MESSAGES.VISIT.INVALID_USER_ID)
    .optional()
    .nullable(),

  completedDateTime: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
      ERROR_MESSAGES.VISIT.INVALID_DATETIME
    )
    .optional()
    .nullable(),

  durationMinutes: z
    .number()
    .int()
    .min(1, ERROR_MESSAGES.VISIT.INVALID_DURATION)
    .max(480, ERROR_MESSAGES.VISIT.INVALID_DURATION)
    .optional()
    .nullable(),

  rejectionReasonId: z
    .string()
    .uuid(ERROR_MESSAGES.VISIT.INVALID_REJECTION_REASON_ID)
    .optional()
    .nullable(),

  notCompletedReasonId: z
    .string()
    .uuid(ERROR_MESSAGES.VISIT.INVALID_NOT_COMPLETED_REASON_ID)
    .optional()
    .nullable(),

  rescheduledFromVisitId: z
    .string()
    .uuid(ERROR_MESSAGES.VISIT.INVALID_VISIT_ID)
    .optional()
    .nullable(),

  checkInLocation: geoLocationSchema,
  checkOutLocation: geoLocationSchema,

  professionalNotes: z
    .string()
    .max(2000, ERROR_MESSAGES.VISIT.INVALID_PROFESSIONAL_NOTES)
    .optional()
    .nullable(),

  coordinatorNotes: z
    .string()
    .max(1000, ERROR_MESSAGES.VISIT.INVALID_COORDINATOR_NOTES)
    .optional()
    .nullable(),

  cancelledByUserId: z
    .string()
    .uuid(ERROR_MESSAGES.VISIT.INVALID_USER_ID)
    .optional()
    .nullable(),

  cancelledDateTime: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
      ERROR_MESSAGES.VISIT.INVALID_DATETIME
    )
    .optional()
    .nullable(),

  isActive: z.boolean().optional().default(true),
});

export const createVisitSchema = visitBaseSchema.extend({
  patientId: z.string().uuid(ERROR_MESSAGES.VISIT.INVALID_PATIENT_ID),

  journeyId: z.string().uuid(ERROR_MESSAGES.VISIT.INVALID_JOURNEY_ID),

  scheduledDateTime: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
      ERROR_MESSAGES.VISIT.INVALID_DATETIME
    ),

  orderInJourney: z
    .number()
    .int()
    .min(1, ERROR_MESSAGES.VISIT.INVALID_ORDER)
    .max(100, ERROR_MESSAGES.VISIT.INVALID_ORDER),
});

export const updateVisitSchema = visitBaseSchema.partial().strict();

// Esquemas específicos para acciones
export const confirmVisitSchema = z.object({
  confirmationStatusId: z
    .string()
    .uuid(ERROR_MESSAGES.VISIT.INVALID_CONFIRMATION_STATUS_ID),
  confirmationMethod: confirmationMethodSchema,
  rejectionReasonId: z
    .string()
    .uuid(ERROR_MESSAGES.VISIT.INVALID_REJECTION_REASON_ID)
    .optional(),
});

export const completeVisitSchema = z.object({
  durationMinutes: z
    .number()
    .int()
    .min(1, ERROR_MESSAGES.VISIT.INVALID_DURATION)
    .max(480, ERROR_MESSAGES.VISIT.INVALID_DURATION),
  professionalNotes: z
    .string()
    .max(2000, ERROR_MESSAGES.VISIT.INVALID_PROFESSIONAL_NOTES)
    .optional(),
  checkOutLocation: geoLocationSchema,
});

export const visitResponseSchema = visitBaseSchema.extend({
  id: z.string().uuid(),
  rescheduledToVisitId: z.string().uuid().optional().nullable(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  deletedAt: z.date().optional().nullable(),
});

export const visitFilterSchema = z.object({
  patientId: z.string().uuid().optional(),
  journeyId: z.string().uuid().optional(),
  professionalId: z.string().uuid().optional(),
  status: z.enum(VISIT_STATUS_VALUES as [string, ...string[]]).optional(),
  confirmationStatusId: z.string().uuid().optional(),
  scheduledFrom: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  scheduledTo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  isActive: z.boolean().optional(),
});

export type CreateVisitInput = z.infer<typeof createVisitSchema>;
export type UpdateVisitInput = z.infer<typeof updateVisitSchema>;
export type ConfirmVisitInput = z.infer<typeof confirmVisitSchema>;
export type CompleteVisitInput = z.infer<typeof completeVisitSchema>;
export type VisitResponse = z.infer<typeof visitResponseSchema>;

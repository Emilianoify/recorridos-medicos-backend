import z from 'zod';
import { ERROR_MESSAGES } from '../../../constants/messages/error.messages';
import { JourneyStatus } from '../../../enums/JourneyStatus';
import { dateStringSchema, optionalDateStringSchema } from './dateSchemas';
import { JOURNEY_STATUS_VALUES } from '../enumValidators';

// Esquema para enum
export const journeyStatusSchema = z.enum(
  JOURNEY_STATUS_VALUES as [string, ...string[]],
  {
    errorMap: () => ({ message: ERROR_MESSAGES.JOURNEY.INVALID_STATUS }),
  }
);

// Esquema para validar horarios (formato HH:MM)
export const timeSchema = z
  .string()
  .regex(
    /^([01]\d|2[0-3]):([0-5]\d)$/,
    ERROR_MESSAGES.JOURNEY.INVALID_TIME_FORMAT
  )
  .optional()
  .nullable();

// Schema base para Journey (sin refinamientos)
const journeyBaseObjectSchema = z.object({
  professionalId: z
    .string()
    .uuid(ERROR_MESSAGES.JOURNEY.INVALID_PROFESSIONAL_ID),

  date: dateStringSchema,

  zoneId: z.string().uuid(ERROR_MESSAGES.JOURNEY.INVALID_ZONE_ID),

  status: journeyStatusSchema.default(JourneyStatus.PLANNED),

  plannedStartTime: timeSchema,
  plannedEndTime: timeSchema,
  actualStartTime: timeSchema,
  actualEndTime: timeSchema,

  estimatedVisits: z
    .number()
    .int()
    .min(0, ERROR_MESSAGES.JOURNEY.INVALID_ESTIMATED_VISITS)
    .max(50, ERROR_MESSAGES.JOURNEY.INVALID_ESTIMATED_VISITS)
    .optional()
    .default(0),

  totalTravelDistance: z
    .number()
    .min(0, ERROR_MESSAGES.JOURNEY.INVALID_TRAVEL_DISTANCE)
    .max(9999.99, ERROR_MESSAGES.JOURNEY.INVALID_TRAVEL_DISTANCE)
    .optional()
    .nullable(),

  observations: z
    .string()
    .max(1000, ERROR_MESSAGES.JOURNEY.INVALID_OBSERVATIONS)
    .optional()
    .nullable(),

  isActive: z.boolean().optional().default(true),
});

// Schema base con refinamientos
export const journeyBaseSchema = journeyBaseObjectSchema
  .refine(
    data => {
      if (data.plannedStartTime && data.plannedEndTime) {
        return data.plannedEndTime > data.plannedStartTime;
      }
      return true;
    },
    {
      message: ERROR_MESSAGES.JOURNEY.END_TIME_BEFORE_START,
      path: ['plannedEndTime'],
    }
  )
  .refine(
    data => {
      if (data.actualStartTime && data.actualEndTime) {
        return data.actualEndTime > data.actualStartTime;
      }
      return true;
    },
    {
      message: ERROR_MESSAGES.JOURNEY.ACTUAL_END_TIME_BEFORE_START,
      path: ['actualEndTime'],
    }
  );

// Usa journeyBaseObjectSchema para extend y partial
export const createJourneySchema = journeyBaseObjectSchema
  .extend({
    // Puedes agregar campos adicionales aquí si es necesario
  })
  .superRefine((data, ctx) => {
    if (data.plannedStartTime && data.plannedEndTime) {
      if (data.plannedEndTime <= data.plannedStartTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: ERROR_MESSAGES.JOURNEY.END_TIME_BEFORE_START,
          path: ['plannedEndTime'],
        });
      }
    }
    if (data.actualStartTime && data.actualEndTime) {
      if (data.actualEndTime <= data.actualStartTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: ERROR_MESSAGES.JOURNEY.ACTUAL_END_TIME_BEFORE_START,
          path: ['actualEndTime'],
        });
      }
    }
  });

export const updateJourneySchema = journeyBaseObjectSchema.partial().strict();

export const journeyResponseSchema = journeyBaseObjectSchema.extend({
  id: z.string().uuid(),
  completedVisits: z.number().int().min(0),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  deletedAt: z.date().optional().nullable(),
});

export const journeyFilterSchema = z.object({
  professionalId: z.string().uuid().optional(),
  zoneId: z.string().uuid().optional(),
  status: z.enum(JOURNEY_STATUS_VALUES as [string, ...string[]]).optional(),
  dateFrom: optionalDateStringSchema,
  dateTo: optionalDateStringSchema,
  isActive: z.boolean().optional(),
});

export type CreateJourneyInput = z.infer<typeof createJourneySchema>;
export type UpdateJourneyInput = z.infer<typeof updateJourneySchema>;
export type JourneyResponse = z.infer<typeof journeyResponseSchema>;

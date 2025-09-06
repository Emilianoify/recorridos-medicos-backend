import z from 'zod';
import { ERROR_MESSAGES } from '../../../constants/messages/error.messages';

export const holidayBaseSchema = z.object({
  name: z
    .string()
    .min(2, ERROR_MESSAGES.HOLIDAY.INVALID_NAME)
    .max(100, ERROR_MESSAGES.HOLIDAY.INVALID_NAME)
    .regex(
      /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s.,'-]+$/,
      ERROR_MESSAGES.HOLIDAY.INVALID_NAME_FORMAT
    ),

  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, ERROR_MESSAGES.HOLIDAY.INVALID_DATE_FORMAT),

  description: z
    .string()
    .max(500, ERROR_MESSAGES.HOLIDAY.INVALID_DESCRIPTION)
    .optional()
    .nullable(),

  isRecurring: z.boolean().optional().default(false),

  affectsScheduling: z.boolean().optional().default(true),

  isActive: z.boolean().optional().default(true),
});

export const createHolidaySchema = holidayBaseSchema.extend({
  name: z
    .string()
    .min(2, ERROR_MESSAGES.HOLIDAY.INVALID_NAME)
    .max(100, ERROR_MESSAGES.HOLIDAY.INVALID_NAME)
    .regex(
      /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s.,'-]+$/,
      ERROR_MESSAGES.HOLIDAY.INVALID_NAME_FORMAT
    ),

  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, ERROR_MESSAGES.HOLIDAY.INVALID_DATE_FORMAT),
});

export const updateHolidaySchema = holidayBaseSchema.partial().strict();

export const holidayResponseSchema = holidayBaseSchema.extend({
  id: z.string().uuid(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  deletedAt: z.date().optional().nullable(),
});

export type CreateHolidayInput = z.infer<typeof createHolidaySchema>;
export type UpdateHolidayInput = z.infer<typeof updateHolidaySchema>;
export type HolidayResponse = z.infer<typeof holidayResponseSchema>;

import z from 'zod';
import { ERROR_MESSAGES } from '../../../constants/messages/error.messages';
import { CONFIG } from '../../../constants/config';
import { dateStringSchema } from './dateSchemas';

export const holidayBaseSchema = z.object({
  name: z
    .string()
    .min(2, ERROR_MESSAGES.HOLIDAY.INVALID_NAME)
    .max(100, ERROR_MESSAGES.HOLIDAY.INVALID_NAME)
    .regex(
      /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s.,'-]+$/,
      ERROR_MESSAGES.HOLIDAY.INVALID_NAME_FORMAT
    ),

  date: dateStringSchema,

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

  date: dateStringSchema,
});

export const updateHolidaySchema = holidayBaseSchema.partial().strict();

export const holidayResponseSchema = holidayBaseSchema.extend({
  id: z.string().uuid(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  deletedAt: z.date().optional().nullable(),
});

// Schema for sync holidays request
export const syncHolidaysSchema = z.object({
  year: z
    .number()
    .int()
    .min(CONFIG.HOLIDAYS.MIN_SYNC_YEAR, ERROR_MESSAGES.HOLIDAY.INVALID_YEAR)
    .max(CONFIG.HOLIDAYS.MAX_SYNC_YEAR, ERROR_MESSAGES.HOLIDAY.INVALID_YEAR),
  country: z.string().optional().default(CONFIG.HOLIDAYS.DEFAULT_COUNTRY),
  overwriteExisting: z.boolean().optional().default(false),
});

export type CreateHolidayInput = z.infer<typeof createHolidaySchema>;
export type UpdateHolidayInput = z.infer<typeof updateHolidaySchema>;
export type HolidayResponse = z.infer<typeof holidayResponseSchema>;
export type SyncHolidaysInput = z.infer<typeof syncHolidaysSchema>;

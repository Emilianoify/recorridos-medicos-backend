import { z } from 'zod';
import { ERROR_MESSAGES } from '../../../constants/messages/error.messages';
import {
  FrequencyType,
  NextDateCalculationRule,
} from '../../../enums/Frequency';
import {
  FREQUENCY_TYPE_VALUES,
  NEXT_CALCULATION_VALUES,
  FREQUENCY_INTERVAL_VALUES,
} from '../enumValidators';

// Esquemas para enums
export const frequencyTypeSchema = z.enum(
  FREQUENCY_TYPE_VALUES as [string, ...string[]],
  {
    errorMap: () => ({ message: ERROR_MESSAGES.FREQUENCY.INVALID_TYPE }),
  }
);

export const nextDateCalculationRuleSchema = z.enum(
  NEXT_CALCULATION_VALUES as [string, ...string[]],
  {
    errorMap: () => ({
      message: ERROR_MESSAGES.FREQUENCY.INVALID_CALCULATION_RULE,
    }),
  }
);

export const intervalUnitSchema = z.enum(
  FREQUENCY_INTERVAL_VALUES as [string, ...string[]],
  {
    errorMap: () => ({
      message: ERROR_MESSAGES.FREQUENCY.INVALID_INTERVAL_UNIT,
    }),
  }
);

// Esquema para validar patrones semanales
export const weeklyPatternSchema = z
  .object({
    monday: z.boolean().optional().default(false),
    tuesday: z.boolean().optional().default(false),
    wednesday: z.boolean().optional().default(false),
    thursday: z.boolean().optional().default(false),
    friday: z.boolean().optional().default(false),
    saturday: z.boolean().optional().default(false),
    sunday: z.boolean().optional().default(false),
  })
  .optional()
  .nullable();

// Esquema para horarios personalizados
export const customScheduleSchema = z
  .array(
    z.object({
      dayOfWeek: z.number().min(0).max(6), // 0 = domingo, 6 = sábado
      timeSlots: z
        .array(
          z.object({
            startTime: z
              .string()
              .regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido'),
            endTime: z
              .string()
              .regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido'),
          })
        )
        .optional(),
    })
  )
  .optional()
  .nullable();

// Schema base para Frequency
export const frequencyBaseSchema = z.object({
  name: z
    .string()
    .min(2, ERROR_MESSAGES.FREQUENCY.INVALID_NAME)
    .max(50, ERROR_MESSAGES.FREQUENCY.INVALID_NAME)
    .regex(
      /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\-.,()]+$/,
      ERROR_MESSAGES.FREQUENCY.INVALID_NAME_FORMAT
    ),

  description: z
    .string()
    .max(500, ERROR_MESSAGES.FREQUENCY.INVALID_DESCRIPTION)
    .optional()
    .nullable(),

  frequencyType: frequencyTypeSchema.default(FrequencyType.SIMPLE),

  nextDateCalculationRule: nextDateCalculationRuleSchema.default(
    NextDateCalculationRule.NEXT_BUSINESS_DAY
  ),

  // Para frecuencias simples
  daysBetweenVisits: z
    .number()
    .int()
    .min(1, ERROR_MESSAGES.FREQUENCY.INVALID_DAYS_BETWEEN)
    .max(365, ERROR_MESSAGES.FREQUENCY.INVALID_DAYS_BETWEEN)
    .optional()
    .nullable(),

  visitsPerMonth: z
    .number()
    .int()
    .min(1, ERROR_MESSAGES.FREQUENCY.INVALID_VISITS_PER_MONTH)
    .max(31, ERROR_MESSAGES.FREQUENCY.INVALID_VISITS_PER_MONTH)
    .optional()
    .nullable(),

  intervalValue: z
    .number()
    .int()
    .min(1, ERROR_MESSAGES.FREQUENCY.INVALID_INTERVAL_VALUE)
    .optional()
    .nullable(),

  intervalUnit: intervalUnitSchema.optional().nullable(),

  visitsPerDay: z
    .number()
    .int()
    .min(1, ERROR_MESSAGES.FREQUENCY.INVALID_VISITS_PER_DAY)
    .max(24, ERROR_MESSAGES.FREQUENCY.INVALID_VISITS_PER_DAY)
    .optional()
    .nullable(),

  weeklyPattern: weeklyPatternSchema,

  customSchedule: customScheduleSchema,

  // Configuraciones adicionales
  respectsHolidays: z.boolean().optional().default(true),
  allowsWeekends: z.boolean().optional().default(false),
  minHoursBetweenVisits: z.number().int().min(0).max(168).optional().nullable(),

  isActive: z.boolean().optional().default(true),
});

export const createFrequencySchema = frequencyBaseSchema.extend({
  name: z
    .string()
    .min(2, ERROR_MESSAGES.FREQUENCY.INVALID_NAME)
    .max(50, ERROR_MESSAGES.FREQUENCY.INVALID_NAME)
    .regex(
      /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\-.,()]+$/,
      ERROR_MESSAGES.FREQUENCY.INVALID_NAME_FORMAT
    ),
});

export const updateFrequencySchema = frequencyBaseSchema.partial().strict();

export const frequencyResponseSchema = frequencyBaseSchema.extend({
  id: z.string().uuid(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  deletedAt: z.date().optional().nullable(),
});

export type CreateFrequencyInput = z.infer<typeof createFrequencySchema>;
export type UpdateFrequencyInput = z.infer<typeof updateFrequencySchema>;
export type FrequencyResponse = z.infer<typeof frequencyResponseSchema>;

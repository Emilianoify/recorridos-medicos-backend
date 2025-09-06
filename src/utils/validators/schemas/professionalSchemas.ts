import { z } from 'zod';
import { ERROR_MESSAGES } from '../../../constants/messages/error.messages';
import { UserState } from '../../../enums/UserState';
import { USER_STATE_VALUES } from '../enumValidators';

// Schema para el estado del usuario (reutilizable)
export const professionalStateSchema = z.enum(
  USER_STATE_VALUES as [string, ...string[]],
  {
    errorMap: () => ({ message: ERROR_MESSAGES.PROFESSIONAL.INVALID_STATE }),
  }
);

// Schema para validar horarios (formato HHMM como number)
export const scheduleTimeSchema = z
  .number()
  .int(ERROR_MESSAGES.PROFESSIONAL.INVALID_SCHEDULE_FORMAT)
  .min(0, ERROR_MESSAGES.PROFESSIONAL.INVALID_SCHEDULE_RANGE)
  .max(2359, ERROR_MESSAGES.PROFESSIONAL.INVALID_SCHEDULE_RANGE)
  .refine(
    time => {
      const hours = Math.floor(time / 100);
      const minutes = time % 100;
      return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
    },
    {
      message: ERROR_MESSAGES.PROFESSIONAL.INVALID_SCHEDULE_FORMAT,
    }
  )
  .optional()
  .nullable();

// Schema base para validaciones comunes de Professional
export const professionalBaseSchema = z.object({
  username: z
    .string()
    .min(3, ERROR_MESSAGES.PROFESSIONAL.INVALID_USERNAME)
    .max(50, ERROR_MESSAGES.PROFESSIONAL.INVALID_USERNAME)
    .regex(
      /^[a-zA-Z0-9_]+$/,
      ERROR_MESSAGES.PROFESSIONAL.INVALID_USERNAME_FORMAT
    )
    .optional()
    .nullable()
    .transform(val => (val === '' ? null : val)),

  firstname: z
    .string()
    .min(2, ERROR_MESSAGES.PROFESSIONAL.INVALID_FIRSTNAME)
    .max(100, ERROR_MESSAGES.PROFESSIONAL.INVALID_FIRSTNAME)
    .regex(
      /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
      ERROR_MESSAGES.PROFESSIONAL.INVALID_FIRSTNAME_FORMAT
    ),

  lastname: z
    .string()
    .min(2, ERROR_MESSAGES.PROFESSIONAL.INVALID_LASTNAME)
    .max(100, ERROR_MESSAGES.PROFESSIONAL.INVALID_LASTNAME)
    .regex(
      /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
      ERROR_MESSAGES.PROFESSIONAL.INVALID_LASTNAME_FORMAT
    ),

  phone: z
    .string()
    .min(8, ERROR_MESSAGES.PROFESSIONAL.INVALID_PHONE)
    .max(20, ERROR_MESSAGES.PROFESSIONAL.INVALID_PHONE)
    .regex(
      /^(\+?\d{1,3}[-.\s]?)?(\(?\d{1,4}\)?[-.\s]?)?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/,
      ERROR_MESSAGES.PROFESSIONAL.INVALID_PHONE_FORMAT
    ),

  email: z
    .string()
    .email(ERROR_MESSAGES.PROFESSIONAL.INVALID_EMAIL)
    .min(5, ERROR_MESSAGES.PROFESSIONAL.INVALID_EMAIL)
    .max(255, ERROR_MESSAGES.PROFESSIONAL.INVALID_EMAIL),

  specialtyId: z
    .string()
    .uuid(ERROR_MESSAGES.PROFESSIONAL.INVALID_SPECIALTY_ID),

  start_at: scheduleTimeSchema,

  finish_at: scheduleTimeSchema,

  state: professionalStateSchema.optional().default(UserState.ACTIVE),
});

// Schema para crear un nuevo profesional
export const createProfessionalSchema = professionalBaseSchema
  .extend({
    // Campos requeridos para creación
    firstname: z
      .string()
      .min(2, ERROR_MESSAGES.PROFESSIONAL.INVALID_FIRSTNAME)
      .max(100, ERROR_MESSAGES.PROFESSIONAL.INVALID_FIRSTNAME)
      .regex(
        /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
        ERROR_MESSAGES.PROFESSIONAL.INVALID_FIRSTNAME_FORMAT
      ),

    lastname: z
      .string()
      .min(2, ERROR_MESSAGES.PROFESSIONAL.INVALID_LASTNAME)
      .max(100, ERROR_MESSAGES.PROFESSIONAL.INVALID_LASTNAME)
      .regex(
        /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
        ERROR_MESSAGES.PROFESSIONAL.INVALID_LASTNAME_FORMAT
      ),

    email: z
      .string()
      .email(ERROR_MESSAGES.PROFESSIONAL.INVALID_EMAIL)
      .min(5, ERROR_MESSAGES.PROFESSIONAL.INVALID_EMAIL)
      .max(255, ERROR_MESSAGES.PROFESSIONAL.INVALID_EMAIL),

    specialtyId: z
      .string()
      .uuid(ERROR_MESSAGES.PROFESSIONAL.INVALID_SPECIALTY_ID),
  })
  .strict()
  .refine(
    data => {
      // Validar que si hay horarios, finish_at sea posterior a start_at
      if (data.start_at && data.finish_at) {
        return data.finish_at > data.start_at;
      }
      return true;
    },
    {
      message: ERROR_MESSAGES.PROFESSIONAL.SCHEDULE_END_BEFORE_START,
      path: ['finish_at'],
    }
  );

// Schema para actualizar un profesional (todos los campos opcionales)
export const updateProfessionalSchema = professionalBaseSchema
  .partial()
  .extend({
    // Permitir que todos los campos sean opcionales para actualización
    firstname: z
      .string()
      .min(2, ERROR_MESSAGES.PROFESSIONAL.INVALID_FIRSTNAME)
      .max(100, ERROR_MESSAGES.PROFESSIONAL.INVALID_FIRSTNAME)
      .regex(
        /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
        ERROR_MESSAGES.PROFESSIONAL.INVALID_FIRSTNAME_FORMAT
      )
      .optional(),

    lastname: z
      .string()
      .min(2, ERROR_MESSAGES.PROFESSIONAL.INVALID_LASTNAME)
      .max(100, ERROR_MESSAGES.PROFESSIONAL.INVALID_LASTNAME)
      .regex(
        /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
        ERROR_MESSAGES.PROFESSIONAL.INVALID_LASTNAME_FORMAT
      )
      .optional(),

    email: z
      .string()
      .email(ERROR_MESSAGES.PROFESSIONAL.INVALID_EMAIL)
      .min(5, ERROR_MESSAGES.PROFESSIONAL.INVALID_EMAIL)
      .max(255, ERROR_MESSAGES.PROFESSIONAL.INVALID_EMAIL)
      .optional(),

    specialtyId: z
      .string()
      .uuid(ERROR_MESSAGES.PROFESSIONAL.INVALID_SPECIALTY_ID)
      .optional(),
  })
  .strict()
  .refine(
    data => {
      // Si se proporcionan ambos horarios, validar que finish_at > start_at
      if (data.start_at && data.finish_at) {
        return data.finish_at > data.start_at;
      }
      return true;
    },
    {
      message: ERROR_MESSAGES.PROFESSIONAL.SCHEDULE_END_BEFORE_START,
      path: ['finish_at'],
    }
  );

// Schema para validar solo el username
export const professionalUsernameSchema = z.object({
  username: z
    .string()
    .min(3, ERROR_MESSAGES.PROFESSIONAL.INVALID_USERNAME)
    .max(50, ERROR_MESSAGES.PROFESSIONAL.INVALID_USERNAME)
    .regex(
      /^[a-zA-Z0-9_]+$/,
      ERROR_MESSAGES.PROFESSIONAL.INVALID_USERNAME_FORMAT
    ),
});

// Schema para validar solo el email
export const professionalEmailSchema = z.object({
  email: z
    .string()
    .email(ERROR_MESSAGES.PROFESSIONAL.INVALID_EMAIL)
    .min(5, ERROR_MESSAGES.PROFESSIONAL.INVALID_EMAIL)
    .max(255, ERROR_MESSAGES.PROFESSIONAL.INVALID_EMAIL),
});

// Schema para validar horarios
export const professionalScheduleSchema = z
  .object({
    start_at: scheduleTimeSchema,
    finish_at: scheduleTimeSchema,
  })
  .refine(
    data => {
      if (data.start_at && data.finish_at) {
        return data.finish_at > data.start_at;
      }
      return true;
    },
    {
      message: ERROR_MESSAGES.PROFESSIONAL.SCHEDULE_END_BEFORE_START,
      path: ['finish_at'],
    }
  );

// Schema para respuesta (incluye campos automáticos)
export const professionalResponseSchema = professionalBaseSchema.extend({
  id: z.string().uuid(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  deletedAt: z.date().optional().nullable(),
});

export const professionalFilterSchema = z.object({
  specialtyId: z.string().uuid().optional(),
  state: z.enum(USER_STATE_VALUES as [string, ...string[]]).optional(),
  search: z.string().min(1).max(100).optional(),
  hasSchedule: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

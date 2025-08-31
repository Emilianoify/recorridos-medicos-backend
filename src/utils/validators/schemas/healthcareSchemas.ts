import { z } from 'zod';
import { ERROR_MESSAGES } from '../../../constants/messages/error.messages';
// Schema base para validaciones comunes
export const healthcareProviderBaseSchema = z.object({
  name: z
    .string()
    .min(2, ERROR_MESSAGES.HEALTHCARE_PROVIDER.INVALID_NAME)
    .max(150, ERROR_MESSAGES.HEALTHCARE_PROVIDER.INVALID_NAME)
    .regex(
      /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-&.,()0-9]+$/,
      ERROR_MESSAGES.HEALTHCARE_PROVIDER.INVALID_NAME_FORMAT
    ),

  code: z
    .string()
    .min(2, ERROR_MESSAGES.HEALTHCARE_PROVIDER.INVALID_CODE)
    .max(20, ERROR_MESSAGES.HEALTHCARE_PROVIDER.INVALID_CODE)
    .regex(
      /^[a-zA-Z0-9\-_]+$/,
      ERROR_MESSAGES.HEALTHCARE_PROVIDER.INVALID_CODE_FORMAT
    )
    .optional()
    .nullable()
    .transform(val => (val === '' ? null : val)),

  isActive: z.boolean().optional().default(true),
});

// Schema para crear un nuevo proveedor de salud
export const createHealthcareProviderSchema = healthcareProviderBaseSchema
  .extend({
    name: z
      .string()
      .min(2, ERROR_MESSAGES.HEALTHCARE_PROVIDER.INVALID_NAME)
      .max(150, ERROR_MESSAGES.HEALTHCARE_PROVIDER.INVALID_NAME)
      .regex(
        /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-&.,()0-9]+$/,
        ERROR_MESSAGES.HEALTHCARE_PROVIDER.INVALID_NAME_FORMAT
      ),

    code: z
      .string()
      .min(2, ERROR_MESSAGES.HEALTHCARE_PROVIDER.INVALID_CODE)
      .max(20, ERROR_MESSAGES.HEALTHCARE_PROVIDER.INVALID_CODE)
      .regex(
        /^[a-zA-Z0-9\-_]+$/,
        ERROR_MESSAGES.HEALTHCARE_PROVIDER.INVALID_CODE_FORMAT
      )
      .optional()
      .nullable()
      .transform(val => (val === '' ? null : val)),
  })
  .strict();

// Schema para actualizar un proveedor de salud
export const updateHealthcareProviderSchema = healthcareProviderBaseSchema
  .partial()
  .strict();

// Schema para validar el nombre del proveedor
export const healthcareProviderNameSchema = z.object({
  name: z
    .string()
    .min(2, ERROR_MESSAGES.HEALTHCARE_PROVIDER.INVALID_NAME)
    .max(150, ERROR_MESSAGES.HEALTHCARE_PROVIDER.INVALID_NAME)
    .regex(
      /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-&.,()0-9]+$/,
      ERROR_MESSAGES.HEALTHCARE_PROVIDER.INVALID_NAME_FORMAT
    ),
});

// Schema para validar el código del proveedor
export const healthcareProviderCodeSchema = z.object({
  code: z
    .string()
    .min(2, ERROR_MESSAGES.HEALTHCARE_PROVIDER.INVALID_CODE)
    .max(20, ERROR_MESSAGES.HEALTHCARE_PROVIDER.INVALID_CODE)
    .regex(
      /^[a-zA-Z0-9\-_]+$/,
      ERROR_MESSAGES.HEALTHCARE_PROVIDER.INVALID_CODE_FORMAT
    ),
});

// Schema para respuesta (incluye campos automáticos)
export const healthcareProviderResponseSchema =
  healthcareProviderBaseSchema.extend({
    id: z.string().uuid(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
    deletedAt: z.date().optional().nullable(),
  });

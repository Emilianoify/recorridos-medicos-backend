import { z } from 'zod';
import { ERROR_MESSAGES } from '../../../constants/messages/error.messages';

export const paginationSchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/, ERROR_MESSAGES.PAGINATION.INVALID_PAGE)
    .transform(val => parseInt(val, 10))
    .refine(val => val >= 1, ERROR_MESSAGES.PAGINATION.PAGE_TOO_SMALL)
    .optional()
    .default('1'),

  limit: z
    .string()
    .regex(/^\d+$/, ERROR_MESSAGES.PAGINATION.INVALID_LIMIT)
    .transform(val => parseInt(val, 10))
    .refine(
      val => val >= 1 && val <= 100,
      ERROR_MESSAGES.PAGINATION.LIMIT_OUT_OF_RANGE
    )
    .optional()
    .default('10'),
  search: z.string().min(1).max(100).optional(),
  sortBy: z
    .string()
    .min(1, ERROR_MESSAGES.PAGINATION.INVALID_SORT_BY)
    .max(50, ERROR_MESSAGES.PAGINATION.INVALID_SORT_BY)
    .optional(),

  sortOrder: z
    .enum(['asc', 'desc'], {
      errorMap: () => ({
        message: ERROR_MESSAGES.PAGINATION.INVALID_SORT_ORDER,
      }),
    })
    .optional()
    .default('asc'),
});

// Schemas específicos para cada entidad
export const userFilterSchema = z.object({
  roleId: z.string().uuid().optional(),
  state: z
    .enum(['usuario_activo', 'usuario_inactivo', 'usuario_suspendido'])
    .optional(),
  search: z.string().min(1).max(100).optional(),
  isActive: z.enum(['true', 'false']).optional(),
  createdFrom: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  createdTo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export const roleFilterSchema = z.object({
  isActive: z.enum(['true', 'false']).optional(),
  search: z.string().min(1).max(100).optional(),
});

export const specialtyFilterSchema = z.object({
  isActive: z.enum(['true', 'false']).optional(),
  search: z.string().min(1).max(100).optional(),
});

export const healthcareProviderFilterSchema = z.object({
  isActive: z.enum(['true', 'false']).optional(),
  search: z.string().min(1).max(100).optional(),
  hasCode: z.enum(['true', 'false']).optional(),
});

export const professionalFilterSchema = z.object({
  specialtyId: z.string().uuid().optional(),
  state: z
    .enum(['profesional_activo', 'profesional_inactivo', 'profesional_suspendido', 'profesional_licencia', 'profesional_desvinculado'])
    .optional(),
  search: z.string().min(1).max(100).optional(),
  hasSchedule: z.enum(['true', 'false']).optional(),
  isActive: z.enum(['true', 'false']).optional(),
});
export const zoneFilterSchema = z.object({
  isActive: z.enum(['true', 'false']).optional(),
  search: z.string().min(1).max(100).optional(),
  hasCoordinates: z.enum(['true', 'false']).optional(),
});

export const holidayFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  year: z.coerce.number().int().min(2020).max(2050).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  fromDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  toDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  isActive: z.coerce.boolean().optional(),
});

const auditFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  entityType: z.string().optional(),
  entityId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  action: z.string().optional(),
  fromDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  toDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export const isWorkingDayFilterSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, ERROR_MESSAGES.HOLIDAY.INVALID_DATE_FORMAT),
});

export const patientFilterSchema = z.object({
  zoneId: z.string().uuid().optional(),
  frequencyId: z.string().uuid().optional(),
  primaryProfessionalId: z.string().uuid().optional(),
  healthcareProviderId: z.string().uuid().optional(),
  state: z
    .enum([
      'activo',
      'inactivo',
      'internado',
      'sin_autorizacion',
      'suspendido',
      'alta',
    ])
    .optional(),
  locality: z.string().min(1).max(100).optional(),
  requiresConfirmation: z.enum(['true', 'false']).optional(),
  search: z.string().min(1).max(100).optional(),
  hasUpcomingVisit: z.enum(['true', 'false']).optional(),
  authorizationExpired: z.enum(['true', 'false']).optional(),
});

// Frequency schemas
export const frequencyFilterSchema = z.object({
  search: z.string().min(1).max(100).optional(),
  type: z.enum(['SIMPLE', 'HOURLY', 'DAILY_MULTIPLE', 'WEEKLY_PATTERN', 'CUSTOM']).optional(),
  isActive: z.enum(['true', 'false']).optional(),
});

// Patient zone queries
export const patientsByZoneFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().min(1).max(100).optional(),
  state: z.enum(['activo', 'inactivo', 'internado', 'sin_autorizacion', 'suspendido', 'alta']).optional(),
  includeInactive: z.enum(['true', 'false']).default('false'),
});

// Combinar paginación con filtros específicos
export const patientQuerySchema = paginationSchema.merge(patientFilterSchema);
export const frequencyQuerySchema = paginationSchema.merge(frequencyFilterSchema);
export const isWorkingDayQuerySchema = isWorkingDayFilterSchema;
export const auditQuerySchema = auditFilterSchema;
export const holidayQuerySchema = holidayFilterSchema;
export const zoneQuerySchema = paginationSchema.merge(zoneFilterSchema);
export const userQuerySchema = paginationSchema.merge(userFilterSchema);
export const roleQuerySchema = paginationSchema.merge(roleFilterSchema);
export const specialtyQuerySchema = paginationSchema.merge(
  specialtyFilterSchema
);
export const healthcareProviderQuerySchema = paginationSchema.merge(
  healthcareProviderFilterSchema
);
export const professionalQuerySchema = paginationSchema.merge(
  professionalFilterSchema
);

// Specific query schemas para params
export const getPatientsByZoneParamsSchema = z.object({
  zoneId: z.string().uuid(ERROR_MESSAGES.PATIENT.INVALID_ZONE_ID),
});

export const getPatientsByZoneQuerySchema = patientsByZoneFilterSchema;

// Types
export type PaginationInput = z.infer<typeof paginationSchema>;
export type UserQueryInput = z.infer<typeof userQuerySchema>;
export type RoleQueryInput = z.infer<typeof roleQuerySchema>;
export type SpecialtyQueryInput = z.infer<typeof specialtyQuerySchema>;
export type HealthcareProviderQueryInput = z.infer<
  typeof healthcareProviderQuerySchema
>;
export type ProfessionalQueryInput = z.infer<typeof professionalQuerySchema>;

export type ZoneQueryInput = z.infer<typeof zoneQuerySchema>;

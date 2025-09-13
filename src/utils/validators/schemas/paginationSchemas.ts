import { z } from 'zod';
import { ERROR_MESSAGES } from '../../../constants/messages/error.messages';
import { dateStringSchema, optionalDateStringSchema } from './dateSchemas';

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
    .optional()
    .default('createdAt'),

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
  createdFrom: optionalDateStringSchema,
  createdTo: optionalDateStringSchema,
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
    .enum([
      'profesional_activo',
      'profesional_inactivo',
      'profesional_suspendido',
      'profesional_licencia',
      'profesional_desvinculado',
    ])
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
  fromDate: optionalDateStringSchema,
  toDate: optionalDateStringSchema,
  isActive: z.coerce.boolean().optional(),
});

const auditFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  entityType: z.string().optional(),
  entityId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  action: z.string().optional(),
  fromDate: optionalDateStringSchema,
  toDate: optionalDateStringSchema,
});

export const isWorkingDayFilterSchema = z.object({
  date: dateStringSchema,
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
  type: z
    .enum(['SIMPLE', 'HOURLY', 'DAILY_MULTIPLE', 'WEEKLY_PATTERN', 'CUSTOM'])
    .optional(),
  isActive: z.enum(['true', 'false']).optional(),
});

// Patient zone queries
export const patientsByZoneFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().min(1).max(100).optional(),
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
  includeInactive: z.enum(['true', 'false']).default('false'),
});

// Combinar paginación con filtros específicos
export const patientQuerySchema = paginationSchema.merge(patientFilterSchema);
export const frequencyQuerySchema = paginationSchema.merge(
  frequencyFilterSchema
);
export const isWorkingDayQuerySchema = paginationSchema.merge(
  isWorkingDayFilterSchema
);
export const auditQuerySchema = paginationSchema.merge(auditFilterSchema);
export const holidayQuerySchema = paginationSchema.merge(holidayFilterSchema);
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

export const getPatientsByZoneQuerySchema = paginationSchema.merge(
  patientsByZoneFilterSchema
);

// Visit filters and queries
export const visitFilterSchema = z.object({
  patientId: z.string().uuid().optional(),
  journeyId: z.string().uuid().optional(),
  professionalId: z.string().uuid().optional(),
  zoneId: z.string().uuid().optional(),
  status: z
    .enum([
      'scheduled',
      'confirmed',
      'completed',
      'cancelled',
      'not_present',
      'rescheduled',
    ])
    .optional(),
  confirmationStatusId: z.string().uuid().optional(),
  scheduledFrom: optionalDateStringSchema,
  scheduledTo: optionalDateStringSchema,
  completedFrom: optionalDateStringSchema,
  completedTo: optionalDateStringSchema,
  isActive: z.enum(['true', 'false']).optional(),
  includeInactive: z.enum(['true', 'false']).optional(),
});

export const visitsByPatientFilterSchema = z.object({
  includeInactive: z.enum(['true', 'false']).optional(),
  status: z
    .enum([
      'scheduled',
      'confirmed',
      'completed',
      'cancelled',
      'not_present',
      'rescheduled',
    ])
    .optional(),
  dateFrom: optionalDateStringSchema,
  dateTo: optionalDateStringSchema,
});

export const visitsByJourneyFilterSchema = z.object({
  includeInactive: z.enum(['true', 'false']).optional(),
  status: z
    .enum([
      'scheduled',
      'confirmed',
      'completed',
      'cancelled',
      'not_present',
      'rescheduled',
    ])
    .optional(),
});

export const visitsByStatusFilterSchema = z.object({
  zoneId: z.string().uuid().optional(),
  professionalId: z.string().uuid().optional(),
  dateFrom: optionalDateStringSchema,
  dateTo: optionalDateStringSchema,
  includeInactive: z.enum(['true', 'false']).optional(),
});

// Combined visit query schemas
export const visitQuerySchema = paginationSchema.merge(visitFilterSchema);
export const visitsByPatientQuerySchema = paginationSchema.merge(
  visitsByPatientFilterSchema
);
export const visitsByJourneyQuerySchema = visitsByJourneyFilterSchema;
export const visitsByStatusQuerySchema = paginationSchema.merge(
  visitsByStatusFilterSchema
);

// Param schemas for visit endpoints
export const getVisitByIdParamsSchema = z.object({
  id: z.string().uuid(ERROR_MESSAGES.VISIT.INVALID_VISIT_ID),
});

export const getVisitsByPatientParamsSchema = z.object({
  patientId: z.string().uuid(ERROR_MESSAGES.VISIT.INVALID_PATIENT_ID),
});

export const getVisitsByJourneyParamsSchema = z.object({
  journeyId: z.string().uuid(ERROR_MESSAGES.VISIT.INVALID_JOURNEY_ID),
});

export const getVisitsByStatusParamsSchema = z.object({
  status: z.enum(
    [
      'scheduled',
      'confirmed',
      'completed',
      'cancelled',
      'not_present',
      'rescheduled',
    ],
    {
      errorMap: () => ({ message: ERROR_MESSAGES.VISIT.INVALID_STATUS }),
    }
  ),
});

// Journey filters and queries
export const journeyFilterSchema = z.object({
  professionalId: z.string().uuid().optional(),
  zoneId: z.string().uuid().optional(),
  status: z
    .enum(['planificado', 'en_curso', 'completado', 'cancelado', 'pausado'])
    .optional(),
  dateFrom: optionalDateStringSchema,
  dateTo: optionalDateStringSchema,
  isActive: z.boolean().optional(),
});

export const journeysByDateFilterSchema = z.object({
  date: dateStringSchema,
  professionalId: z.string().uuid().optional(),
  zoneId: z.string().uuid().optional(),
  status: z
    .enum(['planificado', 'en_curso', 'completado', 'cancelado', 'pausado'])
    .optional(),
  isActive: z.boolean().optional(),
});

export const journeysByProfessionalFilterSchema = z.object({
  zoneId: z.string().uuid().optional(),
  status: z
    .enum(['planificado', 'en_curso', 'completado', 'cancelado', 'pausado'])
    .optional(),
  dateFrom: optionalDateStringSchema,
  dateTo: optionalDateStringSchema,
  isActive: z.boolean().optional(),
});

// Combined journey query schemas
export const journeyQuerySchema = paginationSchema.merge(journeyFilterSchema);
export const journeysByDateQuerySchema = paginationSchema.merge(
  journeysByDateFilterSchema
);
export const journeysByProfessionalQuerySchema = paginationSchema.merge(
  journeysByProfessionalFilterSchema
);

// Journey param schemas
export const getJourneyByIdParamsSchema = z.object({
  id: z.string().uuid(ERROR_MESSAGES.JOURNEY.INVALID_ID),
});

export const getJourneysByProfessionalParamsSchema = z.object({
  professionalId: z
    .string()
    .uuid(ERROR_MESSAGES.JOURNEY.INVALID_PROFESSIONAL_ID),
});

export const startJourneyParamsSchema = z.object({
  id: z.string().uuid(ERROR_MESSAGES.JOURNEY.INVALID_ID),
});

export const startJourneySchema = z.object({
  actualStartTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .optional(),
  observations: z.string().max(1000).optional(),
});

export const cancelVisitSchema = z.object({
  rejectionReasonId: z
    .string()
    .uuid(ERROR_MESSAGES.VISIT.INVALID_REJECTION_REASON_ID)
    .optional(),
  coordinatorNotes: z
    .string()
    .max(1000, ERROR_MESSAGES.VISIT.INVALID_COORDINATOR_NOTES)
    .optional(),
});

export const calculateNextVisitParamsSchema = z.object({
  id: z.string().uuid(ERROR_MESSAGES.PATIENT.INVALID_ID),
});

export const calculateNextVisitQuerySchema = z.object({
  fromDate: optionalDateStringSchema,
  updatePatient: z.coerce.boolean().default(false),
});

export const getPatientVisitHistoryParamsSchema = z.object({
  id: z.string().uuid(ERROR_MESSAGES.PATIENT.INVALID_ID),
});

export const getPatientVisitHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.string().optional(),
  fromDate: optionalDateStringSchema,
  toDate: optionalDateStringSchema,
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const updatePatientParamsSchema = z.object({
  id: z.string().uuid(ERROR_MESSAGES.PATIENT.INVALID_ID),
});

export const updatePatientAuthorizationParamsSchema = z.object({
  id: z.string().uuid(ERROR_MESSAGES.PATIENT.INVALID_ID),
});

export const updateAuthorizationSchema = z.object({
  lastAuthorizationDate: dateStringSchema,
  authorizedVisitsPerMonth: z
    .number()
    .int()
    .min(0, ERROR_MESSAGES.PATIENT.INVALID_AUTHORIZED_VISITS)
    .max(31, ERROR_MESSAGES.PATIENT.INVALID_AUTHORIZED_VISITS),
  resetCompletedVisits: z.boolean().default(false),
});

export const getPatientsByFrequencyParamsSchema = z.object({
  frequencyId: z.string().uuid(ERROR_MESSAGES.PATIENT.INVALID_FREQUENCY_ID),
});

export const getPatientsByFrequencyQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  zoneId: z.string().uuid().optional(),
  state: z.string().optional(),
  search: z.string().optional(),
  includeInactive: z.coerce.boolean().default(false),
});

export const deletePatientParamsSchema = z.object({
  id: z.string().uuid(ERROR_MESSAGES.PATIENT.INVALID_ID),
});

export const getPatientByIdParamsSchema = z.object({
  id: z.string().uuid(ERROR_MESSAGES.PATIENT.INVALID_ID),
});

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
export type VisitQueryInput = z.infer<typeof visitQuerySchema>;
export type VisitsByPatientQueryInput = z.infer<
  typeof visitsByPatientQuerySchema
>;
export type VisitsByJourneyQueryInput = z.infer<
  typeof visitsByJourneyQuerySchema
>;
export type VisitsByStatusQueryInput = z.infer<
  typeof visitsByStatusQuerySchema
>;
export type JourneyQueryInput = z.infer<typeof journeyQuerySchema>;
export type JourneysByDateQueryInput = z.infer<
  typeof journeysByDateQuerySchema
>;
export type JourneysByProfessionalQueryInput = z.infer<
  typeof journeysByProfessionalQuerySchema
>;

// Audit specific schemas
const complianceReportFilterSchema = z.object({
  fromDate: optionalDateStringSchema,
  toDate: optionalDateStringSchema,
  entityType: z
    .enum(['visita', 'recorrido', 'paciente', 'profesional', 'usuario'])
    .optional(),
  criticalActionsOnly: z.coerce.boolean().default(false),
});

const entityHistoryFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  entityType: z.enum([
    'visita',
    'recorrido',
    'paciente',
    'profesional',
    'usuario',
  ]),
  entityId: z.string().uuid(),
  fromDate: optionalDateStringSchema,
  toDate: optionalDateStringSchema,
  action: z
    .enum([
      'creado',
      'actualizado',
      'eliminado',
      'restaurado',
      'confirmado',
      'cancelado',
      'reprogramado',
      'completado',
      'inicio_recorrido',
      'fin_recorrido',
    ])
    .optional(),
});

const userActivityFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  userId: z.string().uuid(),
  fromDate: optionalDateStringSchema,
  toDate: optionalDateStringSchema,
  entityType: z
    .enum(['visita', 'recorrido', 'paciente', 'profesional', 'usuario'])
    .optional(),
  action: z
    .enum([
      'creado',
      'actualizado',
      'eliminado',
      'restaurado',
      'confirmado',
      'cancelado',
      'reprogramado',
      'completado',
      'inicio_recorrido',
      'fin_recorrido',
    ])
    .optional(),
});

// Export audit schemas
export const complianceReportQuerySchema = complianceReportFilterSchema;
export const entityHistoryQuerySchema = entityHistoryFilterSchema;
export const userActivityQuerySchema = userActivityFilterSchema;

// Audit param schemas
export const getEntityHistoryParamsSchema = z.object({
  entityType: z.enum(
    ['visita', 'recorrido', 'paciente', 'profesional', 'usuario'],
    {
      errorMap: () => ({ message: ERROR_MESSAGES.AUDIT.INVALID_ENTITY }),
    }
  ),
  entityId: z.string().uuid(ERROR_MESSAGES.AUDIT.INVALID_ENTITY_ID),
});

export const getUserActivityParamsSchema = z.object({
  userId: z.string().uuid(ERROR_MESSAGES.AUDIT.INVALID_USER_ID),
});

export const generateOptimalRouteSchema = z.object({
  algorithm: z
    .enum(['nearest_neighbor', 'greedy'], {
      errorMap: () => ({ message: ERROR_MESSAGES.JOURNEY.INVALID_ALGORITHM }),
    })
    .optional()
    .default('nearest_neighbor'),
  includeReturnToOrigin: z.coerce.boolean().default(true),
});

// Report query schemas
const reportDateRangeSchema = z.object({
  fromDate: optionalDateStringSchema,
  toDate: optionalDateStringSchema,
});

export const operationalKPIsQuerySchema = reportDateRangeSchema.extend({
  includeInactive: z.coerce.boolean().default(false),
});

export const patientStatsQuerySchema = reportDateRangeSchema.extend({
  zoneId: z.string().uuid().optional(),
  professionalId: z.string().uuid().optional(),
  includeInactive: z.coerce.boolean().default(false),
});

export const productivityReportQuerySchema = reportDateRangeSchema.extend({
  professionalId: z.string().uuid().optional(),
  zoneId: z.string().uuid().optional(),
  includeDetails: z.coerce.boolean().default(false),
});

export const professionalPerformanceQuerySchema = reportDateRangeSchema.extend({
  professionalId: z.string().uuid().optional(),
  specialtyId: z.string().uuid().optional(),
  includeComparisons: z.coerce.boolean().default(false),
});

export const visitCompletionReportQuerySchema = reportDateRangeSchema.extend({
  professionalId: z.string().uuid().optional(),
  zoneId: z.string().uuid().optional(),
  status: z
    .enum([
      'scheduled',
      'confirmed',
      'completed',
      'cancelled',
      'not_present',
      'rescheduled',
    ])
    .optional(),
  groupBy: z
    .enum(['professional', 'zone', 'day', 'week', 'month'])
    .default('day'),
});

// Audit types
export type ComplianceReportQueryInput = z.infer<
  typeof complianceReportQuerySchema
>;
export type EntityHistoryQueryInput = z.infer<typeof entityHistoryQuerySchema>;
export type UserActivityQueryInput = z.infer<typeof userActivityQuerySchema>;

// Report types
export type OperationalKPIsQueryInput = z.infer<
  typeof operationalKPIsQuerySchema
>;
export type PatientStatsQueryInput = z.infer<typeof patientStatsQuerySchema>;
export type ProductivityReportQueryInput = z.infer<
  typeof productivityReportQuerySchema
>;
export type ProfessionalPerformanceQueryInput = z.infer<
  typeof professionalPerformanceQuerySchema
>;
export type VisitCompletionReportQueryInput = z.infer<
  typeof visitCompletionReportQuerySchema
>;

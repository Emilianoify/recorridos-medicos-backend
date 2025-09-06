import { PatientState } from '../../../enums/PatientState';
import { PATIENT_STATE_VALUES, CONTACT_METHOD_VALUES } from '../enumValidators';
import { ERROR_MESSAGES } from '../../../constants/messages/error.messages';
import z from 'zod';

// Esquemas para enums
export const patientStateSchema = z.enum(
  PATIENT_STATE_VALUES as [string, ...string[]],
  {
    errorMap: () => ({ message: ERROR_MESSAGES.PATIENT.INVALID_STATE }),
  }
);

export const contactMethodSchema = z.enum(
  CONTACT_METHOD_VALUES as [string, ...string[]],
  {
    errorMap: () => ({
      message: ERROR_MESSAGES.PATIENT.INVALID_CONTACT_METHOD,
    }),
  }
);

// Schema base para Patient
export const patientBaseSchema = z.object({
  fullName: z
    .string()
    .min(2, ERROR_MESSAGES.PATIENT.INVALID_FULLNAME)
    .max(200, ERROR_MESSAGES.PATIENT.INVALID_FULLNAME)
    .regex(
      /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s.,'-]+$/,
      ERROR_MESSAGES.PATIENT.INVALID_FULLNAME_FORMAT
    ),

  healthcareId: z
    .string()
    .min(2, ERROR_MESSAGES.PATIENT.INVALID_HEALTHCARE_ID)
    .max(50, ERROR_MESSAGES.PATIENT.INVALID_HEALTHCARE_ID)
    .regex(
      /^[a-zA-Z0-9\-_\/]+$/,
      ERROR_MESSAGES.PATIENT.INVALID_HEALTHCARE_ID_FORMAT
    ),

  healthcareProviderId: z
    .string()
    .uuid(ERROR_MESSAGES.PATIENT.INVALID_HEALTHCARE_PROVIDER_ID),

  address: z
    .string()
    .min(5, ERROR_MESSAGES.PATIENT.INVALID_ADDRESS)
    .max(200, ERROR_MESSAGES.PATIENT.INVALID_ADDRESS),

  locality: z
    .string()
    .min(2, ERROR_MESSAGES.PATIENT.INVALID_LOCALITY)
    .max(100, ERROR_MESSAGES.PATIENT.INVALID_LOCALITY)
    .regex(
      /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s.,'-]+$/,
      ERROR_MESSAGES.PATIENT.INVALID_LOCALITY_FORMAT
    ),

  zoneId: z.string().uuid(ERROR_MESSAGES.PATIENT.INVALID_ZONE_ID),

  phone: z
    .string()
    .min(8, ERROR_MESSAGES.PATIENT.INVALID_PHONE)
    .max(20, ERROR_MESSAGES.PATIENT.INVALID_PHONE)
    .regex(
      /^(\+?\d{1,3}[-.\s]?)?(\(?\d{1,4}\)?[-.\s]?)?[\d\s\-\.()]+$/,
      ERROR_MESSAGES.PATIENT.INVALID_PHONE_FORMAT
    )
    .optional()
    .nullable(),

  emergencyPhone: z
    .string()
    .min(8, ERROR_MESSAGES.PATIENT.INVALID_EMERGENCY_PHONE)
    .max(20, ERROR_MESSAGES.PATIENT.INVALID_EMERGENCY_PHONE)
    .regex(
      /^(\+?\d{1,3}[-.\s]?)?(\(?\d{1,4}\)?[-.\s]?)?[\d\s\-\.()]+$/,
      ERROR_MESSAGES.PATIENT.INVALID_EMERGENCY_PHONE_FORMAT
    )
    .optional()
    .nullable(),

  state: patientStateSchema.default(PatientState.ACTIVE),

  lastAuthorizationDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, ERROR_MESSAGES.PATIENT.INVALID_DATE_FORMAT)
    .optional()
    .nullable(),

  authorizedVisitsPerMonth: z
    .number()
    .int()
    .min(0, ERROR_MESSAGES.PATIENT.INVALID_AUTHORIZED_VISITS)
    .max(31, ERROR_MESSAGES.PATIENT.INVALID_AUTHORIZED_VISITS)
    .optional()
    .nullable(),

  frequencyId: z.string().uuid(ERROR_MESSAGES.PATIENT.INVALID_FREQUENCY_ID),

  primaryProfessionalId: z
    .string()
    .uuid(ERROR_MESSAGES.PATIENT.INVALID_PROFESSIONAL_ID)
    .optional()
    .nullable(),

  diagnosis: z
    .string()
    .max(1000, ERROR_MESSAGES.PATIENT.INVALID_DIAGNOSIS)
    .optional()
    .nullable(),

  medicalObservations: z
    .string()
    .max(2000, ERROR_MESSAGES.PATIENT.INVALID_MEDICAL_OBSERVATIONS)
    .optional()
    .nullable(),

  requiresConfirmation: z.boolean().optional().default(true),

  preferredContactMethod: contactMethodSchema.optional().nullable(),

  isActive: z.boolean().optional().default(true),
});

export const createPatientSchema = patientBaseSchema.extend({
  fullName: z
    .string()
    .min(2, ERROR_MESSAGES.PATIENT.INVALID_FULLNAME)
    .max(200, ERROR_MESSAGES.PATIENT.INVALID_FULLNAME)
    .regex(
      /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s.,'-]+$/,
      ERROR_MESSAGES.PATIENT.INVALID_FULLNAME_FORMAT
    ),

  healthcareId: z
    .string()
    .min(2, ERROR_MESSAGES.PATIENT.INVALID_HEALTHCARE_ID)
    .max(50, ERROR_MESSAGES.PATIENT.INVALID_HEALTHCARE_ID)
    .regex(
      /^[a-zA-Z0-9\-_\/]+$/,
      ERROR_MESSAGES.PATIENT.INVALID_HEALTHCARE_ID_FORMAT
    ),

  address: z
    .string()
    .min(5, ERROR_MESSAGES.PATIENT.INVALID_ADDRESS)
    .max(200, ERROR_MESSAGES.PATIENT.INVALID_ADDRESS),

  locality: z
    .string()
    .min(2, ERROR_MESSAGES.PATIENT.INVALID_LOCALITY)
    .max(100, ERROR_MESSAGES.PATIENT.INVALID_LOCALITY),
});

export const updatePatientSchema = patientBaseSchema.partial().strict();

export const patientResponseSchema = patientBaseSchema.extend({
  id: z.string().uuid(),
  completedVisitsThisMonth: z.number().int().min(0),
  lastVisitDate: z.string().optional().nullable(),
  nextScheduledVisitDate: z.string().optional().nullable(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  deletedAt: z.date().optional().nullable(),
});

export const patientFilterSchema = z.object({
  zoneId: z.string().uuid().optional(),
  frequencyId: z.string().uuid().optional(),
  primaryProfessionalId: z.string().uuid().optional(),
  healthcareProviderId: z.string().uuid().optional(),
  state: z.enum(PATIENT_STATE_VALUES as [string, ...string[]]).optional(),
  locality: z.string().min(1).max(100).optional(),
  requiresConfirmation: z.boolean().optional(),
  search: z.string().min(1).max(100).optional(),
  hasUpcomingVisit: z.boolean().optional(),
  authorizationExpired: z.boolean().optional(),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
export type PatientResponse = z.infer<typeof patientResponseSchema>;

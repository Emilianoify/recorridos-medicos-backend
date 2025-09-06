import z from 'zod';
import { ERROR_MESSAGES } from '../../../constants/messages/error.messages';
import { ChangeReason } from '../../../enums/Audit';
import {
  AUDIT_ACTION_VALUES,
  AUDIT_ENTITY_VALUES,
  CHANGE_REASON_VALUES,
} from '../enumValidators';

// Esquemas para enums
export const auditActionSchema = z.enum(
  AUDIT_ACTION_VALUES as [string, ...string[]],
  {
    errorMap: () => ({ message: ERROR_MESSAGES.AUDIT.INVALID_ACTION }),
  }
);

export const auditEntitySchema = z.enum(
  AUDIT_ENTITY_VALUES as [string, ...string[]],
  {
    errorMap: () => ({ message: ERROR_MESSAGES.AUDIT.INVALID_ENTITY }),
  }
);

export const changeReasonSchema = z.enum(
  CHANGE_REASON_VALUES as [string, ...string[]],
  {
    errorMap: () => ({ message: ERROR_MESSAGES.AUDIT.INVALID_CHANGE_REASON }),
  }
);

// Schema base para VisitChangeAudit
export const visitChangeAuditBaseSchema = z.object({
  entityType: auditEntitySchema,

  entityId: z.string().uuid(ERROR_MESSAGES.AUDIT.INVALID_ENTITY_ID),

  action: auditActionSchema,

  fieldName: z
    .string()
    .min(1, ERROR_MESSAGES.AUDIT.INVALID_FIELD_NAME)
    .max(50, ERROR_MESSAGES.AUDIT.INVALID_FIELD_NAME)
    .optional()
    .nullable(),

  oldValue: z
    .string()
    .max(1000, ERROR_MESSAGES.AUDIT.INVALID_OLD_VALUE)
    .optional()
    .nullable(),

  newValue: z
    .string()
    .max(1000, ERROR_MESSAGES.AUDIT.INVALID_NEW_VALUE)
    .optional()
    .nullable(),

  changeReason: changeReasonSchema.default(ChangeReason.USER_REQUEST),

  changeDescription: z
    .string()
    .max(1000, ERROR_MESSAGES.AUDIT.INVALID_CHANGE_DESCRIPTION)
    .optional()
    .nullable(),

  userId: z
    .string()
    .uuid(ERROR_MESSAGES.AUDIT.INVALID_USER_ID)
    .optional()
    .nullable(),

  userAgent: z
    .string()
    .max(500, ERROR_MESSAGES.AUDIT.INVALID_USER_AGENT)
    .optional()
    .nullable(),

  ipAddress: z
    .string()
    .max(45, ERROR_MESSAGES.AUDIT.INVALID_IP_ADDRESS)
    .regex(
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/,
      ERROR_MESSAGES.AUDIT.INVALID_IP_FORMAT
    )
    .optional()
    .nullable(),

  relatedEntityType: auditEntitySchema.optional().nullable(),

  relatedEntityId: z
    .string()
    .uuid(ERROR_MESSAGES.AUDIT.INVALID_RELATED_ENTITY_ID)
    .optional()
    .nullable(),

  metadata: z.record(z.any()).optional().nullable(),

  changeDateTime: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
      ERROR_MESSAGES.AUDIT.INVALID_DATETIME
    )
    .default(() => new Date().toISOString()),
});

export const createVisitChangeAuditSchema = visitChangeAuditBaseSchema.extend({
  entityType: auditEntitySchema,
  entityId: z.string().uuid(ERROR_MESSAGES.AUDIT.INVALID_ENTITY_ID),
  action: auditActionSchema,
});

export const visitChangeAuditResponseSchema = visitChangeAuditBaseSchema.extend(
  {
    id: z.string().uuid(),
    createdAt: z.date().optional(),
  }
);

export type CreateVisitChangeAuditInput = z.infer<
  typeof createVisitChangeAuditSchema
>;
export type VisitChangeAuditResponse = z.infer<
  typeof visitChangeAuditResponseSchema
>;

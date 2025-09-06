import z from 'zod';
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

export const baseResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any().optional(),
  errors: z.array(z.string()).optional(),
  meta: z
    .object({
      timestamp: z.string(),
      requestId: z.string().optional(),
    })
    .optional(),
});

export const paginatedResponseSchema = baseResponseSchema.extend({
  data: z.object({
    items: z.array(z.any()),
    pagination: z.object({
      currentPage: z.number().int().min(1),
      totalPages: z.number().int().min(0),
      totalItems: z.number().int().min(0),
      itemsPerPage: z.number().int().min(1),
      hasNextPage: z.boolean(),
      hasPreviousPage: z.boolean(),
    }),
  }),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
export type BaseResponse = z.infer<typeof baseResponseSchema>;
export type PaginatedResponse = z.infer<typeof paginatedResponseSchema>;

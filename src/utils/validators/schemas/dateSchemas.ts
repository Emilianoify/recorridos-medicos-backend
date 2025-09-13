import { z } from 'zod';
import { ERROR_MESSAGES } from '../../../constants/messages/error.messages';

// Date format YYYY-MM-DD regex
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// Time format HH:MM or HH:MM:SS regex
const TIME_REGEX = /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;

// DateTime ISO string regex
const DATETIME_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?$/;

// Base date validation schema
export const dateStringSchema = z
  .string()
  .regex(DATE_REGEX, ERROR_MESSAGES.GENERAL.INVALID_DATE_FORMAT)
  .refine((date) => {
    const parsedDate = new Date(date);
    return !isNaN(parsedDate.getTime()) && parsedDate.toISOString().startsWith(date);
  }, ERROR_MESSAGES.GENERAL.INVALID_DATE_FORMAT);

// Optional date schema
export const optionalDateStringSchema = dateStringSchema.optional();

// Time validation schema
export const timeStringSchema = z
  .string()
  .regex(TIME_REGEX, 'Formato de tiempo no válido (HH:MM o HH:MM:SS)');

// Optional time schema
export const optionalTimeStringSchema = timeStringSchema.optional();

// DateTime ISO string validation
export const dateTimeStringSchema = z
  .string()
  .regex(DATETIME_REGEX, 'Formato de fecha y hora no válido (ISO 8601)');

// Date range validation schemas
export const dateRangeSchema = z
  .object({
    fromDate: optionalDateStringSchema,
    toDate: optionalDateStringSchema,
  })
  .refine(
    (data) => {
      if (!data.fromDate || !data.toDate) return true;
      return new Date(data.fromDate) <= new Date(data.toDate);
    },
    {
      message: ERROR_MESSAGES.GENERAL.INVALID_DATE_RANGE,
      path: ['toDate'],
    }
  );

// Date filter for queries
export const dateFilterSchema = z
  .object({
    date: optionalDateStringSchema,
    dateFrom: optionalDateStringSchema,
    dateTo: optionalDateStringSchema,
  })
  .refine(
    (data) => {
      if (!data.dateFrom || !data.dateTo) return true;
      return new Date(data.dateFrom) <= new Date(data.dateTo);
    },
    {
      message: ERROR_MESSAGES.GENERAL.INVALID_DATE_RANGE,
      path: ['dateTo'],
    }
  );

// Helper function to validate single date string
export const isValidDateString = (dateString: string): boolean => {
  try {
    dateStringSchema.parse(dateString);
    return true;
  } catch {
    return false;
  }
};

// Helper function to validate time string
export const isValidTimeString = (timeString: string): boolean => {
  try {
    timeStringSchema.parse(timeString);
    return true;
  } catch {
    return false;
  }
};
import { z } from 'zod';
import { ERROR_MESSAGES } from '../../../constants/messages/error.messages';

export const polygonCoordinateSchema = z.object({
  lat: z
    .number()
    .min(-90, ERROR_MESSAGES.ZONE.LAT_RANGE)
    .max(90, ERROR_MESSAGES.ZONE.LAT_RANGE)
    .refine(val => !isNaN(val) && isFinite(val), {
      message: ERROR_MESSAGES.ZONE.INVALID_COORDINATE,
    }),
  lng: z
    .number()
    .min(-180, ERROR_MESSAGES.ZONE.LONG_RANGE)
    .max(180, ERROR_MESSAGES.ZONE.LONG_RANGE)
    .refine(val => !isNaN(val) && isFinite(val), {
      message: ERROR_MESSAGES.ZONE.INVALID_COORDINATE,
    }),
});

export const zonePolygonSchema = z.object({
  coordinates: z
    .array(polygonCoordinateSchema)
    .min(3, ERROR_MESSAGES.ZONE.POLYGON_MIN_POINTS)
    .max(100, ERROR_MESSAGES.ZONE.POLYGON_MAX_POINTS)
    .refine(
      coords => {
        // Validar que el polígono esté cerrado (primer punto = último punto)
        if (coords.length >= 3) {
          const first = coords[0];
          const last = coords[coords.length - 1];
          return first.lat === last.lat && first.lng === last.lng;
        }
        return true;
      },
      { message: ERROR_MESSAGES.ZONE.POLYGON_NOT_CLOSED }
    ),
  center: polygonCoordinateSchema.optional(),
});

export const zoneBaseSchema = z.object({
  name: z
    .string()
    .min(2, ERROR_MESSAGES.ZONE.INVALID_NAME)
    .max(100, ERROR_MESSAGES.ZONE.INVALID_NAME)
    .regex(
      /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\-.,()]+$/,
      ERROR_MESSAGES.ZONE.INVALID_NAME_FORMAT
    )
    .trim(),

  description: z
    .string()
    .max(500, ERROR_MESSAGES.ZONE.DESCRIPTION_TOO_LONG)
    .optional()
    .nullable()
    .transform(val => (val === '' ? null : val)),

  polygonCoordinates: zonePolygonSchema
    .optional()
    .nullable()
    .transform(val => {
      if (val && Object.keys(val).length === 0) {
        return null;
      }
      return val;
    }),

  isActive: z.boolean().optional().default(true),
});

export const createZoneSchema = zoneBaseSchema.extend({
  name: z
    .string()
    .min(2, ERROR_MESSAGES.ZONE.INVALID_NAME)
    .max(100, ERROR_MESSAGES.ZONE.INVALID_NAME)
    .regex(
      /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\-.,()]+$/,
      ERROR_MESSAGES.ZONE.INVALID_NAME_FORMAT
    )
    .trim(),
});

export const updateZoneSchema = zoneBaseSchema
  .partial()
  .extend({
    name: z
      .string()
      .min(2, ERROR_MESSAGES.ZONE.INVALID_NAME)
      .max(100, ERROR_MESSAGES.ZONE.INVALID_NAME)
      .regex(
        /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\-.,()]+$/,
        ERROR_MESSAGES.ZONE.INVALID_NAME_FORMAT
      )
      .trim()
      .optional(),
  })
  .strict();

export const zoneNameSchema = z.object({
  name: z
    .string()
    .min(2, ERROR_MESSAGES.ZONE.INVALID_NAME)
    .max(100, ERROR_MESSAGES.ZONE.INVALID_NAME)
    .regex(
      /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\-.,()]+$/,
      ERROR_MESSAGES.ZONE.INVALID_NAME_FORMAT
    )
    .trim(),
});

export const coordinatesSchema = z.object({
  coordinates: z
    .array(polygonCoordinateSchema)
    .min(3, ERROR_MESSAGES.ZONE.POLYGON_MIN_POINTS)
    .max(100, ERROR_MESSAGES.ZONE.POLYGON_MAX_POINTS),
});

export const zoneResponseSchema = zoneBaseSchema.extend({
  id: z.string().uuid(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  deletedAt: z.date().optional().nullable(),
});

export const zoneQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
  isActive: z.enum(['true', 'false']).optional(),
  search: z.string().optional(),
  hasCoordinates: z.enum(['true', 'false']).optional(),
  orderBy: z
    .enum(['name', 'createdAt', 'updatedAt'])
    .optional()
    .default('createdAt'),
  order: z.enum(['ASC', 'DESC']).optional().default('DESC'),
});

export type CreateZoneRequest = z.infer<typeof createZoneSchema>;
export type UpdateZoneRequest = z.infer<typeof updateZoneSchema>;
export type ZoneQueryParams = z.infer<typeof zoneQuerySchema>;
export type PolygonCoordinate = z.infer<typeof polygonCoordinateSchema>;
export type ZonePolygon = z.infer<typeof zonePolygonSchema>;

export const validatePolygonClosure = (
  coordinates: PolygonCoordinate[]
): boolean => {
  if (coordinates.length < 3) return false;

  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];

  return (
    Math.abs(first.lat - last.lat) < 0.000001 &&
    Math.abs(first.lng - last.lng) < 0.000001
  );
};

export const calculatePolygonCenter = (
  coordinates: PolygonCoordinate[]
): PolygonCoordinate => {
  const sumLat = coordinates.reduce((sum, coord) => sum + coord.lat, 0);
  const sumLng = coordinates.reduce((sum, coord) => sum + coord.lng, 0);

  return {
    lat: sumLat / coordinates.length,
    lng: sumLng / coordinates.length,
  };
};

export const isCoordinateInArgentina = (coord: PolygonCoordinate): boolean => {
  const ARGENTINA_BOUNDS = {
    north: -21.8,
    south: -55.1,
    east: -53.6,
    west: -73.6,
  };

  return (
    coord.lat <= ARGENTINA_BOUNDS.north &&
    coord.lat >= ARGENTINA_BOUNDS.south &&
    coord.lng >= ARGENTINA_BOUNDS.west &&
    coord.lng <= ARGENTINA_BOUNDS.east
  );
};

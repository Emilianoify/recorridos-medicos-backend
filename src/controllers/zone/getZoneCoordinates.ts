import { Response } from 'express';
import { AuthRequest } from '../../interfaces/auth.interface';
import {
  sendBadRequest,
  sendInternalErrorResponse,
  sendNotFound,
  sendSuccessResponse,
} from '../../utils/commons/responseFunctions';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { isValidUUID } from '../../utils/validators/schemas/uuidSchema';
import { calculatePolygonCenter } from '../../utils/validators/schemas/zoneSchemas';
import { ZoneModel } from '../../models';
import { IZone } from '../../interfaces/zone.interface';

export const getZoneCoordinates = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      return sendBadRequest(res, ERROR_MESSAGES.ZONE.ID_REQUIRED);
    }

    if (!isValidUUID(id)) {
      return sendBadRequest(res, ERROR_MESSAGES.ZONE.INVALID_ID);
    }

    const zone = (await ZoneModel.findByPk(id, {
      attributes: ['id', 'name', 'polygonCoordinates', 'isActive'],
    })) as unknown as IZone;

    if (!zone) {
      return sendNotFound(res, ERROR_MESSAGES.ZONE.NOT_FOUND);
    }

    if (!zone.polygonCoordinates || !zone.polygonCoordinates.coordinates) {
      return sendNotFound(res, ERROR_MESSAGES.ZONE.COORDINATES_NOT_FOUND);
    }

    const coordinates = zone.polygonCoordinates.coordinates;

    let center = zone.polygonCoordinates.center;
    if (!center && coordinates.length > 0) {
      center = calculatePolygonCenter(coordinates);
    }

    const stats = {
      totalPoints: coordinates.length,
      bounds: calculateBounds(coordinates),
      area: calculateApproximateArea(coordinates),
    };

    const response = {
      zone: {
        id: zone.id,
        name: zone.name,
        isActive: zone.isActive,
      },
      coordinates: {
        polygon: coordinates,
        center: center,
        statistics: stats,
      },
      metadata: {
        format: 'GeoJSON compatible',
        coordinateSystem: 'WGS84 (EPSG:4326)',
        lastUpdated: zone.updatedAt,
      },
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.ZONE.COORDINATES_UPDATED,
      response
    );
  } catch (error) {
    console.error('Error fetching zone coordinates:', error);
    return sendInternalErrorResponse(res);
  }
};

// ===== FUNCIONES AUXILIARES =====

/**
 * Calcula los límites (bounds) del polígono
 */
function calculateBounds(coordinates: Array<{ lat: number; lng: number }>) {
  if (coordinates.length === 0) return null;

  let minLat = coordinates[0].lat;
  let maxLat = coordinates[0].lat;
  let minLng = coordinates[0].lng;
  let maxLng = coordinates[0].lng;

  for (const coord of coordinates) {
    minLat = Math.min(minLat, coord.lat);
    maxLat = Math.max(maxLat, coord.lat);
    minLng = Math.min(minLng, coord.lng);
    maxLng = Math.max(maxLng, coord.lng);
  }

  return {
    north: maxLat,
    south: minLat,
    east: maxLng,
    west: minLng,
    center: {
      lat: (minLat + maxLat) / 2,
      lng: (minLng + maxLng) / 2,
    },
  };
}

/**
 * Calcula el área aproximada del polígono usando la fórmula de Shoelace
 * Retorna área en kilómetros cuadrados (aproximada)
 */
function calculateApproximateArea(
  coordinates: Array<{ lat: number; lng: number }>
): number {
  if (coordinates.length < 3) return 0;

  // Conversión aproximada: 1 grado ≈ 111 km
  const DEGREE_TO_KM = 111;

  let area = 0;
  const n = coordinates.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const xi = coordinates[i].lng * DEGREE_TO_KM;
    const yi = coordinates[i].lat * DEGREE_TO_KM;
    const xj = coordinates[j].lng * DEGREE_TO_KM;
    const yj = coordinates[j].lat * DEGREE_TO_KM;

    area += xi * yj - xj * yi;
  }

  return Math.abs(area) / 2; // Área en km²
}

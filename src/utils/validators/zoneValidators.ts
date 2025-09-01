// src/utils/validators/zoneValidators.ts

import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { IZonePolygon } from '../../interfaces/zone.interface';
import {
  validatePolygonClosure,
  isCoordinateInArgentina,
  PolygonCoordinate,
} from './schemas/zoneSchemas';

// ===== TIPOS PARA RESULTADOS DE VALIDACIÓN =====
export interface ZoneValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

// ===== FUNCIÓN PRINCIPAL DE VALIDACIÓN DE COORDENADAS =====
export const validateZoneCoordinates = (
  polygonCoordinates: IZonePolygon | null | undefined
): ZoneValidationResult => {
  // Si no hay coordenadas, es válido (polígono opcional)
  if (!polygonCoordinates || !polygonCoordinates.coordinates) {
    return { isValid: true };
  }

  const coordinates = polygonCoordinates.coordinates;

  try {
    // 1. Validar que el polígono esté cerrado
    if (!validatePolygonClosure(coordinates)) {
      return {
        isValid: false,
        errorMessage: ERROR_MESSAGES.ZONE.COORDINATES_NOT_CLOSED,
      };
    }

    // 2. Validar que todas las coordenadas estén en Argentina
    const invalidCoordinates = coordinates.filter(
      coord => !isCoordinateInArgentina(coord)
    );

    if (invalidCoordinates.length > 0) {
      return {
        isValid: false,
        errorMessage: `${invalidCoordinates.length} coordenadas están fuera de los límites de Argentina`,
      };
    }

    // 3. Validar coordenadas duplicadas consecutivas (opcional - mejora la calidad)
    if (hasDuplicateConsecutiveCoordinates(coordinates)) {
      return {
        isValid: false,
        errorMessage:
          'El polígono contiene coordenadas duplicadas consecutivas',
      };
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      errorMessage: ERROR_MESSAGES.ZONE.INVALID_COORDINATES,
    };
  }
};

// ===== VALIDACIONES AUXILIARES =====

// Función para detectar coordenadas duplicadas consecutivas
const hasDuplicateConsecutiveCoordinates = (
  coordinates: PolygonCoordinate[]
): boolean => {
  for (let i = 0; i < coordinates.length - 1; i++) {
    const current = coordinates[i];
    const next = coordinates[i + 1];

    if (
      Math.abs(current.lat - next.lat) < 0.000001 &&
      Math.abs(current.lng - next.lng) < 0.000001
    ) {
      return true;
    }
  }
  return false;
};

// Función para validar que el área del polígono sea razonable
export const validatePolygonArea = (
  coordinates: PolygonCoordinate[]
): boolean => {
  // Implementación simplificada - puedes expandir según necesidades
  if (coordinates.length < 3) return false;

  // Área mínima: ~100m² (muy pequeña para una zona)
  // Área máxima: ~50000 km² (muy grande para una zona urbana)
  // Esta es una validación básica, puedes refinarla

  return true; // Por ahora acepta cualquier área
};

// Función para calcular distancia aproximada entre dos puntos (en km)
export const calculateDistance = (
  coord1: PolygonCoordinate,
  coord2: PolygonCoordinate
): number => {
  const R = 6371; // Radio de la Tierra en km
  const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const dLng = ((coord2.lng - coord1.lng) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.lat * Math.PI) / 180) *
      Math.cos((coord2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// ===== FUNCIÓN DE VALIDACIÓN COMPLETA PARA CONTROLLERS =====
export const validateZoneForCreation = async (zoneData: {
  name: string;
  polygonCoordinates?: IZonePolygon | null;
}): Promise<ZoneValidationResult> => {
  // Esta función puede expandirse para incluir más validaciones de negocio
  // como verificar solapamiento con otras zonas, etc.

  return validateZoneCoordinates(zoneData.polygonCoordinates);
};

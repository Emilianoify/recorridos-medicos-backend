import { Response } from 'express';
import { AuthRequest } from '../../interfaces/auth.interface';
import { ZodError } from 'zod';
import {
  sendBadRequest,
  sendInternalErrorResponse,
  sendSuccessResponse,
  sendNotFound,
} from '../../utils/commons/responseFunctions';
import {
  JourneyModel,
  VisitModel,
  PatientModel,
  ZoneModel,
} from '../../models';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { isValidUUID } from '../../utils/validators/schemas/uuidSchema';
import { IJourney, IOptimalRouteResult } from '../../interfaces/journey.interface';
import { IVisit } from '../../interfaces/visit.interface';
import { IPatient } from '../../interfaces/patient.interface';
import { generateOptimalRouteSchema } from '../../utils/validators/schemas/paginationSchemas';
import { IPolygonCoordinate } from '../../interfaces/zone.interface';

export const generateOptimalRoute = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      return sendBadRequest(res, ERROR_MESSAGES.JOURNEY.ID_REQUIRED);
    }

    if (!isValidUUID(id)) {
      return sendBadRequest(res, ERROR_MESSAGES.JOURNEY.INVALID_ID);
    }

    const validatedQuery = generateOptimalRouteSchema.parse(req.query);
    const { algorithm = 'nearest_neighbor', includeReturnToOrigin = true } =
      validatedQuery;

    const journeyInstance = await JourneyModel.findOne({
      where: { id, isActive: true },
      include: [
        {
          model: ZoneModel,
          as: 'zone',
          attributes: ['id', 'name', 'polygonCoordinates'],
          where: { isActive: true },
          required: false,
        },
      ],
    });

    if (!journeyInstance) {
      return sendNotFound(res, ERROR_MESSAGES.JOURNEY.NOT_FOUND);
    }

    const journey: IJourney = journeyInstance.toJSON() as IJourney;

    const visitsInstances = await VisitModel.findAll({
      where: {
        journeyId: id,
        isActive: true,
      },
      include: [
        {
          model: PatientModel,
          as: 'patient',
          attributes: [
            'id',
            'fullName',
            'address',
            'locality',
            'zoneId',
          ],
          where: { isActive: true },
          required: true,
          include: [
            {
              model: ZoneModel,
              as: 'zone',
              attributes: ['id', 'name', 'polygonCoordinates'],
              where: { isActive: true },
              required: false,
            },
          ],
        },
      ],
      order: [['orderInJourney', 'ASC']],
    });

    if (visitsInstances.length === 0) {
      return sendBadRequest(res, ERROR_MESSAGES.JOURNEY.NO_VISITS_FOUND);
    }

    const visits: IVisit[] = visitsInstances.map(
      visit => visit.toJSON() as IVisit
    );

    const visitCoordinates: Array<{
      visitId: string;
      patientId: string;
      patientName: string;
      address: string;
      coordinates: IPolygonCoordinate;
      originalOrder: number;
    }> = [];

    for (const visit of visits) {
      const patient = visit.patient as IPatient;

      if (!patient.zone) {
        return sendBadRequest(res, ERROR_MESSAGES.JOURNEY.PATIENT_NO_ZONE);
      }

      if (!patient.zone.polygonCoordinates?.coordinates) {
        console.warn(
          `Patient ${patient.fullName} has no coordinates, skipping optimal route generation`
        );
        continue;
      }

      visitCoordinates.push({
        visitId: visit.id,
        patientId: patient.id,
        patientName: patient.fullName,
        address: `${patient.address}, ${patient.locality}`,
        coordinates: patient.zone.polygonCoordinates.coordinates[0],
        originalOrder: visit.orderInJourney || 0,
      });
    }

    if (visitCoordinates.length === 0) {
      return sendBadRequest(res, ERROR_MESSAGES.JOURNEY.NO_VALID_COORDINATES);
    }

    if (visitCoordinates.length === 1) {
      const singleVisit = visitCoordinates[0];
      const response = {
        journey: {
          id: journey.id,
          date: journey.date,
          status: journey.status,
        },
        originalRoute: {
          visits: visitCoordinates,
          totalVisits: 1,
        },
        optimizedRoute: {
          algorithm: algorithm,
          visits: [singleVisit],
          totalDistance: 0,
          estimatedTravelTime: 0,
          improvementPercentage: 0,
          routeSegments: [],
        },
        recommendations: [
          'Solo hay una visita en este recorrido, no se requiere optimizaci�n.',
        ],
      };

      return sendSuccessResponse(
        res,
        SUCCESS_MESSAGES.JOURNEY.ROUTE_GENERATED,
        response
      );
    }

    let optimizedResult: IOptimalRouteResult;

    if (algorithm === 'nearest_neighbor') {
      optimizedResult = calculateNearestNeighborRoute(
        visitCoordinates,
        includeReturnToOrigin
      );
    } else {
      optimizedResult = calculateGreedyRoute(
        visitCoordinates,
        includeReturnToOrigin
      );
    }

    const originalDistance = calculateTotalDistance(
      visitCoordinates.sort((a, b) => a.originalOrder - b.originalOrder),
      includeReturnToOrigin
    );

    const improvementPercentage =
      originalDistance > 0
        ? Math.round(
            ((originalDistance - optimizedResult.totalDistance) /
              originalDistance) *
              100
          )
        : 0;

    const optimizedVisits = optimizedResult.optimizedOrder
      .map(visitId => {
        const visit = visitCoordinates.find(v => v.visitId === visitId);
        return visit;
      })
      .filter(visit => visit !== undefined);

    const recommendations: string[] = [];

    if (improvementPercentage > 10) {
      recommendations.push(
        `La ruta optimizada reduce la distancia total en ${improvementPercentage}%`
      );
    } else if (improvementPercentage <= 0) {
      recommendations.push('La ruta actual ya est� bastante optimizada');
    }

    if (optimizedResult.totalDistance > 50) {
      recommendations.push(
        'Considere dividir este recorrido en m�ltiples jornadas para reducir el tiempo de viaje'
      );
    }

    if (visitCoordinates.length > 8) {
      recommendations.push(
        'Recorrido con muchas visitas, considere optimizar los horarios de inicio temprano'
      );
    }

    const response = {
      journey: {
        id: journey.id,
        date: journey.date,
        status: journey.status,
        zone: journey.zone,
      },
      originalRoute: {
        visits: visitCoordinates.sort(
          (a, b) => a.originalOrder - b.originalOrder
        ),
        totalVisits: visitCoordinates.length,
        totalDistance: originalDistance,
      },
      optimizedRoute: {
        algorithm: algorithm,
        visits: optimizedVisits,
        totalDistance: optimizedResult.totalDistance,
        estimatedTravelTime: optimizedResult.estimatedTravelTime,
        improvementPercentage: improvementPercentage,
        routeSegments: optimizedResult.routeSegments,
      },
      recommendations: recommendations,
      metadata: {
        generatedAt: new Date().toISOString(),
        includeReturnToOrigin: includeReturnToOrigin,
        coordinatesFound: visitCoordinates.length,
        totalVisitsInJourney: visits.length,
      },
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.JOURNEY.ROUTE_GENERATED,
      response
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0].message;
      return sendBadRequest(res, firstError);
    }

    console.error('Error generating optimal route:', error);
    return sendInternalErrorResponse(res);
  }
};

function calculateDistance(
  coord1: IPolygonCoordinate,
  coord2: IPolygonCoordinate
): number {
  const R = 6371;
  const dLat = deg2rad(coord2.lat - coord1.lat);
  const dLng = deg2rad(coord2.lng - coord1.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(coord1.lat)) *
      Math.cos(deg2rad(coord2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

function calculateTotalDistance(
  visits: Array<{ visitId: string; coordinates: IPolygonCoordinate }>,
  includeReturn: boolean
): number {
  if (visits.length < 2) return 0;

  let totalDistance = 0;

  for (let i = 0; i < visits.length - 1; i++) {
    totalDistance += calculateDistance(
      visits[i].coordinates,
      visits[i + 1].coordinates
    );
  }

  if (includeReturn && visits.length > 0) {
    totalDistance += calculateDistance(
      visits[visits.length - 1].coordinates,
      visits[0].coordinates
    );
  }

  return Math.round(totalDistance * 100) / 100;
}

function calculateNearestNeighborRoute(
  visits: Array<{
    visitId: string;
    coordinates: IPolygonCoordinate;
    patientName: string;
    address: string;
  }>,
  includeReturn: boolean
): IOptimalRouteResult {
  const unvisited = [...visits];
  const route: string[] = [];
  const routeSegments: Array<{
    from: string;
    to: string;
    distance: number;
    estimatedTime: number;
  }> = [];

  let current = unvisited[0];
  route.push(current.visitId);
  unvisited.splice(0, 1);

  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let nearestDistance = calculateDistance(
      current.coordinates,
      unvisited[0].coordinates
    );

    for (let i = 1; i < unvisited.length; i++) {
      const distance = calculateDistance(
        current.coordinates,
        unvisited[i].coordinates
      );
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = i;
      }
    }

    const next = unvisited[nearestIndex];
    route.push(next.visitId);

    routeSegments.push({
      from: current.patientName,
      to: next.patientName,
      distance: Math.round(nearestDistance * 100) / 100,
      estimatedTime: Math.round(nearestDistance * 3), // ~3 minutes per km
    });

    current = next;
    unvisited.splice(nearestIndex, 1);
  }

  let totalDistance = 0;
  const routeVisits = route
    .map(id => visits.find(v => v.visitId === id))
    .filter(v => v !== undefined);

  for (let i = 0; i < routeVisits.length - 1; i++) {
    const dist = calculateDistance(
      routeVisits[i].coordinates,
      routeVisits[i + 1].coordinates
    );
    totalDistance += dist;
  }

  if (includeReturn && routeVisits.length > 0) {
    const returnDistance = calculateDistance(
      routeVisits[routeVisits.length - 1].coordinates,
      routeVisits[0].coordinates
    );
    totalDistance += returnDistance;

    routeSegments.push({
      from: routeVisits[routeVisits.length - 1].patientName,
      to: routeVisits[0].patientName,
      distance: Math.round(returnDistance * 100) / 100,
      estimatedTime: Math.round(returnDistance * 3),
    });
  }

  return {
    optimizedOrder: route,
    totalDistance: Math.round(totalDistance * 100) / 100,
    estimatedTravelTime: Math.round(totalDistance * 3),
    routeSegments: routeSegments,
  };
}

function calculateGreedyRoute(
  visits: Array<{
    visitId: string;
    coordinates: IPolygonCoordinate;
    patientName: string;
    address: string;
  }>,
  includeReturn: boolean
): IOptimalRouteResult {
  return calculateNearestNeighborRoute(visits, includeReturn);
}

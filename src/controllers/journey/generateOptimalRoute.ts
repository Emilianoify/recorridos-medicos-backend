import { Response } from 'express';
import { AuthRequest } from '../../interfaces/auth.interface';
import { ZodError } from 'zod';
import {
  sendBadRequest,
  sendInternalErrorResponse,
  sendSuccessResponse,
  sendNotFound,
} from '../../utils/commons/responseFunctions';
import { JourneyModel, VisitModel, PatientModel, ZoneModel } from '../../models';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { isValidUUID } from '../../utils/validators/schemas/uuidSchema';
import { IJourney } from '../../interfaces/journey.interface';

interface IOptimalRouteVisit {
  id: string;
  patientId: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    address: string;
    latitude?: number | null;
    longitude?: number | null;
  };
  scheduledDateTime: Date;
  estimatedDuration: number;
  order: number;
}

interface IOptimalRoute {
  journeyId: string;
  totalDistance: number;
  estimatedTotalTime: number;
  visits: IOptimalRouteVisit[];
  optimizationNotes: string[];
}

export const generateOptimalRoute = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id || !isValidUUID(id)) {
      return sendBadRequest(res, ERROR_MESSAGES.JOURNEY.INVALID_ID);
    }

    const journeyInstance = await JourneyModel.findOne({
      where: { id, isActive: true },
      include: [
        {
          model: ZoneModel,
          as: 'zone',
          attributes: ['id', 'name', 'description'],
        },
      ],
    });

    if (!journeyInstance) {
      return sendNotFound(res, ERROR_MESSAGES.JOURNEY.NOT_FOUND);
    }

    const journey: IJourney = journeyInstance.toJSON() as IJourney;

    // Get all scheduled visits for this journey
    const visits = await VisitModel.findAll({
      where: {
        journeyId: id,
        status: 'scheduled',
        isActive: true,
      },
      include: [
        {
          model: PatientModel,
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName', 'address', 'latitude', 'longitude'],
          where: { isActive: true },
        },
      ],
      order: [['scheduledDateTime', 'ASC']],
    });

    if (visits.length === 0) {
      const response: IOptimalRoute = {
        journeyId: id,
        totalDistance: 0,
        estimatedTotalTime: 0,
        visits: [],
        optimizationNotes: ['No hay visitas programadas para optimizar en este recorrido.'],
      };

      return sendSuccessResponse(
        res,
        SUCCESS_MESSAGES.JOURNEY.OPTIMAL_ROUTE_GENERATED,
        response
      );
    }

    // Basic optimization algorithm - sort by geographical proximity
    // For a more sophisticated solution, you would use actual distance calculation
    const optimizationNotes: string[] = [];
    
    // Group visits by coordinates availability
    const visitsWithCoords = visits.filter(visit => 
      visit.patient?.latitude && visit.patient?.longitude
    );
    const visitsWithoutCoords = visits.filter(visit => 
      !visit.patient?.latitude || !visit.patient?.longitude
    );

    if (visitsWithoutCoords.length > 0) {
      optimizationNotes.push(
        `${visitsWithoutCoords.length} visitas no tienen coordenadas y se ordenaron por horario programado.`
      );
    }

    // Simple geographical sorting for visits with coordinates
    let optimizedVisits = [...visitsWithCoords];
    if (visitsWithCoords.length > 1) {
      // Sort by latitude first, then longitude (basic clustering)
      optimizedVisits = visitsWithCoords.sort((a, b) => {
        const latDiff = (a.patient?.latitude || 0) - (b.patient?.latitude || 0);
        if (Math.abs(latDiff) > 0.01) return latDiff;
        return (a.patient?.longitude || 0) - (b.patient?.longitude || 0);
      });
      optimizationNotes.push(
        'Visitas optimizadas por proximidad geogr�fica basada en coordenadas.'
      );
    }

    // Add visits without coordinates at the end, sorted by time
    optimizedVisits = [
      ...optimizedVisits,
      ...visitsWithoutCoords.sort((a, b) => 
        new Date(a.scheduledDateTime).getTime() - new Date(b.scheduledDateTime).getTime()
      )
    ];

    // Calculate estimated times and distances
    const averageVisitDuration = 30; // minutes
    const averageTravelTime = 15; // minutes between visits
    const estimatedTotalTime = optimizedVisits.length * (averageVisitDuration + averageTravelTime);
    
    // Estimate total distance (simplified calculation)
    let totalDistance = 0;
    if (visitsWithCoords.length > 1) {
      for (let i = 0; i < visitsWithCoords.length - 1; i++) {
        const visit1 = visitsWithCoords[i];
        const visit2 = visitsWithCoords[i + 1];
        
        if (visit1.patient?.latitude && visit1.patient?.longitude && 
            visit2.patient?.latitude && visit2.patient?.longitude) {
          // Simple Euclidean distance approximation (in km)
          const latDiff = visit2.patient.latitude - visit1.patient.latitude;
          const lonDiff = visit2.patient.longitude - visit1.patient.longitude;
          const distance = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff) * 111; // rough km conversion
          totalDistance += distance;
        }
      }
      optimizationNotes.push(
        'Distancia calculada usando aproximaci�n geogr�fica simple.'
      );
    }

    // Format response visits
    const optimizedRouteVisits: IOptimalRouteVisit[] = optimizedVisits.map((visit, index) => ({
      id: visit.id,
      patientId: visit.patientId,
      patient: {
        id: visit.patient.id,
        firstName: visit.patient.firstName,
        lastName: visit.patient.lastName,
        address: visit.patient.address,
        latitude: visit.patient.latitude,
        longitude: visit.patient.longitude,
      },
      scheduledDateTime: visit.scheduledDateTime,
      estimatedDuration: averageVisitDuration,
      order: index + 1,
    }));

    const response: IOptimalRoute = {
      journeyId: id,
      totalDistance: Math.round(totalDistance * 100) / 100, // Round to 2 decimal places
      estimatedTotalTime,
      visits: optimizedRouteVisits,
      optimizationNotes,
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.JOURNEY.OPTIMAL_ROUTE_GENERATED,
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
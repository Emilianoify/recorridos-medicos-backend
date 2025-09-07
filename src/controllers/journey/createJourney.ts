import { Response } from 'express';
import { AuthRequest } from '../../interfaces/auth.interface';
import { ZodError } from 'zod';
import {
  sendBadRequest,
  sendInternalErrorResponse,
  sendSuccessResponse,
  sendConflict,
} from '../../utils/commons/responseFunctions';
import { JourneyModel, ProfessionalModel, ZoneModel } from '../../models';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { createJourneySchema } from '../../utils/validators/schemas/journeySchemas';
import { IJourney } from '../../interfaces/journey.interface';

export const createJourney = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const body = req.body;

    if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
      return sendBadRequest(res, ERROR_MESSAGES.SERVER.EMPTY_BODY);
    }

    const validatedData = createJourneySchema.parse(body);
    
    // Check for duplicate journey (same professional, date, zone)
    const existingJourney = await JourneyModel.findOne({
      where: {
        professionalId: validatedData.professionalId,
        date: validatedData.date,
        zoneId: validatedData.zoneId,
      },
      paranoid: false,
    });

    if (existingJourney) {
      return sendConflict(res, ERROR_MESSAGES.JOURNEY.DUPLICATE_JOURNEY);
    }

    // Validate professional exists and is active
    const professional = await ProfessionalModel.findOne({
      where: { id: validatedData.professionalId, isActive: true },
    });
    if (!professional) {
      return sendBadRequest(res, ERROR_MESSAGES.JOURNEY.INVALID_PROFESSIONAL_ID);
    }

    // Validate zone exists and is active
    const zone = await ZoneModel.findOne({
      where: { id: validatedData.zoneId, isActive: true },
    });
    if (!zone) {
      return sendBadRequest(res, ERROR_MESSAGES.JOURNEY.INVALID_ZONE_ID);
    }

    const createdJourneyInstance = await JourneyModel.create(validatedData);
    
    const createdJourney: IJourney = createdJourneyInstance.toJSON() as IJourney;

    const response = {
      journey: {
        id: createdJourney.id,
        professionalId: createdJourney.professionalId,
        date: createdJourney.date,
        zoneId: createdJourney.zoneId,
        status: createdJourney.status,
        plannedStartTime: createdJourney.plannedStartTime,
        plannedEndTime: createdJourney.plannedEndTime,
        actualStartTime: createdJourney.actualStartTime,
        actualEndTime: createdJourney.actualEndTime,
        estimatedVisits: createdJourney.estimatedVisits,
        completedVisits: createdJourney.completedVisits,
        totalTravelDistance: createdJourney.totalTravelDistance,
        observations: createdJourney.observations,
        isActive: createdJourney.isActive,
        createdAt: createdJourney.createdAt,
        updatedAt: createdJourney.updatedAt,
      },
    };

    return sendSuccessResponse(res, SUCCESS_MESSAGES.JOURNEY.JOURNEY_CREATED, response);
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0].message;
      return sendBadRequest(res, firstError);
    }

    console.error('Error creating journey:', error);
    return sendInternalErrorResponse(res);
  }
};
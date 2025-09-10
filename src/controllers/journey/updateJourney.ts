import { Response } from 'express';
import { AuthRequest } from '../../interfaces/auth.interface';
import { ZodError } from 'zod';
import {
  sendBadRequest,
  sendInternalErrorResponse,
  sendSuccessResponse,
  sendNotFound,
} from '../../utils/commons/responseFunctions';
import { JourneyModel } from '../../models';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { isValidUUID } from '../../utils/validators/schemas/uuidSchema';
import { updateJourneySchema } from '../../utils/validators/schemas/journeySchemas';
import { IJourney } from '../../interfaces/journey.interface';

export const updateJourney = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id || !isValidUUID(id)) {
      return sendBadRequest(res, ERROR_MESSAGES.COMMON.INVALID_UUID);
    }

    const body = req.body;

    if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
      return sendBadRequest(res, ERROR_MESSAGES.SERVER.EMPTY_BODY);
    }

    const validatedData = updateJourneySchema.parse(body);

    const journeyInstance = await JourneyModel.findOne({
      where: { id, isActive: true },
    });

    if (!journeyInstance) {
      return sendNotFound(res, ERROR_MESSAGES.JOURNEY.NOT_FOUND);
    }

    await JourneyModel.update(validatedData, {
      where: { id },
    });

    const updatedJourneyInstance = await JourneyModel.findByPk(id);
    const updatedJourney: IJourney = updatedJourneyInstance!.toJSON() as IJourney;

    const response = {
      journey: {
        id: updatedJourney.id,
        professionalId: updatedJourney.professionalId,
        date: updatedJourney.date,
        zoneId: updatedJourney.zoneId,
        status: updatedJourney.status,
        plannedStartTime: updatedJourney.plannedStartTime,
        plannedEndTime: updatedJourney.plannedEndTime,
        actualStartTime: updatedJourney.actualStartTime,
        actualEndTime: updatedJourney.actualEndTime,
        estimatedVisits: updatedJourney.estimatedVisits,
        completedVisits: updatedJourney.completedVisits,
        totalTravelDistance: updatedJourney.totalTravelDistance,
        observations: updatedJourney.observations,
        isActive: updatedJourney.isActive,
        createdAt: updatedJourney.createdAt,
        updatedAt: updatedJourney.updatedAt,
      },
    };

    return sendSuccessResponse(res, SUCCESS_MESSAGES.JOURNEY.JOURNEY_UPDATED, response);
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0].message;
      return sendBadRequest(res, firstError);
    }

    console.error('Error updating journey:', error);
    return sendInternalErrorResponse(res);
  }
};
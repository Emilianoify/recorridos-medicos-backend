import { Response } from 'express';
import { AuthRequest } from '../../interfaces/auth.interface';
import { ZodError } from 'zod';
import {
  sendBadRequest,
  sendInternalErrorResponse,
  sendSuccessResponse,
  sendNotFound,
} from '../../utils/commons/responseFunctions';
import { JourneyModel, ProfessionalModel, ZoneModel } from '../../models';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { isValidUUID } from '../../utils/validators/schemas/uuidSchema';
import { IJourney } from '../../interfaces/journey.interface';

export const getJourneyById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id || !isValidUUID(id)) {
      return sendBadRequest(res, ERROR_MESSAGES.COMMON.INVALID_UUID);
    }

    const journeyInstance = await JourneyModel.findOne({
      where: { id, isActive: true },
      include: [
        {
          model: ProfessionalModel,
          as: 'professional',
          attributes: ['id', 'firstName', 'lastName', 'licenseNumber'],
          where: { isActive: true },
          required: false,
        },
        {
          model: ZoneModel,
          as: 'zone',
          attributes: ['id', 'name', 'description'],
          where: { isActive: true },
          required: false,
        },
      ],
    });

    if (!journeyInstance) {
      return sendNotFound(res, ERROR_MESSAGES.JOURNEY.NOT_FOUND);
    }

    const journey: IJourney = journeyInstance.toJSON() as IJourney;

    const response = {
      journey: {
        id: journey.id,
        professionalId: journey.professionalId,
        date: journey.date,
        zoneId: journey.zoneId,
        status: journey.status,
        plannedStartTime: journey.plannedStartTime,
        plannedEndTime: journey.plannedEndTime,
        actualStartTime: journey.actualStartTime,
        actualEndTime: journey.actualEndTime,
        estimatedVisits: journey.estimatedVisits,
        completedVisits: journey.completedVisits,
        totalTravelDistance: journey.totalTravelDistance,
        observations: journey.observations,
        isActive: journey.isActive,
        createdAt: journey.createdAt,
        updatedAt: journey.updatedAt,
        professional: journey.professional,
        zone: journey.zone,
      },
    };

    return sendSuccessResponse(res, SUCCESS_MESSAGES.JOURNEY.JOURNEY_FOUND, response);
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0].message;
      return sendBadRequest(res, firstError);
    }

    console.error('Error getting journey by id:', error);
    return sendInternalErrorResponse(res);
  }
};
import { Response } from 'express';
import { AuthRequest } from '../../interfaces/auth.interface';
import { ZodError } from 'zod';
import {
  sendBadRequest,
  sendInternalErrorResponse,
  sendSuccessResponse,
  sendNotFound,
  sendConflict,
} from '../../utils/commons/responseFunctions';
import { JourneyModel, ProfessionalModel, ZoneModel } from '../../models';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { isValidUUID } from '../../utils/validators/schemas/uuidSchema';
import { IJourney } from '../../interfaces/journey.interface';
import { JourneyStatus } from '../../enums/JourneyStatus';

export const endJourney = async (
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

    // Validate journey can be ended
    if (journey.status === JourneyStatus.COMPLETED) {
      return sendConflict(res, ERROR_MESSAGES.JOURNEY.ALREADY_ENDED);
    }

    if (journey.status === JourneyStatus.PLANNED) {
      return sendConflict(res, ERROR_MESSAGES.JOURNEY.NOT_STARTED);
    }

    if (journey.status === JourneyStatus.CANCELLED) {
      return sendConflict(res, ERROR_MESSAGES.JOURNEY.ALREADY_ENDED);
    }

    // End the journey
    const currentDateTime = new Date().toISOString();

    await JourneyModel.update(
      {
        status: JourneyStatus.COMPLETED,
        actualEndTime: currentDateTime.substring(11, 19), // Extract HH:MM:SS
      },
      {
        where: { id },
      }
    );

    const updatedJourneyInstance = await JourneyModel.findByPk(id, {
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

    if (!updatedJourneyInstance) {
      return sendInternalErrorResponse(res);
    }

    const endedJourney: IJourney = updatedJourneyInstance.toJSON() as IJourney;

    const response = {
      journey: {
        id: endedJourney.id,
        professionalId: endedJourney.professionalId,
        date: endedJourney.date,
        zoneId: endedJourney.zoneId,
        status: endedJourney.status,
        plannedStartTime: endedJourney.plannedStartTime,
        plannedEndTime: endedJourney.plannedEndTime,
        actualStartTime: endedJourney.actualStartTime,
        actualEndTime: endedJourney.actualEndTime,
        estimatedVisits: endedJourney.estimatedVisits,
        completedVisits: endedJourney.completedVisits,
        totalTravelDistance: endedJourney.totalTravelDistance,
        observations: endedJourney.observations,
        isActive: endedJourney.isActive,
        createdAt: endedJourney.createdAt,
        updatedAt: endedJourney.updatedAt,
        professional: endedJourney.professional,
        zone: endedJourney.zone,
      },
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.JOURNEY.JOURNEY_ENDED,
      response
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0].message;
      return sendBadRequest(res, firstError);
    }

    console.error('Error ending journey:', error);
    return sendInternalErrorResponse(res);
  }
};

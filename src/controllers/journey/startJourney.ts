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
import { JourneyModel } from '../../models';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { JourneyStatus } from '../../enums/JourneyStatus';
import { IJourney } from '../../interfaces/journey.interface';
import { startJourneyParamsSchema, startJourneySchema } from '../../utils/validators/schemas/paginationSchemas';

export const startJourney = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = startJourneyParamsSchema.parse(req.params);
    const validatedData = startJourneySchema.parse(req.body || {});

    const journeyInstance = await JourneyModel.findByPk(id);
    if (!journeyInstance) {
      return sendNotFound(res, ERROR_MESSAGES.JOURNEY.NOT_FOUND);
    }

    const journey: IJourney = journeyInstance.toJSON() as IJourney;

    if (journey.status !== JourneyStatus.PLANNED) {
      return sendConflict(res, ERROR_MESSAGES.JOURNEY.ALREADY_STARTED);
    }

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

    await JourneyModel.update(
      {
        status: JourneyStatus.IN_PROGRESS,
        actualStartTime: validatedData.actualStartTime || currentTime,
        observations: validatedData.observations || journey.observations,
      },
      {
        where: { id },
      }
    );

    const response = {
      journey: {
        id: journey.id,
        status: journey.status,
        actualStartTime: journey.actualStartTime,
        startedAt: now,
        observations: journey.observations,
      },
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.JOURNEY.JOURNEY_STARTED,
      response
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0].message;
      return sendBadRequest(res, firstError);
    }

    console.error('Error starting journey:', error);
    return sendInternalErrorResponse(res);
  }
};

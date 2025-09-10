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
import { JourneyModel, VisitModel } from '../../models';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { isValidUUID } from '../../utils/validators/schemas/uuidSchema';

export const deleteJourney = async (
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
    });

    if (!journeyInstance) {
      return sendNotFound(res, ERROR_MESSAGES.JOURNEY.NOT_FOUND);
    }

    // Check if journey has active visits
    const activeVisits = await VisitModel.count({
      where: {
        journeyId: id,
        isActive: true,
      },
    });

    if (activeVisits > 0) {
      return sendConflict(res, ERROR_MESSAGES.JOURNEY.HAS_ACTIVE_VISITS);
    }

    // Perform soft delete
    await JourneyModel.update({ isActive: false }, { where: { id } });

    return sendSuccessResponse(res, SUCCESS_MESSAGES.JOURNEY.JOURNEY_DELETED, {
      journeyId: id,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0].message;
      return sendBadRequest(res, firstError);
    }

    console.error('Error deleting journey:', error);
    return sendInternalErrorResponse(res);
  }
};

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
import { FrequencyModel, PatientModel } from '../../models';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { isValidUUID } from '../../utils/validators/schemas/uuidSchema';

export const deleteFrequency = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      return sendBadRequest(res, ERROR_MESSAGES.FREQUENCY.ID_REQUIRED);
    }

    if (!isValidUUID(id)) {
      return sendBadRequest(res, ERROR_MESSAGES.FREQUENCY.INVALID_ID);
    }

    const frequency = await FrequencyModel.findByPk(id);
    if (!frequency) {
      return sendNotFound(res, ERROR_MESSAGES.FREQUENCY.NOT_FOUND);
    }

    // Check if frequency is being used by any patients
    const patientsUsingFrequency = await PatientModel.count({
      where: { frequencyId: id },
    });

    if (patientsUsingFrequency > 0) {
      return sendConflict(res, ERROR_MESSAGES.FREQUENCY.HAS_ACTIVE_RELATIONS);
    }

    await frequency.destroy();

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.FREQUENCY.FREQUENCY_DELETED
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0].message;
      return sendBadRequest(res, firstError);
    }

    console.error('Error deleting frequency:', error);
    return sendInternalErrorResponse(res);
  }
};

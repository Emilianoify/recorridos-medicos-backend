import { Response } from 'express';
import { AuthRequest } from '../../interfaces/auth.interface';
import { ZodError } from 'zod';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import {
  sendBadRequest,
  sendNotFound,
  sendInternalErrorResponse,
  sendSuccessResponse,
} from '../../utils/commons/responseFunctions';
import { isValidUUID } from '../../utils/validators/schemas/uuidSchema';
import { existingProfessional } from '../../utils/validators/dbValidators';
import { ProfessionalModel } from '../../models';

export const deleteProfessional = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      return sendBadRequest(res, ERROR_MESSAGES.PROFESSIONAL.ID_REQUIRED);
    }

    if (!isValidUUID(id)) {
      return sendBadRequest(res, ERROR_MESSAGES.PROFESSIONAL.INVALID_ID);
    }

    const professionalExists = await existingProfessional(id);
    if (!professionalExists) {
      return sendNotFound(res, ERROR_MESSAGES.PROFESSIONAL.NOT_FOUND);
    }

    const deletedCount = await ProfessionalModel.destroy({
      where: { id },
    });

    if (deletedCount === 0) {
      return sendNotFound(res, ERROR_MESSAGES.PROFESSIONAL.NOT_FOUND);
    }

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.PROFESSIONAL.PROFESSIONAL_DELETED
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0].message;
      return sendBadRequest(res, firstError);
    }
    return sendInternalErrorResponse(res);
  }
};

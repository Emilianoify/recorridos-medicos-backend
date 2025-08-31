import { Response } from 'express';
import { AuthRequest } from '../../interfaces/auth.interface';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import {
  sendBadRequest,
  sendNotFound,
  sendInternalErrorResponse,
  sendSuccessResponse,
} from '../../utils/commons/responseFunctions';

import { isValidUUID } from '../../utils/validators/schemas/uuidSchema';
import { existingSpecialty } from '../../utils/validators/dbValidators';
import { SpecialtyModel } from '../../models';

export const deleteSpecialty = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      return sendBadRequest(
        res,
        ERROR_MESSAGES.SPECIALTY.SPECIALTY_ID_REQUIRED
      );
    }

    if (!isValidUUID(id)) {
      return sendBadRequest(res, ERROR_MESSAGES.SPECIALTY.INVALID_SPECIALTY_ID);
    }

    const specialtyExists = await existingSpecialty(id);
    if (!specialtyExists) {
      return sendNotFound(res, ERROR_MESSAGES.SPECIALTY.SPECIALTY_NOT_FOUND);
    }

    const deletedCount = await SpecialtyModel.destroy({
      where: { id },
    });

    if (deletedCount === 0) {
      return sendNotFound(res, ERROR_MESSAGES.SPECIALTY.SPECIALTY_NOT_FOUND);
    }

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.SPECIALTY.SPECIALTY_DELETED
    );
  } catch (error) {
    return sendInternalErrorResponse(res);
  }
};

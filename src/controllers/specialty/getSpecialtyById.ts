import { Response } from 'express';
import { AuthRequest } from '../../interfaces/auth.interface';
import {
  sendBadRequest,
  sendInternalErrorResponse,
  sendNotFound,
  sendSuccessResponse,
} from '../../utils/commons/responseFunctions';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { isValidUUID } from '../../utils/validators/schemas/uuidSchema';
import { SpecialtyModel } from '../../models';
import { ISpecialty } from '../../interfaces/specialty.interface';

export const getSpecialtyById = async (
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
    const specialty = (await SpecialtyModel.findByPk(
      id
    )) as unknown as ISpecialty;

    if (!specialty) {
      return sendNotFound(res, ERROR_MESSAGES.SPECIALTY.SPECIALTY_NOT_FOUND);
    }

    const response = {
      id: specialty.id,
      name: specialty.name,
      description: specialty.description,
      isActive: specialty.isActive,
      createdAt: specialty.createdAt,
      updatedAt: specialty.updatedAt,
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.SPECIALTY.SPECIALTY_FOUND,
      response
    );
  } catch (error) {
    return sendInternalErrorResponse(res);
  }
};

import { Response } from 'express';
import { AuthRequest } from '../../interfaces/auth.interface';
import { ZodError } from 'zod';
import {
  sendBadRequest,
  sendConflict,
  sendInternalErrorResponse,
  sendNotFound,
  sendSuccessResponse,
} from '../../utils/commons/responseFunctions';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { isValidUUID } from '../../utils/validators/schemas/uuidSchema';

import { SpecialtyModel } from '../../models';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import {
  existingSpecialty,
  existingSpecialtyName,
} from '../../utils/validators/dbValidators';
import { updateSpecialtySchema } from '../../utils/validators/schemas/specialtySchemas';
import { ISpecialty } from '../../interfaces/specialty.interface';

export const updateSpecialty = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const body = req.body;
    if (!id) {
      return sendBadRequest(
        res,
        ERROR_MESSAGES.SPECIALTY.SPECIALTY_ID_REQUIRED
      );
    }

    if (!isValidUUID(id)) {
      return sendBadRequest(res, ERROR_MESSAGES.SPECIALTY.INVALID_SPECIALTY_ID);
    }

    if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
      return sendBadRequest(res, ERROR_MESSAGES.SERVER.EMPTY_BODY);
    }

    const specialtyExists = await existingSpecialty(id);
    if (!specialtyExists) {
      return sendNotFound(res, ERROR_MESSAGES.SPECIALTY.SPECIALTY_NOT_FOUND);
    }

    const validData = updateSpecialtySchema.parse(body);

    if (validData.name) {
      const nameExists = await existingSpecialtyName(validData.name);
      if (nameExists) {
        return sendConflict(
          res,
          ERROR_MESSAGES.SPECIALTY.SPECIALTY_NAME_IN_USE
        );
      }
    }

    const [affectedCount, updatedSpecialties] = await SpecialtyModel.update(
      validData,
      {
        where: { id },
        returning: true,
      }
    );

    if (affectedCount === 0) {
      return sendNotFound(res, ERROR_MESSAGES.SPECIALTY.SPECIALTY_NOT_FOUND);
    }

    const updatedSpecialty = updatedSpecialties[0] as unknown as ISpecialty;

    const response = {
      id: updatedSpecialty.id,
      name: updatedSpecialty.name,
      description: updatedSpecialty.description,
      isActive: updatedSpecialty.isActive,
      createdAt: updatedSpecialty.createdAt,
      updatedAt: updatedSpecialty.updatedAt,
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.SPECIALTY.SPECIALTY_UPDATED,
      response
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0].message;
      return sendBadRequest(res, firstError);
    }
    return sendInternalErrorResponse(res);
  }
};

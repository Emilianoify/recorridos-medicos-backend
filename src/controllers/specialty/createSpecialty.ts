import { Response } from 'express';
import { AuthRequest } from '../../interfaces/auth.interface';
import { ZodError } from 'zod';
import {
  sendBadRequest,
  sendConflict,
  sendInternalErrorResponse,
  sendSuccessResponse,
} from '../../utils/commons/responseFunctions';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { specialtyBaseSchema } from '../../utils/validators/schemas/specialtySchemas';
import { existingSpecialtyName } from '../../utils/validators/dbValidators';
import { SpecialtyModel } from '../../models';
import { ISpecialty } from '../../interfaces/specialty.interface';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';

interface CreateSpecialty {
  name: string;
  description?: string | null;
  isActive: boolean;
}

export const createSpecialty = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const body = req.body;
    if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
      return sendBadRequest(res, ERROR_MESSAGES.SERVER.EMPTY_BODY);
    }

    const validSpecialty: CreateSpecialty = specialtyBaseSchema.parse(body);

    const { name, description, isActive } = validSpecialty;

    const specialtyExists = await existingSpecialtyName(name);

    if (specialtyExists) {
      return sendConflict(res, ERROR_MESSAGES.SPECIALTY.NAME_IN_USE);
    }

    const createdSpecialty = (await SpecialtyModel.create({
      name,
      description: description,
      isActive: isActive !== undefined ? isActive : true,
    })) as Partial<ISpecialty>;

    const response = {
      specialty: {
        id: createdSpecialty.id,
        name: createdSpecialty.name,
        description: createdSpecialty.description,
        isActive: createdSpecialty.isActive,
        createdAt: createdSpecialty.createdAt,
        updatedAt: createdSpecialty.updatedAt,
      },
    };

    if (createdSpecialty) {
      return sendSuccessResponse(
        res,
        SUCCESS_MESSAGES.SPECIALTY.SPECIALTY_CREATED,
        response
      );
    }
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0].message;
      return sendBadRequest(res, firstError);
    }
    return sendInternalErrorResponse(res);
  }
};

import { Response } from 'express';
import { AuthRequest } from '../../interfaces/auth.interface';
import { ZodError } from 'zod';
import {
  sendBadRequest,
  sendInternalErrorResponse,
  sendNotFound,
  sendSuccessResponse,
} from '../../utils/commons/responseFunctions';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { isValidUUID } from '../../utils/validators/schemas/uuidSchema';
import { ProfessionalModel, SpecialtyModel } from '../../models';
import { IProfessional } from '../../interfaces/professional.interface';

export const getProfessionalById = async (
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

    const professionalInstance = await ProfessionalModel.findByPk(id, {
      include: [
        {
          model: SpecialtyModel,
          as: 'specialty',
          attributes: ['id', 'name', 'description', 'isActive'],
        },
      ],
      attributes: { exclude: ['deletedAt'] },
    });

    if (!professionalInstance) {
      return sendNotFound(res, ERROR_MESSAGES.PROFESSIONAL.NOT_FOUND);
    }

    const professional: IProfessional = professionalInstance.toJSON() as IProfessional;

    const response = {
      professional: {
        id: professional.id,
        username: professional.username,
        firstname: professional.firstname,
        lastname: professional.lastname,
        email: professional.email,
        phone: professional.phone,
        specialty: professional.specialty,
        start_at: professional.start_at,
        finish_at: professional.finish_at,
        state: professional.state,
        createdAt: professional.createdAt,
        updatedAt: professional.updatedAt,
      },
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.PROFESSIONAL.PROFESSIONAL_FOUND,
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

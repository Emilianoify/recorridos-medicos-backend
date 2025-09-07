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
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { updateProfessionalSchema } from '../../utils/validators/schemas/professionalSchemas';
import {
  existingProfessional,
  existingEmail,
  existingUsername,
  isSpecialtyActiveAndExists,
} from '../../utils/validators/dbValidators';
import { ProfessionalModel, SpecialtyModel } from '../../models';
import { IProfessional } from '../../interfaces/professional.interface';

export const updateProfessional = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const body = req.body;

    if (!id) {
      return sendBadRequest(res, ERROR_MESSAGES.PROFESSIONAL.ID_REQUIRED);
    }

    if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
      return sendBadRequest(res, ERROR_MESSAGES.SERVER.EMPTY_BODY);
    }

    const professionalExists = await existingProfessional(id);
    if (!professionalExists) {
      return sendNotFound(res, ERROR_MESSAGES.PROFESSIONAL.NOT_FOUND);
    }

    const validData = updateProfessionalSchema.parse(body);
    const { specialtyId, username, email } = validData;

    const currentProfessionalInstance = await ProfessionalModel.findByPk(id);

    if (!currentProfessionalInstance) {
      return sendNotFound(res, ERROR_MESSAGES.PROFESSIONAL.NOT_FOUND);
    }

    const currentProfessional: IProfessional = currentProfessionalInstance.toJSON() as IProfessional;

    if (specialtyId) {
      const specialtyActive = await isSpecialtyActiveAndExists(specialtyId);
      if (!specialtyActive) {
        return sendBadRequest(
          res,
          ERROR_MESSAGES.PROFESSIONAL.SPECIALTY_NOT_FOUND
        );
      }
    }

    if (email) {
      const emailExists = await existingEmail(email);
      if (emailExists && currentProfessional.email !== email) {
        return sendConflict(res, ERROR_MESSAGES.PROFESSIONAL.EMAIL_IN_USE);
      }
    }

    if (username) {
      const usernameExists = await existingUsername(username);
      if (usernameExists && currentProfessional.username !== username) {
        return sendConflict(res, ERROR_MESSAGES.PROFESSIONAL.USERNAME_IN_USE);
      }
    }

    const [affectedCount] = await ProfessionalModel.update(validData, {
      where: { id },
    });

    if (affectedCount === 0) {
      return sendNotFound(res, ERROR_MESSAGES.PROFESSIONAL.NOT_FOUND);
    }

    const updatedProfessional = await ProfessionalModel.findByPk(id, {
      include: [
        {
          model: SpecialtyModel,
          as: 'specialty',
          attributes: ['id', 'name', 'description', 'isActive'],
        },
      ],
      attributes: { exclude: ['deletedAt'] },
    });

    if (!updatedProfessional) {
      return sendBadRequest(res, ERROR_MESSAGES.PROFESSIONAL.NOT_FOUND);
    }

    const professionalUpdated: IProfessional =
      updatedProfessional.toJSON() as IProfessional;

    const response = {
      professional: {
        id: professionalUpdated.id,
        username: professionalUpdated.username,
        firstname: professionalUpdated.firstname,
        lastname: professionalUpdated.lastname,
        email: professionalUpdated.email,
        phone: professionalUpdated.phone,
        specialty: professionalUpdated.specialty,
        start_at: professionalUpdated.start_at,
        finish_at: professionalUpdated.finish_at,
        state: professionalUpdated.state,
        createdAt: professionalUpdated.createdAt,
        updatedAt: professionalUpdated.updatedAt,
      },
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.PROFESSIONAL.PROFESSIONAL_UPDATED,
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

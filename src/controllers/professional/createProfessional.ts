import { AuthRequest } from '../../interfaces/auth.interface';
import { Response } from 'express';
import {
  sendBadRequest,
  sendConflict,
  sendInternalErrorResponse,
  sendNotFound,
  sendSuccessResponse,
} from '../../utils/commons/responseFunctions';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { ZodError } from 'zod';
import { createProfessionalSchema } from '../../utils/validators/schemas/professionalSchemas';
import {
  existingEmail,
  existingUsername,
  isSpecialtyActiveAndExists,
} from '../../utils/validators/dbValidators';
import { ProfessionalModel, SpecialtyModel } from '../../models';
import { UserState } from '../../enums/UserState';
import { IProfessional } from '../../interfaces/professional.interface';

export const createProfessional = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const body = req.body;

    if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
      return sendBadRequest(res, ERROR_MESSAGES.SERVER.EMPTY_BODY);
    }

    const validData = createProfessionalSchema.parse(body);
    const { username, firstname, lastname, email, specialtyId, phone } =
      validData;

    const specialtyActive = await isSpecialtyActiveAndExists(specialtyId);
    if (!specialtyActive) {
      return sendBadRequest(
        res,
        ERROR_MESSAGES.PROFESSIONAL.SPECIALTY_INACTIVE
      );
    }

    const emailExists = await existingEmail(email);
    if (emailExists) {
      return sendConflict(res, ERROR_MESSAGES.PROFESSIONAL.EMAIL_IN_USE);
    }

    if (username) {
      const usernameExists = await existingUsername(username);
      if (usernameExists) {
        return sendConflict(res, ERROR_MESSAGES.PROFESSIONAL.USERNAME_IN_USE);
      }
    }

    const newProfessional = await ProfessionalModel.create({
      username,
      firstname,
      lastname,
      email,
      specialtyId,
      phone,
      state: UserState.ACTIVE,
    });

    const createdProfessional: IProfessional =
      newProfessional.toJSON() as IProfessional;

    const professionalWithSpecialty = await ProfessionalModel.findByPk(
      createdProfessional.id,
      {
        include: [
          {
            model: SpecialtyModel,
            as: 'specialty',
            attributes: ['id', 'name', 'description', 'isActive'],
          },
        ],
        attributes: { exclude: ['deletedAt'] },
      }
    );

    if (!professionalWithSpecialty) {
      return sendNotFound(res, ERROR_MESSAGES.PROFESSIONAL.NOT_FOUND);
    }

    const professionalWithSpecialtyJSON: IProfessional =
      professionalWithSpecialty.toJSON() as IProfessional;

    const response = {
      professional: {
        id: professionalWithSpecialtyJSON.id,
        username: professionalWithSpecialtyJSON.username,
        firstname: professionalWithSpecialtyJSON.firstname,
        lastname: professionalWithSpecialtyJSON.lastname,
        email: professionalWithSpecialtyJSON.email,
        phone: professionalWithSpecialtyJSON.phone,
        specialty: professionalWithSpecialtyJSON.specialty,
        start_at: professionalWithSpecialtyJSON.start_at,
        finish_at: professionalWithSpecialtyJSON.finish_at,
        state: professionalWithSpecialtyJSON.state,
        createdAt: professionalWithSpecialtyJSON.createdAt,
        updatedAt: professionalWithSpecialtyJSON.updatedAt,
      },
    };
    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.PROFESSIONAL.PROFESSIONAL_CREATED,
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

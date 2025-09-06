import { AuthRequest } from '../../interfaces/auth.interface';
import { Response } from 'express';
import {
  sendBadRequest,
  sendConflict,
  sendInternalErrorResponse,
  sendSuccessResponse,
} from '../../utils/commons/responseFunctions';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { ZodError } from 'zod';
import { createProfessionalSchema } from '../../utils/validators/schemas/professionalSchemas';
import { isValidUUID } from '../../utils/validators/schemas/uuidSchema';

import {
  existingEmail,
  existingSpecialty,
  existingUsername,
  isSpecialtyActiveAndExists,
} from '../../utils/validators/dbValidators';
import { ProfessionalModel } from '../../models';
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

    if (!isValidUUID(specialtyId)) {
      return sendBadRequest(
        res,
        ERROR_MESSAGES.PROFESSIONAL.INVALID_SPECIALTY_ID
      );
    }

    const specialtyExists = await existingSpecialty(specialtyId);
    if (!specialtyExists) {
      return sendBadRequest(
        res,
        ERROR_MESSAGES.PROFESSIONAL.SPECIALTY_NOT_FOUND
      );
    }

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

    const newProfessional = (await ProfessionalModel.create({
      username,
      firstname,
      lastname,
      email,
      specialtyId,
      phone,
      state: UserState.ACTIVE,
    })) as Partial<IProfessional>;

    const response = {
      professional: {
        id: newProfessional.id,
        username: newProfessional.username,
        firstname: newProfessional.firstname,
        lastname: newProfessional.lastname,
        email: newProfessional.email,
        specialtyId: newProfessional.specialtyId,
        phone: newProfessional.phone,
        state: newProfessional.state,
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

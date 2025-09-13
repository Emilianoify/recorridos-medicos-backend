import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { AuthRequest } from '../../interfaces/auth.interface';
import { ProfessionalModel, SpecialtyModel } from '../../models';
import {
  sendBadRequest,
  sendNotFound,
  sendSuccessResponse,
  sendInternalErrorResponse,
} from '../../utils/commons/responseFunctions';
import { Response } from 'express';
import { isValidUUID } from '../../utils/validators/schemas/uuidSchema';
import { IProfessional } from '../../interfaces/professional.interface';

export const restoreProfessional = async (
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

    const deletedProfessionalInstance = await ProfessionalModel.findOne({
      where: { id },
      paranoid: false,
    });

    if (!deletedProfessionalInstance) {
      return sendNotFound(res, ERROR_MESSAGES.PROFESSIONAL.NOT_FOUND);
    }

    const deletedProfessional: IProfessional = deletedProfessionalInstance.toJSON() as IProfessional;

    if (deletedProfessional.deletedAt === null) {
      return sendBadRequest(res, ERROR_MESSAGES.PROFESSIONAL.ALREADY_ACTIVE);
    }

    await ProfessionalModel.restore({
      where: { id },
    });

    const restoredProfessionalInstance = await ProfessionalModel.findByPk(id, {
      include: [
        {
          model: SpecialtyModel,
          as: 'specialty',
          attributes: ['id', 'name', 'description', 'isActive'],
        },
      ],
      attributes: { exclude: ['deletedAt'] },
    });

    if (!restoredProfessionalInstance) {
      return sendNotFound(res, ERROR_MESSAGES.PROFESSIONAL.NOT_FOUND);
    }

    const restoredProfessional: IProfessional = restoredProfessionalInstance.toJSON() as IProfessional;

    const response = {
      professional: {
        id: restoredProfessional.id,
        username: restoredProfessional.username,
        firstname: restoredProfessional.firstname,
        lastname: restoredProfessional.lastname,
        email: restoredProfessional.email,
        phone: restoredProfessional.phone,
        specialty: restoredProfessional.specialty,
        start_at: restoredProfessional.start_at,
        finish_at: restoredProfessional.finish_at,
        state: restoredProfessional.state,
        createdAt: restoredProfessional.createdAt,
        updatedAt: restoredProfessional.updatedAt,
      },
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.PROFESSIONAL.PROFESSIONAL_RESTORED,
      response
    );
  } catch (error) {
    return sendInternalErrorResponse(res);
  }
};

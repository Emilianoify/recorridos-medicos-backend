import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { AuthRequest } from '../../interfaces/auth.interface';
import { SpecialtyModel } from '../../models';
import {
  sendBadRequest,
  sendNotFound,
  sendSuccessResponse,
  sendInternalErrorResponse,
} from '../../utils/commons/responseFunctions';
import { Response } from 'express';
import { isValidUUID } from '../../utils/validators/schemas/uuidSchema';
import { ISpecialty } from '../../interfaces/specialty.interface';

export const restoreSpecialty = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      return sendBadRequest(res, ERROR_MESSAGES.SPECIALTY.ID_REQUIRED);
    }

    if (!isValidUUID(id)) {
      return sendBadRequest(res, ERROR_MESSAGES.SPECIALTY.INVALID_ID);
    }
    const deletedSpecialty = (await SpecialtyModel.findOne({
      where: { id },
      paranoid: false,
    })) as ISpecialty | null;

    if (!deletedSpecialty) {
      return sendNotFound(res, ERROR_MESSAGES.SPECIALTY.NOT_FOUND);
    }

    if (deletedSpecialty.deletedAt === null) {
      return sendBadRequest(res, ERROR_MESSAGES.SPECIALTY.ALREADY_ACTIVE);
    }

    await SpecialtyModel.restore({
      where: { id },
    });

    const restoredSpecialtyInstance = await SpecialtyModel.findByPk(id);

    if (!restoredSpecialtyInstance) {
      return sendNotFound(res, ERROR_MESSAGES.SPECIALTY.NOT_FOUND);
    }

    const restoredSpecialty: ISpecialty = restoredSpecialtyInstance.toJSON() as ISpecialty;

    const response = {
      specialty: {
        id: restoredSpecialty!.id,
        name: restoredSpecialty!.name,
        description: restoredSpecialty!.description,
        isActive: restoredSpecialty!.isActive,
        createdAt: restoredSpecialty!.createdAt,
        updatedAt: restoredSpecialty!.updatedAt,
      },
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.SPECIALTY.SPECIALTY_RESTORED,
      response
    );
  } catch (error) {
    return sendInternalErrorResponse(res);
  }
};

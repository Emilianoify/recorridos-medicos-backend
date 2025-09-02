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
import { ZoneModel } from '../../models';
import { existingZone } from '../../utils/validators/dbValidators';
import { isValidUUID } from '../../utils/validators/schemas/uuidSchema';

export const deleteZone = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      return sendBadRequest(res, ERROR_MESSAGES.ZONE.ID_REQUIRED);
    }

    if (!isValidUUID(id)) {
      return sendBadRequest(res, ERROR_MESSAGES.ZONE.INVALID_ID);
    }

    const zoneExists = await existingZone(id);
    if (!zoneExists) {
      return sendNotFound(res, ERROR_MESSAGES.ZONE.NOT_FOUND);
    }

    const deletedCount = await ZoneModel.destroy({
      where: { id },
    });

    if (deletedCount === 0) {
      return sendNotFound(res, ERROR_MESSAGES.ZONE.NOT_FOUND);
    }

    return sendSuccessResponse(res, SUCCESS_MESSAGES.ZONE.DELETED);
  } catch (error) {
    console.error('Error deleting zone:', error);
    return sendInternalErrorResponse(res);
  }
};

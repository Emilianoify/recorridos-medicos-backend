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

import { RoleModel } from '../../models';
import { existingRole } from '../../utils/validators/dbValidators';
import { isValidUUID } from '../../utils/validators/schemas/uuidSchema';

export const deleteRole = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      return sendBadRequest(res, ERROR_MESSAGES.ROLE.ID_REQUIRED);
    }

    if (!isValidUUID(id)) {
      return sendBadRequest(res, ERROR_MESSAGES.ROLE.INVALID_ID);
    }

    const roleExists = await existingRole(id);
    if (!roleExists) {
      return sendNotFound(res, ERROR_MESSAGES.ROLE.NOT_FOUND);
    }

    const deletedCount = await RoleModel.destroy({
      where: { id },
    });

    if (deletedCount === 0) {
      return sendNotFound(res, ERROR_MESSAGES.ROLE.NOT_FOUND);
    }

    return sendSuccessResponse(res, SUCCESS_MESSAGES.ROLE.ROLE_DELETED);
  } catch (error) {
    return sendInternalErrorResponse(res);
  }
};

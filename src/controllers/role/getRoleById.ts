import { Response } from 'express';
import { AuthRequest } from '../../interfaces/auth.interface';
import {
  sendBadRequest,
  sendInternalErrorResponse,
  sendNotFound,
  sendSuccessResponse,
} from '../../utils/commons/responseFunctions';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { RoleModel } from '../../models';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { isValidUUID } from '../../utils/validators/schemas/uuidSchema';
import { IRole } from '../../interfaces/role.interface';

export const getRoleById = async (
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
    const roleExists = await RoleModel.findByPk(id);

    if (!roleExists) {
      return sendNotFound(res, ERROR_MESSAGES.ROLE.NOT_FOUND);
    }

    const role: IRole = roleExists.toJSON() as IRole;

    const response = {
      role: {
        id: role.id,
        name: role.name,
        description: role.description,
        permissions: role.permissions,
        isActive: role.isActive,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      },
    };

    sendSuccessResponse(res, SUCCESS_MESSAGES.ROLE.ROLE_FOUND, response);
  } catch (error) {
    return sendInternalErrorResponse(res);
  }
};

import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { AuthRequest } from '../../interfaces/auth.interface';
import { IRole } from '../../interfaces/role.interface';
import { RoleModel } from '../../models';
import {
  sendBadRequest,
  sendNotFound,
  sendSuccessResponse,
  sendInternalErrorResponse,
} from '../../utils/commons/responseFunctions';
import { isValidUUID } from '../../utils/validators/schemas/uuidSchema';
import { Response } from 'express';
export const restoreRole = async (
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

    const deletedRole = await RoleModel.findOne({
      where: { id },
      paranoid: false,
    });

    if (!deletedRole) {
      return sendNotFound(res, ERROR_MESSAGES.ROLE.NOT_FOUND);
    }

    await RoleModel.restore({ where: { id } });

    await deletedRole.reload();
    const restoredRole = deletedRole.toJSON() as IRole;

    const response = {
      role: {
        id: restoredRole.id,
        name: restoredRole.name,
        description: restoredRole.description,
        permissions: restoredRole.permissions,
        isActive: restoredRole.isActive,
        createdAt: restoredRole.createdAt,
        updatedAt: restoredRole.updatedAt,
      },
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.ROLE.ROLE_RESTORED,
      response
    );
  } catch (error) {
    console.error('Error restoring role:', error);
    return sendInternalErrorResponse(res);
  }
};

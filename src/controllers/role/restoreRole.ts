import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { AuthRequest } from '../../interfaces/auth.interface';
import { RoleModel } from '../../models';
import {
  sendBadRequest,
  sendNotFound,
  sendSuccessResponse,
  sendInternalErrorResponse,
} from '../../utils/commons/responseFunctions';
import { Response } from 'express';
import { isValidUUID } from '../../utils/validators/schemas/uuidSchema';
import { IRole } from '../../interfaces/role.interface';

export const restoreRole = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      return sendBadRequest(res, ERROR_MESSAGES.ROLE.ROLE_ID_REQUIRED);
    }

    if (!isValidUUID(id)) {
      return sendBadRequest(res, ERROR_MESSAGES.ROLE.INVALID_ROLE_ID);
    }
    const deletedRole = (await RoleModel.findOne({
      where: { id },
      paranoid: false,
    })) as IRole | null;

    if (!deletedRole) {
      return sendNotFound(res, ERROR_MESSAGES.ROLE.ROLE_NOT_FOUND);
    }

    if (deletedRole.deletedAt === null) {
      return sendBadRequest(res, ERROR_MESSAGES.ROLE.ROLE_ALREADY_ACTIVE);
    }

    await RoleModel.restore({
      where: { id },
    });

    const restoredRole = (await RoleModel.findByPk(id)) as unknown as IRole;

    if (!restoredRole) {
      return sendNotFound(res, ERROR_MESSAGES.ROLE.ROLE_NOT_FOUND);
    }

    const response = {
      role: {
        id: restoredRole!.id,
        name: restoredRole!.name,
        description: restoredRole!.description,
        permissions: restoredRole!.permissions,
        isActive: restoredRole!.isActive,
        createdAt: restoredRole!.createdAt,
        updatedAt: restoredRole!.updatedAt,
      },
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.ROLE.ROLE_RESTORED,
      response
    );
  } catch (error) {
    return sendInternalErrorResponse(res);
  }
};

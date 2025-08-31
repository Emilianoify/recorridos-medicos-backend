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
import { isValidUUID } from '../../utils/validators/schemas/uuidSchema';
import {
  existingRole,
  existingRoleName,
} from '../../utils/validators/dbValidators';
import { updateRoleSchema } from '../../utils/validators/schemas/roleSchemas';
import { RoleModel } from '../../models';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { IRole } from '../../interfaces/role.interface';

export const updateRole = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const body = req.body;

    if (!id) {
      return sendBadRequest(res, ERROR_MESSAGES.ROLE.INVALID_ROLE_ID);
    }

    if (!isValidUUID(id)) {
      return sendBadRequest(res, ERROR_MESSAGES.ROLE.INVALID_ROLE_ID);
    }

    if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
      return sendBadRequest(res, ERROR_MESSAGES.SERVER.EMPTY_BODY);
    }

    const roleExists = await existingRole(id);
    if (!roleExists) {
      return sendNotFound(res, ERROR_MESSAGES.ROLE.ROLE_NOT_FOUND);
    }

    const validData = updateRoleSchema.parse(body);

    if (validData.name) {
      const nameExists = await existingRoleName(validData.name);
      if (nameExists) {
        return sendConflict(res, ERROR_MESSAGES.ROLE.ROLE_NAME_IN_USE);
      }
    }

    const [affectedCount, updatedRoles] = await RoleModel.update(validData, {
      where: { id },
      returning: true,
    });

    if (affectedCount === 0) {
      return sendNotFound(res, ERROR_MESSAGES.ROLE.ROLE_NOT_FOUND);
    }

    const updatedRole = updatedRoles[0] as unknown as IRole;

    const response = {
      id: updatedRole.id,
      name: updatedRole.name,
      description: updatedRole.description,
      permissions: updatedRole.permissions,
      isActive: updatedRole.isActive,
      createdAt: updatedRole.createdAt,
      updatedAt: updatedRole.updatedAt,
    };

    sendSuccessResponse(res, SUCCESS_MESSAGES.ROLE.ROLE_UPDATED, response);
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.message[0];
      return sendBadRequest(res, firstError);
    }
    return sendInternalErrorResponse(res);
  }
};

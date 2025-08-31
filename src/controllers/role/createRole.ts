import { Response } from 'express';
import { AuthRequest } from '../../interfaces/auth.interface';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import {
  sendBadRequest,
  sendConflict,
  sendInternalErrorResponse,
  sendSuccessResponse,
} from '../../utils/commons/responseFunctions';
import { ZodError } from 'zod';
import { roleBaseSchema } from '../../utils/validators/schemas/roleSchemas';
import { existingRoleName } from '../../utils/validators/dbValidators';
import { RoleModel } from '../../models';
import { IRole } from '../../interfaces/role.interface';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';

interface CreateRole {
  name: string;
  description?: string | null;
  permissions?: string[] | null;
  isActive?: boolean | null;
}

export const createRole = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const body = req.body;

    if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
      return sendBadRequest(res, ERROR_MESSAGES.SERVER.EMPTY_BODY);
    }

    const validRole: CreateRole = roleBaseSchema.parse(body);

    const { name, description, permissions, isActive } = validRole;

    const roleExists = await existingRoleName(name);
    if (roleExists) {
      return sendConflict(res, ERROR_MESSAGES.ROLE.NAME_IN_USE);
    }

    const createdRole = (await RoleModel.create({
      name,
      description: description,
      permissions: permissions,
      isActive: isActive !== undefined ? isActive : true,
    })) as Partial<IRole>;

    const response = {
      role: {
        id: createdRole.id,
        name: createdRole.name,
        description: createdRole.description,
        isActive: createdRole.isActive,
        createdAt: createdRole.createdAt,
        updatedAt: createdRole.updatedAt,
      },
    };

    if (createdRole) {
      return sendSuccessResponse(
        res,
        SUCCESS_MESSAGES.ROLE.ROLE_CREATED,
        response
      );
    }
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0];
      return sendBadRequest(res, firstError.message);
    }
    return sendInternalErrorResponse(res);
  }
};

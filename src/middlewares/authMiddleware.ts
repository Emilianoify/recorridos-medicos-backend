import { NextFunction } from 'express';
import { ERROR_MESSAGES } from '../constants/messages/error.messages';
import { UserState } from '../enums/UserState';
import { AuthRequest } from '../interfaces/auth.interface';
import { UserModel, RoleModel } from '../models';
import {
  sendBadRequest,
  sendInternalErrorResponse,
} from '../utils/commons/responseFunctions';
import { Response } from 'express';
import { IUser } from '../interfaces/user.interface';

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.tokenPayload) {
      return sendBadRequest(res, ERROR_MESSAGES.AUTH.TOKEN_REQUIRED);
    }

    const userExists = await UserModel.findByPk(req.tokenPayload.id, {
      include: [
        {
          model: RoleModel,
          as: 'role',
          attributes: ['id', 'name', 'permissions', 'isActive'],
        },
      ],
      attributes: { exclude: ['password'] },
    });

    if (!userExists) {
      return sendBadRequest(res, ERROR_MESSAGES.USER.NOT_FOUND);
    }

    const user: IUser = userExists.toJSON() as IUser;

    if (user.state !== UserState.ACTIVE) {
      return sendBadRequest(res, ERROR_MESSAGES.AUTH.USER_INACTIVE);
    }

    if (!user.role?.isActive) {
      return sendBadRequest(res, ERROR_MESSAGES.AUTH.ROLE_INACTIVE);
    }

    req.user = {
      id: user.id,
      username: user.username,
      firstname: user.firstname,
      lastname: user.lastname,
      corporative_email: user.corporative_email,
      role: user.role,
      state: user.state,
      roleId: user.roleId,
      lastLogin: user.lastLogin,
      userPermissions: user.role.permissions || [],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    next();
  } catch (error) {
    console.error('Error en authMiddleware:', error);
    return sendInternalErrorResponse(res);
  }
};

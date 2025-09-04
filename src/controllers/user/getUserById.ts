import { Response } from 'express';
import { AuthRequest } from '../../interfaces/auth.interface';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import {
  sendBadRequest,
  sendInternalErrorResponse,
  sendNotFound,
  sendSuccessResponse,
} from '../../utils/commons/responseFunctions';
import { isValidUUID } from '../../utils/validators/schemas/uuidSchema';
import { RoleModel, UserModel } from '../../models';
import { IUser } from '../../interfaces/user.interface';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';

export const getUserById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      return sendBadRequest(res, ERROR_MESSAGES.USER.ID_REQUIRED);
    }

    if (!isValidUUID(id)) {
      return sendBadRequest(res, ERROR_MESSAGES.USER.INVALID_ID);
    }

    const user = (await UserModel.findByPk(id, {
      include: [
        {
          model: RoleModel,
          as: 'role',
          attributes: ['id', 'name', 'permissions', 'isActive'],
        },
      ],
      attributes: { exclude: ['password'] },
    })) as IUser | null;

    if (!user) {
      return sendNotFound(res, ERROR_MESSAGES.USER.NOT_FOUND);
    }

    const response = {
      user: {
        id: user.id,
        username: user.username,
        firstname: user.firstname,
        lastname: user.lastname,
        corporative_email: user.corporative_email,
        state: user.state,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt, // 🆕 Útil para saber cuándo se modificó
      },
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.USER.PROFILE_RETRIEVED,
      response
    );
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    return sendInternalErrorResponse(res);
  }
};

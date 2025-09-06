import { AuthRequest } from '../../interfaces/auth.interface';
import { Response } from 'express';
import { RoleModel, UserModel } from '../../models';
import { IUser } from '../../interfaces/user.interface';
import {
  sendInternalErrorResponse,
  sendNotFound,
  sendSuccessResponse,
} from '../../utils/commons/responseFunctions';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';

export const getUserProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const user = (await UserModel.findByPk(userId, {
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
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.USER.PROFILE_RETRIEVED,
      response
    );
  } catch (error) {
    return sendInternalErrorResponse(res);
  }
};

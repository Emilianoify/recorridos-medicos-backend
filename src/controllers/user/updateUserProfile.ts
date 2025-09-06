import { ZodError } from 'zod';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { AuthRequest } from '../../interfaces/auth.interface';
import { IUser } from '../../interfaces/user.interface';
import { UserModel, RoleModel } from '../../models';
import {
  sendBadRequest,
  sendNotFound,
  sendSuccessResponse,
  sendInternalErrorResponse,
} from '../../utils/commons/responseFunctions';
import { updateUserSchema } from '../../utils/validators/schemas/userSchemas';
import { Response } from 'express';

export const updateUserProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const body = req.body;

    if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
      return sendBadRequest(res, ERROR_MESSAGES.SERVER.EMPTY_BODY);
    }

    const validData = updateUserSchema.parse(body);
    const { firstname, lastname } = validData;
    const currentUser = (await UserModel.findByPk(userId, {
      include: [
        {
          model: RoleModel,
          as: 'role',
          attributes: ['id', 'name', 'permissions', 'isActive'],
        },
      ],
      attributes: { exclude: ['password'] },
    })) as IUser | null;

    if (!currentUser) {
      return sendNotFound(res, ERROR_MESSAGES.USER.NOT_FOUND);
    }

    const updateData: any = {};

    if (firstname) updateData.firstname = firstname;
    if (lastname) updateData.lastname = lastname;

    const [affectedCount] = await UserModel.update(updateData, {
      where: { id: userId },
    });

    if (affectedCount === 0) {
      return sendBadRequest(res, ERROR_MESSAGES.USER.UPDATE_FAILED);
    }

    const updatedUser = (await UserModel.findByPk(userId, {
      include: [
        {
          model: RoleModel,
          as: 'role',
          attributes: ['id', 'name', 'permissions', 'isActive'],
        },
      ],
      attributes: { exclude: ['password'] },
    })) as IUser | null;

    if (!updatedUser) {
      return sendNotFound(res, ERROR_MESSAGES.USER.NOT_FOUND);
    }

    const response = {
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        firstname: updatedUser.firstname,
        lastname: updatedUser.lastname,
        corporative_email: updatedUser.corporative_email,
        role: updatedUser.role,
        state: updatedUser.state,
        lastLogin: updatedUser.lastLogin,
        updatedAt: updatedUser.updatedAt,
      },
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.USER.PROFILE_UPDATED,
      response
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0].message;
      return sendBadRequest(res, firstError);
    }

    return sendInternalErrorResponse(res);
  }
};

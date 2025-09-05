import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { AuthRequest } from '../../interfaces/auth.interface';
import { Response } from 'express';
import {
  sendBadRequest,
  sendInternalErrorResponse,
  sendNotFound,
  sendSuccessResponse,
} from '../../utils/commons/responseFunctions';
import { isValidUUID } from '../../utils/validators/schemas/uuidSchema';
import { IUser } from '../../interfaces/user.interface';
import { UserModel, RoleModel } from '../../models';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';

export const restoreUser = async (
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

    const deletedUser = (await UserModel.findByPk(id, {
      include: [
        {
          model: RoleModel,
          as: 'role',
          attributes: ['id', 'name', 'permissions', 'isActive'],
        },
      ],
      paranoid: false,
      attributes: { exclude: ['password'] },
    })) as IUser | null;

    if (!deletedUser) {
      return sendNotFound(res, ERROR_MESSAGES.USER.NOT_FOUND);
    }

    if (deletedUser.deletedAt === null) {
      return sendBadRequest(res, ERROR_MESSAGES.USER.ALREADY_ACTIVE);
    }

    if (!deletedUser.role?.isActive) {
      return sendBadRequest(res, ERROR_MESSAGES.AUTH.ROLE_INACTIVE);
    }
    await UserModel.restore({
      where: { id },
    });

    const response = {
      user: {
        id: deletedUser.id,
        username: deletedUser.username,
        firstname: deletedUser.firstname,
        lastname: deletedUser.lastname,
        corporative_email: deletedUser.corporative_email,
        role: deletedUser.role,
        state: deletedUser.state,
        restoredAt: new Date(),
      },
    };
    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.USER.USER_RESTORED,
      response
    );
  } catch (error) {
    return sendInternalErrorResponse(res);
  }
};

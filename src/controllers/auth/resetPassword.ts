import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { TokenRevocationReason } from '../../enums/TokenRevocationReason';
import { IUser } from '../../interfaces/user.interface';
import {
  sendBadRequest,
  sendSuccessResponse,
  sendInternalErrorResponse,
} from '../../utils/commons/responseFunctions';
import { revokeAllUserTokens } from '../../utils/jwt/tokenManager';
import { RoleModel, UserModel } from '../../models';
import { ZodError } from 'zod';
import { UserState } from '../../enums/UserState';
import { ResetPasswordSchema } from '../../utils/validators/schemas/authSchemas';

interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const body = req.body;
    if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
      return sendBadRequest(res, ERROR_MESSAGES.SERVER.EMPTY_BODY);
    }

    const validResetPassword = ResetPasswordSchema.parse(body);

    const { token, newPassword }: ResetPasswordRequest = validResetPassword;

    const user = (await UserModel.findOne({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          [Op.gt]: new Date(),
        },
      },
      include: [
        {
          model: RoleModel,
          as: 'role',
          attributes: ['id', 'name', 'isActive'],
        },
      ],
    })) as IUser | null;

    if (!user) {
      sendBadRequest(res, ERROR_MESSAGES.AUTH.INVALID_RESET_TOKEN);
      return;
    }

    if (user.state !== UserState.ACTIVE) {
      sendBadRequest(res, ERROR_MESSAGES.AUTH.USER_INACTIVE);
      return;
    }

    if (!user.role?.isActive) {
      sendBadRequest(res, ERROR_MESSAGES.AUTH.ROLE_INACTIVE);
      return;
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password!);
    if (isSamePassword) {
      sendBadRequest(res, ERROR_MESSAGES.AUTH.SAME_PASSWORD);
      return;
    }

    const saltRounds = parseInt(process.env.SALT_ROUNDS!!);
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    await UserModel.update(
      {
        password: hashedNewPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        lastLogin: new Date(),
      },
      { where: { id: user.id } }
    );

    revokeAllUserTokens(user.id, TokenRevocationReason.PASSWORD_CHANGE);

    sendSuccessResponse(res, SUCCESS_MESSAGES.AUTH.PASSWORD_RESET_SUCCESS);
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0];
      return sendBadRequest(res, firstError.message);
    }
    return sendInternalErrorResponse(res);
  }
};

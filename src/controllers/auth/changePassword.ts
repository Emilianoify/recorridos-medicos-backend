import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { TokenRevocationReason } from '../../enums/TokenRevocationReason';
import { AuthRequest } from '../../interfaces/auth.interface';
import {
  sendBadRequest,
  sendNotFound,
  sendSuccessResponse,
  sendInternalErrorResponse,
} from '../../utils/commons/responseFunctions';
import { revokeAllUserTokens } from '../../utils/jwt/tokenManager';
import { Response } from 'express';
import { ChangePasswordSchema } from '../../utils/validators/schemas/authSchemas';
import { UserModel } from '../../models';
import { IUser } from '../../interfaces/user.interface';
import { UserState } from '../../enums/UserState';
import bcrypt from 'bcrypt';
import { ZodError } from 'zod';

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export const changePassword = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const body = req.body;
    if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
      return sendBadRequest(res, ERROR_MESSAGES.SERVER.EMPTY_BODY);
    }

    const validNewPassword = ChangePasswordSchema.parse(body);

    const { currentPassword, newPassword }: ChangePasswordRequest =
      validNewPassword;
    const userId = req.user!.id;

    if (currentPassword === newPassword) {
      return sendBadRequest(res, ERROR_MESSAGES.AUTH.SAME_PASSWORD);
    }

    const userExists = await UserModel.findByPk(userId, {
      attributes: [
        'id',
        'username',
        'password',
        'corporative_email',
        'isActive',
        'state',
      ],
    });

    if (!userExists) {
      return sendNotFound(res, ERROR_MESSAGES.USER.NOT_FOUND);
    }

    const user: IUser = userExists.toJSON() as IUser;

    if (user.state !== UserState.ACTIVE) {
      return sendBadRequest(res, ERROR_MESSAGES.AUTH.USER_INACTIVE);
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isCurrentPasswordValid) {
      return sendBadRequest(res, ERROR_MESSAGES.AUTH.INVALID_CURRENT_PASSWORD);
    }

    const isSameAsCurrentPassword = await bcrypt.compare(
      newPassword,
      user.password
    );
    if (isSameAsCurrentPassword) {
      return sendBadRequest(res, ERROR_MESSAGES.AUTH.SAME_PASSWORD);
    }

    const saltRounds = parseInt(process.env.SALT_ROUNDS!!);
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    await UserModel.update(
      {
        password: hashedNewPassword,
        lastLogin: new Date(),
      },
      { where: { id: userId } }
    );

    revokeAllUserTokens(userId, TokenRevocationReason.PASSWORD_CHANGE);

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.AUTH.PASSWORD_CHANGED_SUCCESS
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0];
      return sendBadRequest(res, firstError.message);
    }
    return sendInternalErrorResponse(res);
  }
};

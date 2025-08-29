import 'dotenv';
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { ZodError } from 'zod';
import {
  sendBadRequest,
  sendInternalErrorResponse,
  sendSuccessResponse,
  sendUnauthorized,
} from '../../utils/commons/responseFunctions';
import { LoginSchema } from '../../utils/validators/schemas/authSchemas';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { RoleModel, UserModel } from '../../models';
import { IUser } from '../../interfaces/user.interface';
import { UserState } from '../../enums/UserState';

interface LoginRequest {
  username: string;
  password: string;
}

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body;
    if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
      return sendBadRequest(res, ERROR_MESSAGES.SERVER.EMPTY_BODY);
    }

    const validLoginFields: LoginRequest = LoginSchema.parse(body);
    const { username, password } = validLoginFields;

    const user = (await UserModel.findOne({
      where: { username },
      include: [
        {
          model: RoleModel,
          as: 'role',
          attributes: ['id', 'name', 'permissions', 'isActive'],
          where: { isActive: true },
        },
      ],
    })) as IUser | null;

    if (!user) {
      return sendUnauthorized(res, ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    if (user.state !== UserState.ACTIVE) {
      return sendUnauthorized(res, ERROR_MESSAGES.AUTH.USER_INACTIVE);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password!);
    if (!isPasswordValid) {
      return sendUnauthorized(res, ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return sendInternalErrorResponse(res);
    }

    const accessTokenExpiry = process.env.JWT_EXPIRES_IN || '1h';
    const refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

    const accessTokenPayload = {
      id: user.id,
      username: user.username,
      roleId: user.roleId,
      type: 'access',
    };

    const accessToken = jwt.sign(accessTokenPayload, jwtSecret, {
      expiresIn: accessTokenExpiry,
    } as jwt.SignOptions);

    const refreshTokenPayload = {
      id: user.id,
      username: user.username,
      type: 'refresh',
    };

    const refreshToken = jwt.sign(refreshTokenPayload, jwtSecret, {
      expiresIn: refreshTokenExpiry,
    } as jwt.SignOptions);

    await UserModel.update(
      { lastLogin: new Date() },
      { where: { id: user.id } }
    );

    const responseData = {
      user: {
        id: user.id,
        username: user.username,
        firstname: user.firstname,
        lastname: user.lastname,
        corporative_email: user.corporative_email,
        state: user.state,
        lastLogin: new Date(),
        role: user.role,
      },
      tokens: {
        accessToken,
        refreshToken,
        accessTokenExpiry,
        refreshTokenExpiry,
      },
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.AUTH.LOGIN_SUCCESS,
      responseData
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0];
      return sendBadRequest(res, firstError.message);
    }

    console.error('Error en login:', error);
    return sendInternalErrorResponse(res);
  }
};

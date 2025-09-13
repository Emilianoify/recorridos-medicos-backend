import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel, RoleModel } from '../../models';
import { IUser } from '../../interfaces/user.interface';
import {
  sendBadRequest,
  sendSuccessResponse,
  sendInternalErrorResponse,
  sendNotFound,
  sendUnauthorized,
} from '../../utils/commons/responseFunctions';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { isTokenRevoked } from '../../utils/jwt/tokenManager';
import { UserState } from '../../enums/UserState';
import {
  RefreshTokenRequest,
  RefreshTokenPayload,
} from '../../interfaces/auth.interface';

export const refreshToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { refreshToken: token }: RefreshTokenRequest = req.body;

    if (!token) {
      sendBadRequest(res, ERROR_MESSAGES.AUTH.REFRESH_TOKEN_REQUIRED);
      return;
    }

    const jwtSecret: jwt.Secret = process.env.JWT_SECRET!!;
    if (!jwtSecret) {
      sendInternalErrorResponse(res);
      return;
    }

    const decoded = jwt.verify(token, jwtSecret) as RefreshTokenPayload;

    if (decoded.type !== 'refresh') {
      sendBadRequest(res, ERROR_MESSAGES.AUTH.INVALID_TOKEN_TYPE);
      return;
    }

    if (isTokenRevoked(token, decoded.id, decoded.iat)) {
      sendUnauthorized(res, ERROR_MESSAGES.AUTH.TOKEN_REVOKED);
      return;
    }

    const userExists = await UserModel.findOne({
      where: {
        id: decoded.id,
        username: decoded.username,
      },
      include: [
        {
          model: RoleModel,
          as: 'role',
          attributes: ['id', 'name', 'permissions', 'isActive'],
        },
      ],
    });

    if (!userExists) {
      sendNotFound(res, ERROR_MESSAGES.USER.NOT_FOUND);
      return;
    }

    const user: IUser = userExists.toJSON() as IUser;

    // Verificar que el usuario esté activo
    if (user.state === UserState.INACTIVE) {
      sendBadRequest(res, ERROR_MESSAGES.AUTH.USER_INACTIVE);
      return;
    }

    if (user.state === UserState.BANNED) {
      sendBadRequest(res, ERROR_MESSAGES.AUTH.USER_BANNED);
      return;
    }

    // Verificar que el rol esté activo
    if (!user.role?.isActive) {
      sendBadRequest(res, ERROR_MESSAGES.AUTH.ROLE_INACTIVE);
      return;
    }

    // Configuración de tokens
    const accessTokenExpiry = process.env.JWT_EXPIRES_IN || '1h';

    // Generar nuevo Access Token
    const accessTokenPayload = {
      id: user.id,
      username: user.username,
      roleId: user.roleId,
      type: 'access',
    };

    const newAccessToken = jwt.sign(accessTokenPayload, jwtSecret, {
      expiresIn: accessTokenExpiry,
    } as jwt.SignOptions);

    await UserModel.update(
      { lastLogin: new Date() },
      { where: { id: user.id } }
    );

    const responseData = {
      accessToken: newAccessToken,
      accessTokenExpiry,
      user: {
        id: user.id,
        username: user.username,
        firstname: user.firstname,
        lastname: user.lastname,
        role: {
          id: user.role.id,
          name: user.role.name,
          permissions: user.role.permissions,
        },
      },
      refreshedAt: new Date().toISOString(),
    };

    sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.AUTH.TOKEN_REFRESHED,

      responseData
    );
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      sendUnauthorized(res, ERROR_MESSAGES.AUTH.REFRESH_TOKEN_EXPIRED);
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      sendUnauthorized(res, ERROR_MESSAGES.AUTH.INVALID_REFRESH_TOKEN);
      return;
    }

    console.error('Error en refreshToken:', error);
    sendInternalErrorResponse(res);
  }
};

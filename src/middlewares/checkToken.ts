import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, JwtPayload } from '../interfaces/auth.interface';
import { ERROR_MESSAGES } from '../constants/messages/error.messages';
import { isTokenRevoked } from '../utils/jwt/tokenManager';
import {
  sendUnauthorized,
  sendInternalErrorResponse,
} from '../utils/commons/responseFunctions';

export const checkToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendUnauthorized(res, ERROR_MESSAGES.AUTH.TOKEN_REQUIRED); // 👈 Usar tu función
    }

    const token = authHeader.substring(7);

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return sendInternalErrorResponse(res); // 👈 Usar tu función
    }

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    if (isTokenRevoked(token, decoded.id, decoded.iat)) {
      return sendUnauthorized(res, ERROR_MESSAGES.AUTH.TOKEN_REVOKED); // 👈 Usar tu función
    }

    if (!decoded.id || !decoded.username || !decoded.roleId) {
      return sendUnauthorized(res, ERROR_MESSAGES.AUTH.INVALID_TOKEN_STRUCTURE); // 👈 Usar tu función
    }

    req.tokenPayload = decoded;
    req.rawToken = token;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return sendUnauthorized(res, ERROR_MESSAGES.AUTH.TOKEN_EXPIRED); // 👈 Usar tu función
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return sendUnauthorized(res, ERROR_MESSAGES.AUTH.INVALID_TOKEN); // 👈 Usar tu función
    }

    if (error instanceof jwt.NotBeforeError) {
      return sendUnauthorized(res, ERROR_MESSAGES.AUTH.TOKEN_NOT_ACTIVE); // 👈 Usar tu función
    }

    console.error('Error en checkToken:', error);
    return sendInternalErrorResponse(res); // 👈 Usar tu función
  }
};

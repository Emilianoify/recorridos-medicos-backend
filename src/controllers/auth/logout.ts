import { Response } from 'express';
import { AuthRequest } from '../../interfaces/auth.interface';
import {
  sendInternalErrorResponse,
  sendSuccessResponse,
} from '../../utils/commons/responseFunctions';
import { TokenRevocationReason } from '../../enums/TokenRevocationReason';
import { revokeToken } from '../../utils/jwt/tokenManager';
import { UserModel } from '../../models';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';

export const logout = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const token = req.rawToken!;
    const now = new Date();

    revokeToken(token, TokenRevocationReason.LOGOUT);

    await UserModel.update({ lastLogin: now }, { where: { id: userId } });
    return sendSuccessResponse(res, SUCCESS_MESSAGES.AUTH.LOGOUT_SUCCESS);
  } catch (error) {
    return sendInternalErrorResponse(res);
  }
};

import { IUser } from '../../interfaces/user.interface';
import { RoleModel, UserModel } from '../../models';
import {
  sendBadRequest,
  sendSuccessResponse,
  sendInternalErrorResponse,
} from '../../utils/commons/responseFunctions';
import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { UserState } from '../../enums/UserState';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import {
  generateRecoveryToken,
  generateTokenExpiration,
} from '../../utils/helpers/tokenRecovery';

interface ForgotPasswordRequest {
  identifier: string;
}

export const forgotPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { identifier }: ForgotPasswordRequest = req.body;

    if (!identifier) {
      sendBadRequest(res, ERROR_MESSAGES.AUTH.IDENTIFIER_REQUIRED);
      return;
    }

    const userExists = await UserModel.findOne({
      where: {
        [Op.or]: [{ username: identifier }, { corporative_email: identifier }],
      },
      include: [
        {
          model: RoleModel,
          as: 'role',
          attributes: ['id', 'name', 'isActive'],
        },
      ],
    });

    if (!userExists) {
      sendSuccessResponse(res, SUCCESS_MESSAGES.AUTH.RECOVERY_EMAIL_SENT);
      return;
    }

    const user: IUser = userExists.toJSON() as IUser;

    if (user.state === UserState.ACTIVE) {
      sendSuccessResponse(res, SUCCESS_MESSAGES.AUTH.RECOVERY_EMAIL_SENT);
      return;
    }

    if (!user.role?.isActive) {
      sendSuccessResponse(res, SUCCESS_MESSAGES.AUTH.RECOVERY_EMAIL_SENT);
      return;
    }

    const recoveryToken = generateRecoveryToken();
    const tokenExpiration = generateTokenExpiration();

    await UserModel.update(
      {
        passwordResetToken: recoveryToken,
        passwordResetExpires: tokenExpiration,
      },
      { where: { id: user.id } }
    );

    // TODO: Aquí se enviaría el email real
    // Por ahora simulamos el envío con console.log
    console.log('\n📧 ========== EMAIL DE RECUPERACIÓN ==========');
    console.log(`Para: ${user.corporative_email}`);
    console.log(`Usuario: ${user.firstname} ${user.lastname}`);
    console.log(`Token de recuperación: ${recoveryToken}`);
    console.log(`Válido hasta: ${tokenExpiration.toLocaleString()}`);
    console.log('============================================\n');

    // Log para debugging (quitar en producción)
    console.log(
      `🔑 Token generado para ${user.username}: ${recoveryToken} (expira: ${tokenExpiration})`
    );

    sendSuccessResponse(res, SUCCESS_MESSAGES.AUTH.RECOVERY_EMAIL_SENT);
  } catch (error) {
    sendInternalErrorResponse(res);
  }
};

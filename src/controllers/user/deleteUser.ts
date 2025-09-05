import { AuthRequest } from '../../interfaces/auth.interface';
import { Response } from 'express';
import {
  sendBadRequest,
  sendInternalErrorResponse,
  sendNotFound,
  sendSuccessResponse,
  sendForbidden, // 🆕 Necesario para auto-eliminación
} from '../../utils/commons/responseFunctions';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { UserModel, RoleModel } from '../../models'; // 🆕 Agregar RoleModel
import { existingUser } from '../../utils/validators/dbValidators';
import { isValidUUID } from '../../utils/validators/schemas/uuidSchema';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { IUser } from '../../interfaces/user.interface'; // 🆕 Para typing

export const deleteUser = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const currentUserId = req.user!.id;

    if (!id) {
      return sendBadRequest(res, ERROR_MESSAGES.USER.ID_REQUIRED);
    }

    if (!isValidUUID(id)) {
      return sendBadRequest(res, ERROR_MESSAGES.USER.INVALID_ID);
    }

    if (id === currentUserId) {
      return sendForbidden(res, ERROR_MESSAGES.USER.CANNOT_DELETE_SELF);
    }

    const userExists = await existingUser(id);
    if (!userExists) {
      return sendNotFound(res, ERROR_MESSAGES.USER.NOT_FOUND);
    }

    const userToDelete = (await UserModel.findByPk(id, {
      include: [
        {
          model: RoleModel,
          as: 'role',
          attributes: ['name'],
        },
      ],
      paranoid: false,
    })) as IUser | null;

    if (!userToDelete) {
      return sendNotFound(res, ERROR_MESSAGES.USER.NOT_FOUND);
    }

    if (userToDelete.deletedAt !== null) {
      return sendBadRequest(res, ERROR_MESSAGES.USER.ALREADY_DELETED);
    }

    // 🆕 Validar que no sea el último administrador activo
    if (userToDelete.role?.name === 'Administrador') {
      const activeAdminsCount = await UserModel.count({
        include: [
          {
            model: RoleModel,
            as: 'role',
            where: { name: 'Administrador' },
          },
        ],
        where: {
          state: 'usuario_activo',
        },
      });

      if (activeAdminsCount <= 1) {
        return sendForbidden(res, ERROR_MESSAGES.USER.CANNOT_DELETE_LAST_ADMIN);
      }
    }

    const deletedCount = await UserModel.destroy({
      where: { id },
    });

    if (deletedCount === 0) {
      return sendNotFound(res, ERROR_MESSAGES.USER.NOT_FOUND);
    }

    return sendSuccessResponse(res, SUCCESS_MESSAGES.USER.USER_DELETED);
  } catch (error) {
    return sendInternalErrorResponse(res);
  }
};

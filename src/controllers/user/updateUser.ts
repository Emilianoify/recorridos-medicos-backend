import { Response } from 'express';
import { AuthRequest } from '../../interfaces/auth.interface';
import { ZodError } from 'zod';
import {
  sendBadRequest,
  sendConflict,
  sendInternalErrorResponse,
  sendNotFound,
  sendSuccessResponse,
} from '../../utils/commons/responseFunctions';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { isValidUUID } from '../../utils/validators/schemas/uuidSchema';
import {
  existingEmail,
  existingUser,
  existingUsername,
  validateRole,
} from '../../utils/validators/dbValidators';
import { updateUserSchema } from '../../utils/validators/schemas/userSchemas';
import { UserModel, RoleModel } from '../../models';
import { IUser } from '../../interfaces/user.interface';
import bcrypt from 'bcrypt';
import { USER_STATE_VALUES } from '../../utils/validators/enumValidators';
import { UserState } from '../../enums/UserState';

export const updateUser = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const body = req.body;

    if (!id) {
      return sendBadRequest(res, ERROR_MESSAGES.USER.ID_REQUIRED);
    }

    if (!isValidUUID(id)) {
      return sendBadRequest(res, ERROR_MESSAGES.USER.INVALID_ID);
    }

    if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
      return sendBadRequest(res, ERROR_MESSAGES.SERVER.EMPTY_BODY);
    }

    const userExists = await existingUser(id);
    if (!userExists) {
      return sendNotFound(res, ERROR_MESSAGES.USER.NOT_FOUND);
    }

    const validUpdateData = updateUserSchema.parse(body);

    const {
      username,
      firstname,
      lastname,
      corporative_email,
      password,
      roleId,
      state,
    } = validUpdateData;

    const currentUser = await UserModel.findByPk(id);
    if (!currentUser) {
      return sendNotFound(res, ERROR_MESSAGES.USER.NOT_FOUND);
    }

    const user: IUser = currentUser.toJSON() as IUser;
    const updateData: Partial<IUser> = {};
    let hashedPassword: string;
    if (username && user.username !== username) {
      const usernameExists = await existingUsername(username);
      if (usernameExists) {
        return sendConflict(res, ERROR_MESSAGES.AUTH.USERNAME_IN_USE);
      }
      updateData.username = username;
    }

    if (corporative_email && user.corporative_email !== corporative_email) {
      const emailExists = await existingEmail(corporative_email);
      if (emailExists) {
        return sendConflict(res, ERROR_MESSAGES.AUTH.EMAIL_IN_USE);
      }
      updateData.corporative_email = corporative_email;
    }

    if (roleId) {
      const validRole = await validateRole(roleId);
      if (!validRole) {
        return sendBadRequest(res, ERROR_MESSAGES.ROLE.INVALID_ID);
      }
      updateData.roleId = roleId;
    }

    if (password) {
      const saltRounds = parseInt(process.env.SALT_ROUNDS!!);
      hashedPassword = await bcrypt.hash(password, saltRounds);
      updateData.password = hashedPassword;
    }

    if (state) {
      const validState = USER_STATE_VALUES.includes(state as UserState);
      if (!validState) {
        return sendBadRequest(res, ERROR_MESSAGES.USER.INVALID_STATE);
      }
      updateData.state = state as UserState;
    }

    // Campos simples sin validaciones adicionales
    if (firstname) updateData.firstname = firstname;
    if (lastname) updateData.lastname = lastname;

    const [affectedCount] = await UserModel.update(updateData, {
      where: { id },
    });

    if (affectedCount === 0) {
      return sendNotFound(res, ERROR_MESSAGES.USER.NOT_FOUND);
    }

    const updatedUserWithRole = await UserModel.findByPk(id, {
      include: [
        {
          model: RoleModel,
          as: 'role',
          attributes: ['id', 'name', 'permissions', 'isActive'],
        },
      ],
      attributes: { exclude: ['password'] },
    });
    if (!updatedUserWithRole) {
      return sendNotFound(res, ERROR_MESSAGES.USER.NOT_FOUND);
    }

    const updatedUser: IUser = updatedUserWithRole.toJSON() as IUser;

    const response = {
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        firstname: updatedUser.firstname,
        lastname: updatedUser.lastname,
        corporative_email: updatedUser.corporative_email,
        role: updatedUser.role,
        state: updatedUser.state,
        updatedAt: updatedUser.updatedAt,
      },
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.USER.USER_UPDATED,
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

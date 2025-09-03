import { AuthRequest } from '../../interfaces/auth.interface';
import { ZodError } from 'zod';
import bcrypt from 'bcrypt';
import { Response } from 'express';
import { IUser } from '../../interfaces/user.interface';
import { RoleModel, UserModel } from '../../models';
import { UserState } from '../../enums/UserState';
import { createUserSchema } from '../../utils/validators/schemas/userSchemas'; // Tendrás que crear
import {
  existingUsername,
  existingEmail,
  validateRole,
} from '../../utils/validators/dbValidators'; // Ya los tienes
import {
  sendBadRequest,
  sendConflict,
  sendInternalErrorResponse,
  sendSuccessResponse,
  sendUnauthorized,
} from '../../utils/commons/responseFunctions';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';

export const createUser = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const body = req.body;

    if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
      return sendBadRequest(res, ERROR_MESSAGES.SERVER.EMPTY_BODY);
    }

    const validUser = createUserSchema.parse(body);

    const {
      username,
      firstname,
      lastname,
      corporative_email,
      password,
      roleId,
    } = validUser;

    const usernameExists = await existingUsername(username);
    if (usernameExists) {
      return sendConflict(res, ERROR_MESSAGES.AUTH.USERNAME_IN_USE);
    }

    const emailExists = await existingEmail(corporative_email);
    if (emailExists) {
      return sendConflict(res, ERROR_MESSAGES.AUTH.EMAIL_IN_USE);
    }

    const validRole = await validateRole(roleId);
    if (!validRole) {
      return sendBadRequest(res, ERROR_MESSAGES.AUTH.INVALID_ROLE_ID);
    }

    const saltRounds = parseInt(process.env.SALT_ROUNDS!!);
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = (await UserModel.create({
      username,
      firstname,
      lastname,
      corporative_email,
      password: hashedPassword,
      roleId,
      state: UserState.ACTIVE,
    })) as Partial<IUser>;

    const userWithRole = (await UserModel.findByPk(newUser.id, {
      include: [
        {
          model: RoleModel,
          as: 'role',
          attributes: ['id', 'name'],
        },
      ],
      attributes: { exclude: ['password'] },
    })) as Partial<IUser>;

    if (!userWithRole) {
      return sendUnauthorized(res, ERROR_MESSAGES.AUTH.USER_NO_ROLE);
    }

    const responseData = {
      id: userWithRole.id,
      username: userWithRole.username,
      firstname: userWithRole.firstname,
      lastname: userWithRole.lastname,
      corporative_email: userWithRole.corporative_email,
      role: userWithRole.role,
      createdAt: userWithRole.createdAt,
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.USER.USER_CREATED,
      responseData
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0].message;
      return sendBadRequest(res, firstError);
    }
    return sendInternalErrorResponse(res);
  }
};

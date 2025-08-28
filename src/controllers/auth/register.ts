import 'dotenv';
import { Request, Response } from 'express';
import {
  sendBadRequest,
  sendConflict,
  sendInternalErrorResponse,
  sendSuccessResponse,
  sendUnauthorized,
} from '../../utils/commons/responseFunctions';
import { UserRegisterSchema } from '../../utils/validators/schemas/authSchemas';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import {
  existingEmail,
  existingUsername,
  validateRole,
} from '../../utils/validators/dbValidators';
import bcrypt from 'bcrypt';
import { RoleModel, UserModel } from '../../models';
import { IUser } from '../../interfaces/user.interface';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';

interface RegisterRequest {
  username: string;
  firstname: string;
  lastname: string;
  corporative_email: string;
  password: string;
  roleId: string;
}

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.body) {
      return sendBadRequest(res, ERROR_MESSAGES.SERVER.EMPTY_BODY);
    }

    const validRegisterFields: RegisterRequest = UserRegisterSchema.parse(
      req.body
    );

    const {
      username,
      password,
      firstname,
      lastname,
      corporative_email,
      roleId,
    } = validRegisterFields;

    const usernameExists = await existingUsername(validRegisterFields.username);
    if (usernameExists) {
      return sendConflict(res, ERROR_MESSAGES.AUTH.USERNAME_IN_USE);
    }

    const emailExists = await existingEmail(corporative_email);
    if (emailExists) {
      return sendConflict(res, ERROR_MESSAGES.AUTH.EMAIL_IN_USE);
    }

    const roleIsValid = await validateRole(roleId);
    if (!roleIsValid) {
      return sendBadRequest(res, ERROR_MESSAGES.ROLE.ROLE_NOT_FOUND);
    }

    const saltRounds = process.env.SALT_ROUNDS;
    const hashedPassword = await bcrypt.hash(password, saltRounds!!);

    const newUser = (await UserModel.create({
      username,
      firstname,
      lastname,
      corporative_email,
      password: hashedPassword,
      roleId,
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
    })) as IUser | null;

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
    return sendInternalErrorResponse(res);
  }
};

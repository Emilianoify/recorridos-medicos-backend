import { Response } from 'express';
import { AuthRequest } from '../../interfaces/auth.interface';
import {
  sendBadRequest,
  sendInternalErrorResponse,
  sendSuccessResponse,
} from '../../utils/commons/responseFunctions';
import { UserState } from '../../enums/UserState';
import { Op } from 'sequelize';
import { RoleModel, UserModel } from '../../models';
import { IUser } from '../../interfaces/user.interface';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { isValidUUID } from '../../utils/validators/schemas/uuidSchema';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { USER_STATE_VALUES } from '../../utils/validators/enumValidators';

export const getUsers = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      page: pageQuery = '1',
      limit: limitQuery = '10',
      state: stateQuery,
      search,
      roleId,
    } = req.query;

    const page = Math.max(1, parseInt(pageQuery as string, 10) || 1);

    const limit = Math.min(
      50,
      Math.max(1, parseInt(limitQuery as string, 10) || 10)
    );

    const whereClause: any = {};

    if (stateQuery !== undefined) {
      if (USER_STATE_VALUES.includes(stateQuery as UserState)) {
        whereClause.state = stateQuery;
      } else {
        return sendBadRequest(res, ERROR_MESSAGES.USER.INVALID_STATE);
      }
    }

    if (roleId) {
      if (!isValidUUID(roleId as string)) {
        return sendBadRequest(res, ERROR_MESSAGES.ROLE.INVALID_ID);
      }
      whereClause.roleId = roleId;
    }

    if (search && typeof search === 'string' && search.trim().length > 0) {
      whereClause[Op.or] = [
        { firstname: { [Op.iLike]: `%${search.trim()}%` } },
        { lastname: { [Op.iLike]: `%${search.trim()}%` } },
        { username: { [Op.iLike]: `%${search.trim()}%` } },
        { corporative_email: { [Op.iLike]: `%${search.trim()}%` } },
      ];
    }

    const usersData = await UserModel.findAndCountAll({
      where: whereClause,
      limit: limit,
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['deletedAt', 'password'] },
      include: [
        {
          model: RoleModel,
          as: 'role',
          attributes: ['id', 'name', 'permissions', 'isActive'],
        },
      ],
    });

    const totalPages = Math.ceil(usersData.count / limit);

    const response = {
      users: usersData.rows.map((user: IUser | any) => ({
        id: user.id,
        username: user.username,
        firstname: user.firstname,
        lastname: user.lastname,
        corporative_email: user.corporative_email,
        role: user.role,
        state: user.state,
        createdAt: user.createdAt,
      })),
      pagination: {
        total: usersData.count,
        page: page,
        limit: limit,
        totalPages: totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      filters: {
        state: stateQuery || null,
        roleId: roleId || null,
        search: search || null,
      },
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.USER.USERS_FETCHED,
      response
    );
  } catch (error) {
    return sendInternalErrorResponse(res);
  }
};

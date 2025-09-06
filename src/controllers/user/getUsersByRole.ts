import { Response } from 'express';
import { AuthRequest } from '../../interfaces/auth.interface';
import {
  sendBadRequest,
  sendInternalErrorResponse,
  sendNotFound,
  sendSuccessResponse,
} from '../../utils/commons/responseFunctions';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { isValidUUID } from '../../utils/validators/schemas/uuidSchema';
import { existingRole } from '../../utils/validators/dbValidators';
import { UserModel, RoleModel } from '../../models';
import { IUser } from '../../interfaces/user.interface';
import { UserState } from '../../enums/UserState';
import { Op } from 'sequelize';

export const getUsersByRole = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { roleId } = req.params;
    const {
      page: pageQuery = '1',
      limit: limitQuery = '10',
      state: stateQuery,
      search,
      includeInactive = 'false',
    } = req.query;

    // Validaciones de entrada
    if (!roleId) {
      return sendBadRequest(res, ERROR_MESSAGES.ROLE.ID_REQUIRED);
    }

    if (!isValidUUID(roleId)) {
      return sendBadRequest(res, ERROR_MESSAGES.ROLE.INVALID_ID);
    }

    // Validar que el rol existe
    const roleExists = await existingRole(roleId);
    if (!roleExists) {
      return sendNotFound(res, ERROR_MESSAGES.ROLE.NOT_FOUND);
    }

    // Validaciones de paginación
    const page = Math.max(1, parseInt(pageQuery as string, 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(limitQuery as string, 10) || 10)
    );

    // Construir filtros
    const whereClause: any = {
      roleId: roleId,
    };

    // Filtro por estado específico
    if (stateQuery) {
      if (Object.values(UserState).includes(stateQuery as UserState)) {
        whereClause.state = stateQuery;
      } else {
        return sendBadRequest(res, ERROR_MESSAGES.USER.INVALID_STATE);
      }
    } else if (includeInactive !== 'true') {
      // Por defecto, solo usuarios activos
      whereClause.state = UserState.ACTIVE;
    }

    // Filtro de búsqueda por nombre/username/email
    if (search && typeof search === 'string' && search.trim().length > 0) {
      whereClause[Op.or] = [
        { firstname: { [Op.iLike]: `%${search.trim()}%` } },
        { lastname: { [Op.iLike]: `%${search.trim()}%` } },
        { username: { [Op.iLike]: `%${search.trim()}%` } },
        { corporative_email: { [Op.iLike]: `%${search.trim()}%` } },
      ];
    }

    // Buscar usuarios con el rol específico
    const usersData = await UserModel.findAndCountAll({
      where: whereClause,
      limit: limit,
      offset: (page - 1) * limit,
      order: [
        ['firstname', 'ASC'],
        ['lastname', 'ASC'],
      ], // Orden alfabético por nombre
      attributes: {
        exclude: [
          'password',
          'passwordResetToken',
          'passwordResetExpires',
          'deletedAt',
        ],
      },
      include: [
        {
          model: RoleModel,
          as: 'role',
          attributes: ['id', 'name', 'permissions', 'isActive'],
        },
      ],
    });

    // Obtener información del rol para la respuesta
    const roleInfo = (await RoleModel.findByPk(roleId, {
      attributes: ['id', 'name', 'description', 'isActive'],
    })) as any;

    const totalPages = Math.ceil(usersData.count / limit);

    const response = {
      role: {
        id: roleInfo.id,
        name: roleInfo.name,
        description: roleInfo.description,
        isActive: roleInfo.isActive,
      },
      users: usersData.rows.map((user: IUser | any) => ({
        id: user.id,
        username: user.username,
        firstname: user.firstname,
        lastname: user.lastname,
        corporative_email: user.corporative_email,
        state: user.state,
        lastLogin: user.lastLogin,
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
        roleId: roleId,
        state: stateQuery || (includeInactive === 'true' ? 'all' : 'active'),
        search: search || null,
        includeInactive: includeInactive === 'true',
      },
      summary: {
        totalUsersInRole: usersData.count,
        roleName: roleInfo.name,
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

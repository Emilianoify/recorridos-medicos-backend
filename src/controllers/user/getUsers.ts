import { Response } from 'express';
import { AuthRequest } from '../../interfaces/auth.interface';
import { ZodError } from 'zod';
import {
  sendBadRequest,
  sendInternalErrorResponse,
  sendSuccessResponse,
} from '../../utils/commons/responseFunctions';
import { Op } from 'sequelize';
import { RoleModel, UserModel } from '../../models';
import { IUser } from '../../interfaces/user.interface';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { userQuerySchema } from '../../utils/validators/schemas/paginationSchemas';

export const getUsers = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Validar query parameters con schema Zod
    const validatedQuery = userQuerySchema.parse(req.query);

    const {
      page,
      limit,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      roleId,
      state,
      search,
      createdFrom,
      createdTo,
    } = validatedQuery;

    // Construir whereClause
    const whereClause: any = {};

    // Filtro por estado
    if (state) {
      whereClause.state = state;
    }

    // Filtro por rol
    if (roleId) {
      whereClause.roleId = roleId;
    }

    // Filtro por búsqueda
    if (search) {
      whereClause[Op.or] = [
        { firstname: { [Op.iLike]: `%${search.trim()}%` } },
        { lastname: { [Op.iLike]: `%${search.trim()}%` } },
        { username: { [Op.iLike]: `%${search.trim()}%` } },
        { corporative_email: { [Op.iLike]: `%${search.trim()}%` } },
      ];
    }

    // Filtros por fecha de creación
    if (createdFrom || createdTo) {
      whereClause.createdAt = {};
      if (createdFrom) {
        whereClause.createdAt[Op.gte] = new Date(createdFrom);
      }
      if (createdTo) {
        whereClause.createdAt[Op.lte] = new Date(`${createdTo}T23:59:59.999Z`);
      }
    }

    // Construir orden dinámico
    const orderDirection = sortOrder.toUpperCase() as 'ASC' | 'DESC';
    const orderBy: [string, 'ASC' | 'DESC'][] = [[sortBy, orderDirection]];

    // Consulta a la base de datos
    const usersData = await UserModel.findAndCountAll({
      where: whereClause,
      limit: limit,
      offset: (page - 1) * limit,
      order: orderBy,
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
        state: state || null,
        roleId: roleId || null,
        search: search || null,
        createdFrom: createdFrom || null,
        createdTo: createdTo || null,
      },
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.USER.USERS_FETCHED,
      response
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0].message;
      return sendBadRequest(res, firstError);
    }
    console.error('Error fetching users:', error);
    return sendInternalErrorResponse(res);
  }
};

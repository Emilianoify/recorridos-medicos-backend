import { Response } from 'express';
import { AuthRequest } from '../../interfaces/auth.interface';
import { ZodError } from 'zod';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { IRole } from '../../interfaces/role.interface';
import { RoleModel } from '../../models';
import {
  sendSuccessResponse,
  sendInternalErrorResponse,
  sendBadRequest,
} from '../../utils/commons/responseFunctions';
import { Op, WhereOptions } from 'sequelize';
import { roleQuerySchema } from '../../utils/validators/schemas/paginationSchemas';

export const getRoles = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Validar query parameters con schema Zod
    const validatedQuery = roleQuerySchema.parse(req.query);

    const { page, limit, sortBy, sortOrder, isActive, search } = validatedQuery;

    // Construir whereClause
    const whereClause: WhereOptions = {};

    // Filtro por estado activo
    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }

    // Filtro por búsqueda
    if (search) {
      whereClause.name = {
        [Op.iLike]: `%${search.trim()}%`,
      };
    }

    // Construir orden dinámico
    const orderDirection = sortOrder.toUpperCase() as 'ASC' | 'DESC';
    const orderBy: [string, 'ASC' | 'DESC'][] = [[sortBy, orderDirection]];

    const rolesData = await RoleModel.findAndCountAll({
      where: whereClause,
      limit: limit,
      offset: (page - 1) * limit,
      order: orderBy,
      attributes: { exclude: ['deletedAt'] },
    });

    const totalPages = Math.ceil(rolesData.count / limit);

    const response = {
      roles: rolesData.rows.map(role => {
        const roleJson: IRole = role.toJSON() as IRole;
        return {
          id: roleJson.id,
          name: roleJson.name,
          description: roleJson.description,
          permissions: roleJson.permissions,
          isActive: roleJson.isActive,
          createdAt: roleJson.createdAt,
          updatedAt: roleJson.updatedAt,
        };
      }),
      pagination: {
        total: rolesData.count,
        page: page,
        limit: limit,
        totalPages: totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      filters: {
        isActive: isActive || null,
        search: search || null,
      },
    };

    return sendSuccessResponse(res, SUCCESS_MESSAGES.ROLE.ROLES_FETCHED, response);
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0].message;
      return sendBadRequest(res, firstError);
    }
    console.error('Error fetching roles:', error);
    return sendInternalErrorResponse(res);
  }
};

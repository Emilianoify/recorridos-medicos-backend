import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { AuthRequest } from '../../interfaces/auth.interface';
import { IRole } from '../../interfaces/role.interface';
import { RoleModel } from '../../models';
import {
  sendSuccessResponse,
  sendInternalErrorResponse,
  sendBadRequest,
} from '../../utils/commons/responseFunctions';
import { Response } from 'express';
import { Op } from 'sequelize';

export const getRoles = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      page: pageQuery = '1',
      limit: limitQuery = '10',
      isActive: isActiveQuery,
      search,
    } = req.query;

    const page = Math.max(1, parseInt(pageQuery as string, 10) || 1);

    const limit = Math.min(
      100,
      Math.max(1, parseInt(limitQuery as string, 10) || 10)
    );

    // Validar isActive si está presente
    let isActive: boolean | undefined;
    if (isActiveQuery !== undefined) {
      if (isActiveQuery === 'true') {
        isActive = true;
      } else if (isActiveQuery === 'false') {
        isActive = false;
      } else {
        return sendBadRequest(res, ERROR_MESSAGES.ROLE.INVALID_ROLE_STATUS);
      }
    }

    const whereClause: any = {};

    if (isActive !== undefined) {
      whereClause.isActive = isActive;
    }

    if (search && typeof search === 'string' && search.trim().length > 0) {
      whereClause.name = {
        [Op.iLike]: `%${search.trim()}%`,
      };
    }

    const rolesData = await RoleModel.findAndCountAll({
      where: whereClause,
      limit: limit,
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['deletedAt'] },
    });

    const totalPages = Math.ceil(rolesData.count / limit);

    const response = {
      roles: rolesData.rows.map((role: IRole | any) => ({
        id: role.id,
        name: role.name,
        description: role.description,
        permissions: role.permissions,
        isActive: role.isActive,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      })),
      pagination: {
        total: rolesData.count,
        page: page,
        limit: limit,
        totalPages: totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      filters: {
        isActive: isActive,
        search: search || null,
      },
    };

    sendSuccessResponse(res, SUCCESS_MESSAGES.ROLE.ROLES_FETCHED, response);
  } catch (error) {
    console.error('Error fetching roles:', error);
    return sendInternalErrorResponse(res);
  }
};

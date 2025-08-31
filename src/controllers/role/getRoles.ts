import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { AuthRequest } from '../../interfaces/auth.interface';
import { IRole } from '../../interfaces/role.interface';
import { RoleModel } from '../../models';
import {
  sendSuccessResponse,
  sendInternalErrorResponse,
} from '../../utils/commons/responseFunctions';
import { Response } from 'express';

export const getRoles = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { page = 1, limit = 10, isActive } = req.query;

    const whereClause: any = {};

    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }

    const rolesData = await RoleModel.findAndCountAll({
      where: whereClause,
      limit: Number(limit),
      offset: (Number(page) - 1) * Number(limit),
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['deletedAt'] },
    });

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
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(rolesData.count / Number(limit)),
      },
    };

    sendSuccessResponse(res, SUCCESS_MESSAGES.ROLE.ROLES_FETCHED, response);
  } catch (error) {
    console.error('Error fetching roles:', error);
    return sendInternalErrorResponse(res);
  }
};

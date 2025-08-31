import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { AuthRequest } from '../../interfaces/auth.interface';
import {
  sendSuccessResponse,
  sendInternalErrorResponse,
  sendBadRequest,
} from '../../utils/commons/responseFunctions';
import { Response } from 'express';
import { Op } from 'sequelize';
import { ISpecialty } from '../../interfaces/specialty.interface';
import { SpecialtyModel } from '../../models';

export const getSpecialties = async (
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

    let isActive: boolean | undefined;

    if (isActiveQuery !== undefined) {
      if (isActiveQuery === 'true') {
        isActive = true;
      } else if (isActiveQuery === 'false') {
        isActive = false;
      } else {
        return sendBadRequest(res, ERROR_MESSAGES.SPECIALTY.NOT_FOUND);
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

    const specialtiesData = await SpecialtyModel.findAndCountAll({
      where: whereClause,
      limit: limit,
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['deletedAt'] },
    });

    const totalPages = Math.ceil(specialtiesData.count / limit);

    const response = {
      specialties: specialtiesData.rows.map((specialty: ISpecialty | any) => ({
        id: specialty.id,
        name: specialty.name,
        description: specialty.description,
        permissions: specialty.permissions,
        isActive: specialty.isActive,
        createdAt: specialty.createdAt,
        updatedAt: specialty.updatedAt,
      })),
      pagination: {
        total: specialtiesData.count,
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

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.SPECIALTY.SPECIALTIES_FETCHED,
      response
    );
  } catch (error) {
    console.error('Error fetching roles:', error);
    return sendInternalErrorResponse(res);
  }
};

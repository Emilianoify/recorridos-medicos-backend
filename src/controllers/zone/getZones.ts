import { Response } from 'express';
import { AuthRequest } from '../../interfaces/auth.interface';
import {
  sendBadRequest,
  sendInternalErrorResponse,
  sendSuccessResponse,
} from '../../utils/commons/responseFunctions';
import { Op } from 'sequelize';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { ZoneModel } from '../../models';
import { IZone } from '../../interfaces/zone.interface';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';

export const getZones = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      page: pageQuery = '1',
      limit: limitQuery = '10',
      isActive: isActiveQuery,
      search,
      hasCoordinates,
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
        return sendBadRequest(res, ERROR_MESSAGES.ZONE.FETCH_FAILED);
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

    if (hasCoordinates !== undefined) {
      if (hasCoordinates === 'true') {
        whereClause.polygonCoordinates = {
          [Op.ne]: null,
        };
      } else if (hasCoordinates === 'false') {
        whereClause.polygonCoordinates = null;
      }
    }

    const zonesData = await ZoneModel.findAndCountAll({
      where: whereClause,
      limit: limit,
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['deletedAt'] },
    });

    const totalPages = Math.ceil(zonesData.count / limit);

    const response = {
      zones: zonesData.rows.map((zone: IZone | any) => ({
        id: zone.id,
        name: zone.name,
        description: zone.description,
        polygonCoordinates: zone.polygonCoordinates,
        isActive: zone.isActive,
        createdAt: zone.createdAt,
        updatedAt: zone.updatedAt,
      })),
      pagination: {
        total: zonesData.count,
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
    return sendSuccessResponse(res, SUCCESS_MESSAGES.ZONE.FETCHED, response);
  } catch (error) {
    return sendInternalErrorResponse(res);
  }
};

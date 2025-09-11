import { Response } from 'express';
import { AuthRequest } from '../../interfaces/auth.interface';
import { ZodError } from 'zod';
import {
  sendBadRequest,
  sendInternalErrorResponse,
  sendSuccessResponse,
} from '../../utils/commons/responseFunctions';
import { Op, WhereOptions } from 'sequelize';
import { ZoneModel } from '../../models';
import { IZone } from '../../interfaces/zone.interface';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { zoneQuerySchema } from '../../utils/validators/schemas/paginationSchemas';

export const getZones = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Validar query parameters con schema Zod
    const validatedQuery = zoneQuerySchema.parse(req.query);

    const { page, limit, sortBy, sortOrder, isActive, search, hasCoordinates } =
      validatedQuery;

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

    // Filtro por coordenadas
    if (hasCoordinates !== undefined) {
      if (hasCoordinates === 'true') {
        whereClause.polygonCoordinates = {
          [Op.ne]: null,
        };
      } else {
        whereClause.polygonCoordinates = null;
      }
    }

    // Construir orden dinámico
    const orderDirection = sortOrder.toUpperCase() as 'ASC' | 'DESC';
    const orderBy: [string, 'ASC' | 'DESC'][] = [[sortBy, orderDirection]];

    const zonesData = await ZoneModel.findAndCountAll({
      where: whereClause,
      limit: limit,
      offset: (page - 1) * limit,
      order: orderBy,
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
        isActive: isActive || null,
        search: search || null,
        hasCoordinates: hasCoordinates || null,
      },
    };

    return sendSuccessResponse(res, SUCCESS_MESSAGES.ZONE.FETCHED, response);
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0].message;
      return sendBadRequest(res, firstError);
    }
    console.error('Error fetching zones:', error);
    return sendInternalErrorResponse(res);
  }
};

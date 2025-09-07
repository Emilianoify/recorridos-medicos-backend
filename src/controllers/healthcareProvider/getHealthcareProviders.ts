import { Response } from 'express';
import { AuthRequest } from '../../interfaces/auth.interface';
import { ZodError } from 'zod';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import {
  sendSuccessResponse,
  sendInternalErrorResponse,
  sendBadRequest,
} from '../../utils/commons/responseFunctions';
import { Op } from 'sequelize';
import { HealthcareProviderModel } from '../../models';
import { IHealthcareProvider } from '../../interfaces/healthcareProvider.interface';
import { healthcareProviderQuerySchema } from '../../utils/validators/schemas/paginationSchemas';

export const getHealthcareProviders = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Validar query parameters con schema Zod
    const validatedQuery = healthcareProviderQuerySchema.parse(req.query);

    const {
      page,
      limit,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isActive,
      search,
      hasCode,
    } = validatedQuery;

    // Construir whereClause
    const whereClause: any = {};

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

    // Filtro por código
    if (hasCode !== undefined) {
      if (hasCode === 'true') {
        whereClause.code = {
          [Op.ne]: null,
        };
      } else {
        whereClause.code = null;
      }
    }

    // Construir orden dinámico
    const orderDirection = sortOrder.toUpperCase() as 'ASC' | 'DESC';
    const orderBy: [string, 'ASC' | 'DESC'][] = [[sortBy, orderDirection]];

    const healthcareProvidersData =
      await HealthcareProviderModel.findAndCountAll({
        where: whereClause,
        limit: limit,
        offset: (page - 1) * limit,
        order: orderBy,
        attributes: { exclude: ['deletedAt'] },
      });

    const totalPages = Math.ceil(healthcareProvidersData.count / limit);

    const response = {
      healthcareProviders: healthcareProvidersData.rows.map(
        (provider: IHealthcareProvider | any) => ({
          id: provider.id,
          name: provider.name,
          code: provider.code,
          isActive: provider.isActive,
          createdAt: provider.createdAt,
          updatedAt: provider.updatedAt,
        })
      ),
      pagination: {
        total: healthcareProvidersData.count,
        page: page,
        limit: limit,
        totalPages: totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      filters: {
        isActive: isActive || null,
        search: search || null,
        hasCode: hasCode || null,
      },
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.HEALTHCARE_PROVIDER.HEALTHCARE_FETCHED,
      response
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0].message;
      return sendBadRequest(res, firstError);
    }
    console.error('Error fetching healthcare providers:', error);
    return sendInternalErrorResponse(res);
  }
};

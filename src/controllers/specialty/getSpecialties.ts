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
import { ISpecialty } from '../../interfaces/specialty.interface';
import { SpecialtyModel } from '../../models';
import { specialtyQuerySchema } from '../../utils/validators/schemas/paginationSchemas';

export const getSpecialties = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Validar query parameters con schema Zod
    const validatedQuery = specialtyQuerySchema.parse(req.query);

    const {
      page,
      limit,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isActive,
      search,
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

    // Construir orden dinámico
    const orderDirection = sortOrder.toUpperCase() as 'ASC' | 'DESC';
    const orderBy: [string, 'ASC' | 'DESC'][] = [[sortBy, orderDirection]];

    const specialtiesData = await SpecialtyModel.findAndCountAll({
      where: whereClause,
      limit: limit,
      offset: (page - 1) * limit,
      order: orderBy,
      attributes: { exclude: ['deletedAt'] },
    });

    const totalPages = Math.ceil(specialtiesData.count / limit);

    const response = {
      specialties: specialtiesData.rows.map((specialty: ISpecialty | any) => ({
        id: specialty.id,
        name: specialty.name,
        description: specialty.description,
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
        isActive: isActive || null,
        search: search || null,
      },
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.SPECIALTY.SPECIALTIES_FETCHED,
      response
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0].message;
      return sendBadRequest(res, firstError);
    }
    console.error('Error fetching specialties:', error);
    return sendInternalErrorResponse(res);
  }
};

import { Response } from 'express';
import { AuthRequest } from '../../interfaces/auth.interface';
import { ZodError } from 'zod';
import {
  sendBadRequest,
  sendInternalErrorResponse,
  sendSuccessResponse,
} from '../../utils/commons/responseFunctions';
import { Op, WhereOptions } from 'sequelize';
import { ProfessionalModel, SpecialtyModel } from '../../models';
import { IProfessional } from '../../interfaces/professional.interface';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { isValidUUID } from '../../utils/validators/schemas/uuidSchema';
import { paginationSchema } from '../../utils/validators/schemas/paginationSchemas';

export const getProfessionalsByZone = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { zoneId } = req.params;

    // 1. Manual ID validation (standard pattern)
    if (!zoneId) {
      return sendBadRequest(res, ERROR_MESSAGES.ZONE.ID_REQUIRED);
    }

    if (!isValidUUID(zoneId)) {
      return sendBadRequest(res, ERROR_MESSAGES.ZONE.INVALID_ID);
    }

    // 2. Query validation
    const validatedQuery = paginationSchema.parse(req.query);

    const { page, limit, sortBy, sortOrder, search } = validatedQuery;

    // Build where clause for professionals working in the specified zone
    const whereClause: WhereOptions = {
      workingZoneIds: {
        [Op.contains]: [zoneId],
      },
    };

    // Search functionality
    if (search) {
      whereClause[Op.or.toString()] = [
        { firstname: { [Op.iLike]: `%${search.trim()}%` } },
        { lastname: { [Op.iLike]: `%${search.trim()}%` } },
        { username: { [Op.iLike]: `%${search.trim()}%` } },
        { email: { [Op.iLike]: `%${search.trim()}%` } },
      ];
    }

    // Dynamic ordering
    const orderDirection = sortOrder.toUpperCase() as 'ASC' | 'DESC';
    const orderBy: [string, 'ASC' | 'DESC'][] = [[sortBy, orderDirection]];

    // Database query
    const professionalsData = await ProfessionalModel.findAndCountAll({
      where: whereClause,
      limit: limit,
      offset: (page - 1) * limit,
      order: orderBy,
      attributes: { exclude: ['deletedAt'] },
      include: [
        {
          model: SpecialtyModel,
          as: 'specialty',
          attributes: ['id', 'name', 'description', 'isActive'],
        },
      ],
    });

    const totalPages = Math.ceil(professionalsData.count / limit);

    const response = {
      professionals: professionalsData.rows.map(professional => {
        const professionalJson: IProfessional =
          professional.toJSON() as IProfessional;
        return {
          id: professionalJson.id,
          firstname: professionalJson.firstname,
          lastname: professionalJson.lastname,
          username: professionalJson.username,
          email: professionalJson.email,
          phone: professionalJson.phone,
          state: professionalJson.state,
          specialty: professionalJson.specialty,
          start_at: professionalJson.start_at,
          finish_at: professionalJson.finish_at,

          createdAt: professionalJson.createdAt,
          updatedAt: professionalJson.updatedAt,
        };
      }),
      pagination: {
        total: professionalsData.count,
        page: page,
        limit: limit,
        totalPages: totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      filters: {
        zoneId: zoneId,
        search: search || null,
      },
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.PROFESSIONAL.PROFESSIONALS_BY_ZONE_FETCHED,
      response
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0].message;
      return sendBadRequest(res, firstError);
    }
    console.error('Error fetching professionals by zone:', error);
    return sendInternalErrorResponse(res);
  }
};

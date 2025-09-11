import { Response } from 'express';
import { AuthRequest } from '../../interfaces/auth.interface';
import { ZodError } from 'zod';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import {
  sendSuccessResponse,
  sendInternalErrorResponse,
  sendBadRequest,
} from '../../utils/commons/responseFunctions';
import { Op, WhereOptions } from 'sequelize';
import { ProfessionalModel, SpecialtyModel } from '../../models';
import { professionalQuerySchema } from '../../utils/validators/schemas/paginationSchemas';
import { IProfessional } from '../../interfaces/professional.interface';

export const getProfessionals = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Validar query parameters con schema Zod
    const validatedQuery = professionalQuerySchema.parse(req.query);

    const {
      page,
      limit,
      sortBy,
      sortOrder,
      specialtyId,
      state,
      search,
      hasSchedule,
    } = validatedQuery;

    // Construir whereClause
    const whereClause: WhereOptions = {};

    // Filtro por especialidad
    if (specialtyId) {
      whereClause.specialtyId = specialtyId;
    }

    // Filtro por estado
    if (state) {
      whereClause.state = state;
    }

    // Filtro por búsqueda
    if (search) {
      whereClause[Op.or.toString()] = [
        { firstname: { [Op.iLike]: `%${search.trim()}%` } },
        { lastname: { [Op.iLike]: `%${search.trim()}%` } },
        { username: { [Op.iLike]: `%${search.trim()}%` } },
        { email: { [Op.iLike]: `%${search.trim()}%` } },
      ];
    }

    // Filtro por horario
    if (hasSchedule !== undefined) {
      if (hasSchedule === 'true') {
        whereClause[Op.and.toString()] = [
          { start_at: { [Op.ne]: null } },
          { finish_at: { [Op.ne]: null } },
        ];
      } else {
        whereClause[Op.or.toString()] = [
          { start_at: null },
          { finish_at: null },
        ];
      }
    }

    // Construir orden dinámico
    const orderDirection = sortOrder.toUpperCase() as 'ASC' | 'DESC';
    const orderBy: [string, 'ASC' | 'DESC'][] = [[sortBy, orderDirection]];

    const professionalData = await ProfessionalModel.findAndCountAll({
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

    const totalPages = Math.ceil(professionalData.count / limit);

    const response = {
      professionals: professionalData.rows.map(professional => {
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
          updatedAt: professionalJson.updatedAt,
          createdAt: professionalJson.createdAt,
        };
      }),
      pagination: {
        total: professionalData.count,
        page: page,
        limit: limit,
        totalPages: totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      filters: {
        specialtyId: specialtyId || null,
        state: state || null,
        search: search || null,
        hasSchedule: hasSchedule || null,
      },
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.PROFESSIONAL.PROFESSIONAL_FETCHED,
      response
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0].message;
      return sendBadRequest(res, firstError);
    }
    console.error('Error fetching professionals:', error);
    return sendInternalErrorResponse(res);
  }
};

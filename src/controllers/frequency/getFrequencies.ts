import { Response } from 'express';
import { AuthRequest } from '../../interfaces/auth.interface';
import { FrequencyModel } from '../../models';
import { frequencyQuerySchema } from '../../utils/validators/schemas/paginationSchemas';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { Op } from 'sequelize';
import {
  sendSuccessResponse,
  sendBadRequest,
  sendInternalErrorResponse,
} from '../../utils/commons/responseFunctions';
import { ZodError } from 'zod';

export const getFrequencies = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const validatedParams = frequencyQuerySchema.parse(req.query);
    const { page, limit, sortBy, sortOrder, search } = validatedParams;

    const offset = (page - 1) * limit;

    // Build where conditions
    interface IFrequencyWhereClause {
      [Op.or]?: Array<{
        name?: { [Op.iLike]: string };
        description?: { [Op.iLike]: string };
      }>;
    }

    let whereConditions: IFrequencyWhereClause = {};

    if (search) {
      whereConditions = {
        [Op.or]: [
          { name: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } },
        ],
      };
    }

    // Obtener frecuencias con paginaci�n
    const { count, rows: frequencies } = await FrequencyModel.findAndCountAll({
      where: whereConditions,
      limit,
      offset,
      order: [[sortBy || 'createdAt', sortOrder.toUpperCase()]],
      attributes: [
        'id',
        'name',
        'description',
        'type',
        'calculationRule',
        'intervalUnit',
        'daysBetweenVisits',
        'visitsPerMonth',
        'intervalValue',
        'visitsPerDay',
        'isActive',
        'createdAt',
        'updatedAt',
      ],
    });

    const totalPages = Math.ceil(count / limit);

    const response = {
      frequencies,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: count,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };

    return sendSuccessResponse(res, SUCCESS_MESSAGES.FREQUENCY.FREQUENCIES_FETCHED, response);
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0].message;
      return sendBadRequest(res, firstError);
    }

    console.error('Error fetching frequencies:', error);
    return sendInternalErrorResponse(res);
  }
};

import { Response } from 'express';
import { AuthRequest } from '../../interfaces/auth.interface';
import { FrequencyModel } from '../../models';
import { frequencyQuerySchema } from '../../utils/validators/schemas/paginationSchemas';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { Op } from 'sequelize';

export const getFrequencies = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const validatedParams = frequencyQuerySchema.parse(req.query);
    const { page, limit, sortBy, sortOrder, search } = validatedParams;

    const offset = (page - 1) * limit;

    // Construir condiciones de b�squeda
    let whereConditions: any = {};

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

    res.status(200).json({
      success: true,
      message: SUCCESS_MESSAGES.FREQUENCY.FREQUENCIES_FETCHED,
      data: {
        frequencies,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: count,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      },
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        message: 'Par�metros de consulta inv�lidos',
        error: error.errors,
      });
      return;
    }

    console.error('Error al obtener frecuencias:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: ERROR_MESSAGES.SERVER.INTERNAL_ERROR,
    });
  }
};

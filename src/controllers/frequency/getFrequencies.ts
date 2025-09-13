import { Response } from 'express';
import { AuthRequest } from '../../interfaces/auth.interface';
import { FrequencyModel } from '../../models';
import { frequencyQuerySchema } from '../../utils/validators/schemas/paginationSchemas';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { Op, WhereOptions } from 'sequelize';
import { IFrequency } from '../../interfaces/frequency.interface';
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

    let whereConditions: WhereOptions = {};

    if (search) {
      whereConditions = {
        [Op.or]: [
          { name: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } },
        ],
      };
    }

    // Obtener frecuencias con paginación
    const { count, rows: frequencies } = await FrequencyModel.findAndCountAll({
      where: whereConditions,
      limit,
      offset,
      order: [[sortBy, sortOrder.toUpperCase()]],
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
      frequencies: frequencies.map(frequency => {
        const frequencyJson: IFrequency = frequency.toJSON() as IFrequency;
        return {
          id: frequencyJson.id,
          name: frequencyJson.name,
          description: frequencyJson.description,
          frequencyType: frequencyJson.frequencyType,
          nextDateCalculationRule: frequencyJson.nextDateCalculationRule,
          daysBetweenVisits: frequencyJson.daysBetweenVisits,
          visitsPerMonth: frequencyJson.visitsPerMonth,
          intervalValue: frequencyJson.intervalValue,
          intervalUnit: frequencyJson.intervalUnit,
          visitsPerDay: frequencyJson.visitsPerDay,
          weeklyPattern: frequencyJson.weeklyPattern,
          customSchedule: frequencyJson.customSchedule,
          respectBusinessHours: frequencyJson.respectBusinessHours,
          allowWeekends: frequencyJson.allowWeekends,
          allowHolidays: frequencyJson.allowHolidays,
          isActive: frequencyJson.isActive,
          createdAt: frequencyJson.createdAt,
          updatedAt: frequencyJson.updatedAt,
        };
      }),
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: count,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.FREQUENCY.FREQUENCIES_FETCHED,
      response
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0].message;
      return sendBadRequest(res, firstError);
    }

    console.error('Error fetching frequencies:', error);
    return sendInternalErrorResponse(res);
  }
};

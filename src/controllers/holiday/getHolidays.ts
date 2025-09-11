import { Response } from 'express';
import { AuthRequest } from '../../interfaces/auth.interface';
import { ZodError } from 'zod';
import {
  sendBadRequest,
  sendInternalErrorResponse,
  sendSuccessResponse,
} from '../../utils/commons/responseFunctions';
import { HolidayModel } from '../../models';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { IHoliday } from '../../interfaces/holiday.interface';
import { Op, WhereOptions } from 'sequelize';
import { holidayQuerySchema } from '../../utils/validators/schemas/paginationSchemas';

export const getHolidays = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const validatedQuery = holidayQuerySchema.parse(req.query);
    const { page, limit, year, month, fromDate, toDate, isActive } =
      validatedQuery;

    const whereClause: WhereOptions = {};

    if (typeof isActive === 'boolean') {
      whereClause.isActive = isActive;
    }

    // Filter by year
    if (year) {
      whereClause.date = {
        [Op.gte]: `${year}-01-01`,
        [Op.lte]: `${year}-12-31`,
      };
    }

    // Filter by month (requires year)
    if (month && year) {
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // Last day of month
      whereClause.date = {
        [Op.gte]: startDate,
        [Op.lte]: endDate,
      };
    }

    // Custom date range
    if (fromDate || toDate) {
      whereClause.date = {};
      if (fromDate) {
        whereClause.date[Op.gte] = fromDate;
      }
      if (toDate) {
        whereClause.date[Op.lte] = toDate;
      }
    }

    const holidaysData = await HolidayModel.findAndCountAll({
      where: whereClause,
      limit: limit,
      offset: (page - 1) * limit,
      order: [['date', 'ASC']],
      attributes: [
        'id',
        'name',
        'date',
        'description',
        'isNational',
        'isActive',
        'createdAt',
      ],
    });

    const totalPages = Math.ceil(holidaysData.count / limit);

    const response = {
      holidays: holidaysData.rows.map(holidayInstance => {
        const holiday: IHoliday = holidayInstance.toJSON() as IHoliday;
        return {
          id: holiday.id,
          name: holiday.name,
          date: holiday.date,
          description: holiday.description,
          isNational: holiday.isNational,
          isActive: holiday.isActive,
          dayOfWeek: new Date(holiday.date).toLocaleDateString('es-AR', {
            weekday: 'long',
          }),
          createdAt: holiday.createdAt,
        };
      }),
      pagination: {
        total: holidaysData.count,
        page: page,
        limit: limit,
        totalPages: totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      filters: {
        year: year || 0,
        month: month || 0,
        fromDate: fromDate || '',
        toDate: toDate || '',
        isActive: isActive ?? false,
      },
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.HOLIDAY.HOLIDAYS_FETCHED,
      response
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0].message;
      return sendBadRequest(res, firstError);
    }
    console.error('Error fetching holidays:', error);
    return sendInternalErrorResponse(res);
  }
};

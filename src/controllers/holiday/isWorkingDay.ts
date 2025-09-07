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

import { isWorkingDayQuerySchema } from '../../utils/validators/schemas/paginationSchemas';
import { IHoliday } from '../../interfaces/holiday.interface';

export const isWorkingDay = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { date } = isWorkingDayQuerySchema.parse(req.query);

    const inputDate = new Date(date);
    const dayOfWeek = inputDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    // Check if it's weekend
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Check if it's a holiday
    const holiday = (await HolidayModel.findOne({
      where: {
        date: date,
        isActive: true,
      },
      attributes: ['id', 'name', 'description', 'isNational'],
    })) as IHoliday | null;

    const isHoliday = !!holiday;
    const isWorkingDay = !isWeekend && !isHoliday;

    const response = {
      date: date,
      isWorkingDay: isWorkingDay,
      isWeekend: isWeekend,
      isHoliday: isHoliday,
      dayOfWeek: inputDate.toLocaleDateString('es-AR', { weekday: 'long' }),
      dayOfWeekNumber: dayOfWeek,
      holiday: holiday
        ? {
            id: holiday.id,
            name: holiday.name,
            description: holiday.description,
            isNational: holiday.isNational,
          }
        : null,
      businessRules: {
        weekendsAreNonWorking: true,
        holidaysAreNonWorking: true,
      },
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.HOLIDAY.WORKING_DAY_CHECKED,
      response
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0].message;
      return sendBadRequest(res, firstError);
    }
    console.error('Error checking working day:', error);
    return sendInternalErrorResponse(res);
  }
};

import { Response } from 'express';
import { AuthRequest } from '../../interfaces/auth.interface';
import { ZodError } from 'zod';
import {
  sendBadRequest,
  sendConflict,
  sendInternalErrorResponse,
  sendSuccessResponse,
} from '../../utils/commons/responseFunctions';
import { HolidayModel } from '../../models';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { createHolidaySchema } from '../../utils/validators/schemas/holidaySchemas';
import { IHoliday } from '../../interfaces/holiday.interface';

export const createCustomHoliday = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const body = req.body;

    if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
      return sendBadRequest(res, ERROR_MESSAGES.SERVER.EMPTY_BODY);
    }

    const validatedData = createHolidaySchema.parse(body);
    const { name, date, description, isRecurring, affectsScheduling, isActive } = validatedData;

    // Check if holiday already exists for this date
    const existingHoliday = await HolidayModel.findOne({
      where: { date },
      paranoid: false,
    });

    if (existingHoliday) {
      return sendConflict(res, ERROR_MESSAGES.HOLIDAY.DATE_IN_USE);
    }

    // Validate date is not in the past (optional business rule)
    const inputDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (inputDate < today) {
      return sendBadRequest(res, ERROR_MESSAGES.HOLIDAY.PAST_DATE_NOT_ALLOWED);
    }

    const newHolidayInstance = await HolidayModel.create({
      name,
      date,
      description: description || '',
      isNational: false, // Custom holidays are not national
      isRecurring: isRecurring || false,
      affectsScheduling: affectsScheduling !== undefined ? affectsScheduling : true,
      isActive: isActive !== undefined ? isActive : true,
    });

    const newHoliday: IHoliday = newHolidayInstance.toJSON() as IHoliday;

    const response = {
      holiday: {
        id: newHoliday.id,
        name: newHoliday.name,
        date: newHoliday.date,
        description: newHoliday.description,
        isNational: newHoliday.isNational,
        isRecurring: newHoliday.isRecurring,
        affectsScheduling: newHoliday.affectsScheduling,
        isActive: newHoliday.isActive,
        dayOfWeek: new Date(newHoliday.date).toLocaleDateString('es-AR', {
          weekday: 'long',
        }),
        createdAt: newHoliday.createdAt,
        updatedAt: newHoliday.updatedAt,
      },
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.HOLIDAY.HOLIDAY_CREATED,
      response
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0].message;
      return sendBadRequest(res, firstError);
    }

    console.error('Error creating custom holiday:', error);
    return sendInternalErrorResponse(res);
  }
};
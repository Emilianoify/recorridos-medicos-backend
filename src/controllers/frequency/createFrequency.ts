import { Response } from 'express';
import { AuthRequest } from '../../interfaces/auth.interface';
import { FrequencyModel } from '../../models';
import { createFrequencySchema } from '../../utils/validators/schemas/frequencySchemas';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { IFrequency } from '../../interfaces/frequency.interface';
import {
  sendBadRequest,
  sendInternalErrorResponse,
  sendSuccessResponse,
} from '../../utils/commons/responseFunctions';
import { ZodError } from 'zod';

export const createFrequency = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const validatedData = createFrequencySchema.parse(req.body);

    // Verificar si ya existe una frecuencia con el mismo nombre
    const existingFrequency = await FrequencyModel.findOne({
      where: { name: validatedData.name },
      paranoid: false,
    });

    if (existingFrequency) {
      return sendBadRequest(res, ERROR_MESSAGES.FREQUENCY.NAME_IN_USE);
    }

    const newFrequencyInstance = await FrequencyModel.create(validatedData);
    const newFrequency: IFrequency = newFrequencyInstance.toJSON() as IFrequency;

    const response = {
      frequency: {
        id: newFrequency.id,
        name: newFrequency.name,
        description: newFrequency.description,
        frequencyType: newFrequency.frequencyType,
        nextDateCalculationRule: newFrequency.nextDateCalculationRule,
        daysBetweenVisits: newFrequency.daysBetweenVisits,
        visitsPerMonth: newFrequency.visitsPerMonth,
        intervalValue: newFrequency.intervalValue,
        intervalUnit: newFrequency.intervalUnit,
        visitsPerDay: newFrequency.visitsPerDay,
        weeklyPattern: newFrequency.weeklyPattern,
        customSchedule: newFrequency.customSchedule,
        respectBusinessHours: newFrequency.respectBusinessHours,
        allowWeekends: newFrequency.allowWeekends,
        allowHolidays: newFrequency.allowHolidays,
        isActive: newFrequency.isActive,
        createdAt: newFrequency.createdAt,
        updatedAt: newFrequency.updatedAt,
      },
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.FREQUENCY.FREQUENCY_CREATED,
      response
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0].message;
      return sendBadRequest(res, firstError);
    }

    console.error('Error creating frequency:', error);
    return sendInternalErrorResponse(res);
  }
};

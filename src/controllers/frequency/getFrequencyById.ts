import { Response } from 'express';
import { AuthRequest } from '../../interfaces/auth.interface';
import { ZodError } from 'zod';
import {
  sendBadRequest,
  sendInternalErrorResponse,
  sendSuccessResponse,
  sendNotFound,
} from '../../utils/commons/responseFunctions';
import { FrequencyModel } from '../../models';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';

import { IFrequency } from '../../interfaces/frequency.interface';
import { isValidUUID } from '../../utils/validators/schemas/uuidSchema';

export const getFrequencyById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      return sendBadRequest(res, ERROR_MESSAGES.FREQUENCY.ID_REQUIRED);
    }

    if (!isValidUUID(id)) {
      return sendBadRequest(res, ERROR_MESSAGES.FREQUENCY.INVALID_ID);
    }

    const frequency = (await FrequencyModel.findByPk(id, {
      attributes: { exclude: ['deletedAt'] },
    })) as IFrequency | null;

    if (!frequency) {
      return sendNotFound(res, ERROR_MESSAGES.FREQUENCY.NOT_FOUND);
    }

    const response = {
      frequency: {
        id: frequency.id,
        name: frequency.name,
        description: frequency.description,
        frequencyType: frequency.frequencyType,
        nextDateCalculationRule: frequency.nextDateCalculationRule,
        daysBetweenVisits: frequency.daysBetweenVisits,
        visitsPerMonth: frequency.visitsPerMonth,
        intervalValue: frequency.intervalValue,
        intervalUnit: frequency.intervalUnit,
        visitsPerDay: frequency.visitsPerDay,
        weeklyPattern: frequency.weeklyPattern,
        customSchedule: frequency.customSchedule,
        respectBusinessHours: frequency.respectBusinessHours,
        allowWeekends: frequency.allowWeekends,
        allowHolidays: frequency.allowHolidays,
        isActive: frequency.isActive,
        createdAt: frequency.createdAt,
        updatedAt: frequency.updatedAt,
      },
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.FREQUENCY.FREQUENCY_FOUND,
      response
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0].message;
      return sendBadRequest(res, firstError);
    }

    console.error('Error fetching frequency by ID:', error);
    return sendInternalErrorResponse(res);
  }
};

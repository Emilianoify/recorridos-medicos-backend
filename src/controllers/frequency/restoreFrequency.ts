import { Response } from 'express';
import { AuthRequest } from '../../interfaces/auth.interface';
import { ZodError } from 'zod';
import {
  sendBadRequest,
  sendInternalErrorResponse,
  sendSuccessResponse,
  sendNotFound,
  sendConflict,
} from '../../utils/commons/responseFunctions';
import { FrequencyModel } from '../../models';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { IFrequency } from '../../interfaces/frequency.interface';
import { isValidUUID } from '../../utils/validators/schemas/uuidSchema';

export const restoreFrequency = async (
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

    const frequencyInstance = await FrequencyModel.findByPk(id, {
      paranoid: false,
    });

    if (!frequencyInstance) {
      return sendNotFound(res, ERROR_MESSAGES.FREQUENCY.NOT_FOUND);
    }

    const frequency: IFrequency = frequencyInstance.toJSON() as IFrequency;

    if (!frequency.deletedAt) {
      return sendConflict(res, ERROR_MESSAGES.FREQUENCY.ALREADY_ACTIVE);
    }

    // Check if name is already in use by another active frequency
    const existingFrequency = await FrequencyModel.findOne({
      where: { name: frequency.name },
    });

    if (existingFrequency) {
      return sendConflict(res, ERROR_MESSAGES.FREQUENCY.NAME_IN_USE);
    }

    await FrequencyModel.restore({
      where: { id },
    });

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
      SUCCESS_MESSAGES.FREQUENCY.FREQUENCY_RESTORED,
      response
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0].message;
      return sendBadRequest(res, firstError);
    }

    console.error('Error restoring frequency:', error);
    return sendInternalErrorResponse(res);
  }
};

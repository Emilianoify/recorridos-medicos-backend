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
import { updateFrequencySchema } from '../../utils/validators/schemas/frequencySchemas';
import { Op } from 'sequelize';
import { IFrequency } from '../../interfaces/frequency.interface';
import { isValidUUID } from '../../utils/validators/schemas/uuidSchema';

export const updateFrequency = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const body = req.body;

    if (!id) {
      return sendBadRequest(res, ERROR_MESSAGES.FREQUENCY.ID_REQUIRED);
    }

    if (!isValidUUID(id)) {
      return sendBadRequest(res, ERROR_MESSAGES.FREQUENCY.INVALID_ID);
    }

    if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
      return sendBadRequest(res, ERROR_MESSAGES.SERVER.EMPTY_BODY);
    }

    const validatedData = updateFrequencySchema.parse(body);

    const frequency = (await FrequencyModel.findByPk(id)) as IFrequency | null;
    if (!frequency) {
      return sendNotFound(res, ERROR_MESSAGES.FREQUENCY.NOT_FOUND);
    }

    // Check if name is being updated and if it already exists
    if (validatedData.name && validatedData.name !== frequency.name) {
      const existingFrequency = await FrequencyModel.findOne({
        where: {
          name: validatedData.name,
          id: { [Op.ne]: id },
        },
        paranoid: false,
      });

      if (existingFrequency) {
        return sendConflict(res, ERROR_MESSAGES.FREQUENCY.NAME_IN_USE);
      }
    }

    await FrequencyModel.update(validatedData, {
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
        updatedAt: frequency.updatedAt,
      },
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.FREQUENCY.FREQUENCY_UPDATED,
      response
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0].message;
      return sendBadRequest(res, firstError);
    }

    console.error('Error updating frequency:', error);
    return sendInternalErrorResponse(res);
  }
};

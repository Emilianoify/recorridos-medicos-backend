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

    const frequencyInstance = await FrequencyModel.findByPk(id);
    if (!frequencyInstance) {
      return sendNotFound(res, ERROR_MESSAGES.FREQUENCY.NOT_FOUND);
    }

    const frequency: IFrequency = frequencyInstance.toJSON() as IFrequency;

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

    // Fetch updated frequency data
    const updatedFrequencyInstance = await FrequencyModel.findByPk(id, {
      attributes: { exclude: ['deletedAt'] },
    });

    if (!updatedFrequencyInstance) {
      return sendNotFound(res, ERROR_MESSAGES.FREQUENCY.NOT_FOUND);
    }

    const updatedFrequency: IFrequency = updatedFrequencyInstance.toJSON() as IFrequency;

    const response = {
      frequency: {
        id: updatedFrequency.id,
        name: updatedFrequency.name,
        description: updatedFrequency.description,
        frequencyType: updatedFrequency.frequencyType,
        nextDateCalculationRule: updatedFrequency.nextDateCalculationRule,
        daysBetweenVisits: updatedFrequency.daysBetweenVisits,
        visitsPerMonth: updatedFrequency.visitsPerMonth,
        intervalValue: updatedFrequency.intervalValue,
        intervalUnit: updatedFrequency.intervalUnit,
        visitsPerDay: updatedFrequency.visitsPerDay,
        weeklyPattern: updatedFrequency.weeklyPattern,
        customSchedule: updatedFrequency.customSchedule,
        respectBusinessHours: updatedFrequency.respectBusinessHours,
        allowWeekends: updatedFrequency.allowWeekends,
        allowHolidays: updatedFrequency.allowHolidays,
        isActive: updatedFrequency.isActive,
        createdAt: updatedFrequency.createdAt,
        updatedAt: updatedFrequency.updatedAt,
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

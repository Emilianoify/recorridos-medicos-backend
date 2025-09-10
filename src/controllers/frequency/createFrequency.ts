import { Request, Response } from 'express';
import { FrequencyModel } from '../../models';
import { createFrequencySchema } from '../../utils/validators/schemas/frequencySchemas';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import {
  sendBadRequest,
  sendInternalErrorResponse,
  sendSuccessResponse,
} from '../../utils/commons/responseFunctions';
import { ZodError } from 'zod';

export const createFrequency = async (
  req: Request,
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
      return sendBadRequest(res, ERROR_MESSAGES.FREQUENCY.INVALID_NAME);
    }

    const newFrequency = await FrequencyModel.create(validatedData);

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.FREQUENCY.FREQUENCY_CREATED,
      newFrequency
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0].message;
      return sendBadRequest(res, firstError);
    }

    console.error('Error deleting frequency:', error);
    return sendInternalErrorResponse(res);
  }
};

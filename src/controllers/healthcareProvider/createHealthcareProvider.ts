import { Response } from 'express';
import { AuthRequest } from '../../interfaces/auth.interface';
import { ZodError } from 'zod';
import {
  sendBadRequest,
  sendConflict,
  sendInternalErrorResponse,
  sendSuccessResponse,
} from '../../utils/commons/responseFunctions';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import {
  existingHealthcareProviderName,
  existingHealthcareProviderCode,
} from '../../utils/validators/dbValidators';
import { HealthcareProviderModel } from '../../models';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { createHealthcareProviderSchema } from '../../utils/validators/schemas/healthcareSchemas';
import { IHealthcareProvider } from '../../interfaces/healthcareProvider.interface';

export const createHealthcareProvider = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const body = req.body;

    if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
      return sendBadRequest(res, ERROR_MESSAGES.SERVER.EMPTY_BODY);
    }

    const validData = createHealthcareProviderSchema.parse(body);
    const { name, code, isActive } = validData;

    const nameExists = await existingHealthcareProviderName(name);
    if (nameExists) {
      return sendConflict(res, ERROR_MESSAGES.HEALTHCARE_PROVIDER.NAME_IN_USE);
    }

    if (code) {
      const codeExists = await existingHealthcareProviderCode(code);
      if (codeExists) {
        return sendConflict(
          res,
          ERROR_MESSAGES.HEALTHCARE_PROVIDER.CODE_IN_USE
        );
      }
    }

    const createdProvider = (await HealthcareProviderModel.create({
      name,
      code: code || null,
      isActive: isActive !== undefined ? isActive : true,
    })) as unknown as IHealthcareProvider;

    const response = {
      healthcareProvider: {
        id: createdProvider.id,
        name: createdProvider.name,
        code: createdProvider.code,
        isActive: createdProvider.isActive,
        createdAt: createdProvider.createdAt,
        updatedAt: createdProvider.updatedAt,
      },
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.HEALTHCARE_PROVIDER.HEALTHCARE_CREATED,
      response
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0].message;

      return sendBadRequest(res, firstError);
    }

    console.error('Error creating healthcare provider:', error);
    return sendInternalErrorResponse(res);
  }
};

import { ZodError } from 'zod';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { AuthRequest } from '../../interfaces/auth.interface';
import { HealthcareProviderModel } from '../../models';
import {
  sendBadRequest,
  sendNotFound,
  sendConflict,
  sendSuccessResponse,
  sendInternalErrorResponse,
} from '../../utils/commons/responseFunctions';
import {
  existingHealthcareProvider,
  existingHealthcareProviderName,
  existingHealthcareProviderCode,
} from '../../utils/validators/dbValidators';
import { updateHealthcareProviderSchema } from '../../utils/validators/schemas/healthCareSchemas';
import { Response } from 'express';
import { isValidUUID } from '../../utils/validators/schemas/uuidSchema';
import { IHealthcareProvider } from '../../interfaces/healthcareProvider.interface';

export const updateHealthcareProvider = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const body = req.body;

    if (!id) {
      return sendBadRequest(
        res,
        ERROR_MESSAGES.HEALTHCARE_PROVIDER.HEALTHCARE_ID_REQUIRED
      );
    }

    if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
      return sendBadRequest(res, ERROR_MESSAGES.SERVER.EMPTY_BODY);
    }

    if (!isValidUUID(id)) {
      return sendBadRequest(
        res,
        ERROR_MESSAGES.HEALTHCARE_PROVIDER.INVALID_HEALTHCARE_ID
      );
    }

    const validData = updateHealthcareProviderSchema.parse(body);

    let { name, code } = validData;

    const providerExists = await existingHealthcareProvider(id);
    if (!providerExists) {
      return sendNotFound(
        res,
        ERROR_MESSAGES.HEALTHCARE_PROVIDER.HEALTHCARE_NOT_FOUND
      );
    }

    if (name) {
      const nameExists = await existingHealthcareProviderName(name);
      if (nameExists) {
        return sendConflict(
          res,
          ERROR_MESSAGES.HEALTHCARE_PROVIDER.HEALTHCARE_NAME_IN_USE
        );
      }
    }

    if (code !== undefined) {
      if (code === '') {
        code = null;
      }

      if (code) {
        const codeExists = await existingHealthcareProviderCode(code);
        if (codeExists) {
          return sendConflict(
            res,
            ERROR_MESSAGES.HEALTHCARE_PROVIDER.HEALTHCARE_CODE_IN_USE
          );
        }
      }
    }

    const [affectedCount, updatedProviders] =
      await HealthcareProviderModel.update(validData, {
        where: { id },
        returning: true,
      });

    if (affectedCount === 0) {
      return sendNotFound(
        res,
        ERROR_MESSAGES.HEALTHCARE_PROVIDER.HEALTHCARE_NOT_FOUND
      );
    }

    const updatedProvider =
      updatedProviders[0] as unknown as IHealthcareProvider;

    const response = {
      healthcareProvider: {
        id: updatedProvider.id,
        name: updatedProvider.name,
        code: updatedProvider.code,
        isActive: updatedProvider.isActive,
        createdAt: updatedProvider.createdAt,
        updatedAt: updatedProvider.updatedAt,
      },
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.HEALTHCARE_PROVIDER.HEALTHCARE_UPDATED,
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

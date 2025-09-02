import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { AuthRequest } from '../../interfaces/auth.interface';
import { HealthcareProviderModel } from '../../models';
import {
  sendBadRequest,
  sendNotFound,
  sendSuccessResponse,
  sendInternalErrorResponse,
} from '../../utils/commons/responseFunctions';
import { Response } from 'express';
import { isValidUUID } from '../../utils/validators/schemas/uuidSchema';
import { IHealthcareProvider } from '../../interfaces/healthcareProvider.interface';

export const getHealthcareProviderById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      return sendBadRequest(
        res,
        ERROR_MESSAGES.HEALTHCARE_PROVIDER.ID_REQUIRED
      );
    }

    if (!isValidUUID(id)) {
      return sendBadRequest(res, ERROR_MESSAGES.HEALTHCARE_PROVIDER.INVALID_ID);
    }

    const provider = (await HealthcareProviderModel.findByPk(id, {
      attributes: { exclude: ['deletedAt'] },
    })) as IHealthcareProvider | null;

    if (!provider) {
      return sendNotFound(res, ERROR_MESSAGES.HEALTHCARE_PROVIDER.NOT_FOUND);
    }

    const response = {
      healthcareProvider: {
        id: provider.id,
        name: provider.name,
        code: provider.code,
        isActive: provider.isActive,
        createdAt: provider.createdAt,
        updatedAt: provider.updatedAt,
      },
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.HEALTHCARE_PROVIDER.HEALTHCARE_FOUND,
      response
    );
  } catch (error) {
    console.error('Error fetching healthcare provider by ID:', error);
    return sendInternalErrorResponse(res);
  }
};

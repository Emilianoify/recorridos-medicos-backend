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

export const restoreHealthcareProvider = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      return sendBadRequest(
        res,
        ERROR_MESSAGES.HEALTHCARE_PROVIDER.HEALTHCARE_ID_REQUIRED
      );
    }

    if (!isValidUUID(id)) {
      return sendBadRequest(
        res,
        ERROR_MESSAGES.HEALTHCARE_PROVIDER.INVALID_HEALTHCARE_ID
      );
    }

    const deletedProvider = (await HealthcareProviderModel.findOne({
      where: { id },
      paranoid: false,
    })) as IHealthcareProvider | null;

    if (!deletedProvider) {
      return sendNotFound(
        res,
        ERROR_MESSAGES.HEALTHCARE_PROVIDER.HEALTHCARE_NOT_FOUND
      );
    }

    if (deletedProvider.deletedAt === null) {
      return sendBadRequest(
        res,
        ERROR_MESSAGES.HEALTHCARE_PROVIDER.HEALTHCARE_ALREADY_ACTIVE
      );
    }

    await HealthcareProviderModel.restore({
      where: { id },
    });

    const restoredProvider = (await HealthcareProviderModel.findByPk(
      id
    )) as unknown as IHealthcareProvider;

    const response = {
      healthcareProvider: {
        id: restoredProvider!.id,
        name: restoredProvider!.name,
        code: restoredProvider!.code,
        isActive: restoredProvider!.isActive,
        createdAt: restoredProvider!.createdAt,
        updatedAt: restoredProvider!.updatedAt,
      },
    };

    sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.HEALTHCARE_PROVIDER.HEALTHCARE_RESTORES,
      response
    );
  } catch (error) {
    console.error('Error restoring healthcare provider:', error);
    return sendInternalErrorResponse(res);
  }
};

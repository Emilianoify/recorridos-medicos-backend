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
        ERROR_MESSAGES.HEALTHCARE_PROVIDER.ID_REQUIRED
      );
    }

    if (!isValidUUID(id)) {
      return sendBadRequest(res, ERROR_MESSAGES.HEALTHCARE_PROVIDER.INVALID_ID);
    }

    const deletedProvider = await HealthcareProviderModel.findOne({
      where: { id },
      paranoid: false,
    });

    if (!deletedProvider) {
      return sendNotFound(res, ERROR_MESSAGES.HEALTHCARE_PROVIDER.NOT_FOUND);
    }

    await HealthcareProviderModel.restore({
      where: { id },
    });

    await deletedProvider.reload();
    const restoredProvider: IHealthcareProvider =
      deletedProvider.toJSON() as IHealthcareProvider;

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

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.HEALTHCARE_PROVIDER.HEALTHCARE_RESTORES,
      response
    );
  } catch (error) {
    console.error('Error restoring healthcare provider:', error);
    return sendInternalErrorResponse(res);
  }
};

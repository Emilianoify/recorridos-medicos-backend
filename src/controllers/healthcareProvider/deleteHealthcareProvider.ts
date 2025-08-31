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
import { existingHealthcareProvider } from '../../utils/validators/dbValidators';
import { isValidUUID } from '../../utils/validators/schemas/uuidSchema';
import { Response } from 'express';

export const deleteHealthcareProvider = async (
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

    const providerExists = await existingHealthcareProvider(id);
    if (!providerExists) {
      return sendNotFound(
        res,
        ERROR_MESSAGES.HEALTHCARE_PROVIDER.HEALTHCARE_NOT_FOUND
      );
    }

    const deletedCount = await HealthcareProviderModel.destroy({
      where: { id },
    });

    if (deletedCount === 0) {
      return sendNotFound(
        res,
        ERROR_MESSAGES.HEALTHCARE_PROVIDER.HEALTHCARE_NOT_FOUND
      );
    }

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.HEALTHCARE_PROVIDER.HEALTHCARE_DELETED
    );
  } catch (error) {
    console.error('Error deleting healthcare provider:', error);
    return sendInternalErrorResponse(res);
  }
};

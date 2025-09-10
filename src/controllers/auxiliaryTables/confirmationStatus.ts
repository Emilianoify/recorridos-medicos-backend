import { Response } from 'express';
import { AuthRequest } from '../../interfaces/auth.interface';
import {
  sendSuccessResponse,
  sendInternalErrorResponse,
} from '../../utils/commons/responseFunctions';
import { ConfirmationStatusModel } from '../../models';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { IConfirmationStatus } from '../../interfaces/auxiliaryTables.interface';

export const getConfirmationStatuses = async (
  _req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const confirmationStatuses = await ConfirmationStatusModel.findAll({
      where: { isActive: true },
      order: [['name', 'ASC']],
      attributes: ['id', 'name', 'description', 'isActive'],
    });

    const response = {
      confirmationStatuses: confirmationStatuses.map((statusInstance) => {
        const status: IConfirmationStatus = statusInstance.toJSON() as IConfirmationStatus;
        return {
          id: status.id,
          name: status.name,
          description: status.description,
          isActive: status.isActive,
        };
      }),
      total: confirmationStatuses.length,
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.AUXILIARY.CONFIRMATION_STATUSES_FETCHED,
      response
    );
  } catch (error) {
    console.error('Error fetching confirmation statuses:', error);
    return sendInternalErrorResponse(res);
  }
};

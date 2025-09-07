import { Response } from 'express';
import { AuthRequest } from '../../interfaces/auth.interface';
import {
  sendSuccessResponse,
  sendInternalErrorResponse,
} from '../../utils/commons/responseFunctions';
import { RejectionReasonModel } from '../../models';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';

export const getRejectionReasons = async (
  _req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const rejectionReasons = await RejectionReasonModel.findAll({
      where: { isActive: true },
      order: [
        ['category', 'ASC'],
        ['name', 'ASC'],
      ],
      attributes: ['id', 'name', 'description', 'category', 'isActive'],
    });

    const response = {
      rejectionReasons: rejectionReasons.map((reason: any) => ({
        id: reason.id,
        name: reason.name,
        description: reason.description,
        category: reason.category,
        isActive: reason.isActive,
      })),
      total: rejectionReasons.length,
      categories: [...new Set(rejectionReasons.map((r: any) => r.category))],
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.AUXILIARY.REJECTION_REASONS_FETCHED,
      response
    );
  } catch (error) {
    console.error('Error fetching rejection reasons:', error);
    return sendInternalErrorResponse(res);
  }
};

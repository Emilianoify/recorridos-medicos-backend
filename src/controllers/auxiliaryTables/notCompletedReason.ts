import { Response } from 'express';
import { AuthRequest } from '../../interfaces/auth.interface';
import {
  sendSuccessResponse,
  sendInternalErrorResponse,
} from '../../utils/commons/responseFunctions';
import { NotCompletedReasonModel } from '../../models';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';

export const getNotCompletedReasons = async (
  _req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const notCompletedReasons = await NotCompletedReasonModel.findAll({
      where: { isActive: true },
      order: [
        ['category', 'ASC'],
        ['name', 'ASC'],
      ],
      attributes: [
        'id',
        'name',
        'description',
        'category',
        'suggestedAction',
        'isActive',
      ],
    });

    const response = {
      notCompletedReasons: notCompletedReasons.map((reason: any) => ({
        id: reason.id,
        name: reason.name,
        description: reason.description,
        category: reason.category,
        suggestedAction: reason.suggestedAction,
        isActive: reason.isActive,
      })),
      total: notCompletedReasons.length,
      categories: [...new Set(notCompletedReasons.map((r: any) => r.category))],
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.AUXILIARY.NOT_COMPLETED_REASONS_FETCHED,
      response
    );
  } catch (error) {
    console.error('Error fetching not completed reasons:', error);
    return sendInternalErrorResponse(res);
  }
};

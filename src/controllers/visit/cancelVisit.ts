import { Response } from 'express';
import { AuthRequest } from '../../interfaces/auth.interface';
import { ZodError } from 'zod';
import {
  sendBadRequest,
  sendInternalErrorResponse,
  sendSuccessResponse,
  sendNotFound,
} from '../../utils/commons/responseFunctions';
import {
  VisitModel,
  VisitChangeAuditModel,
} from '../../models';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { IVisit } from '../../interfaces/visit.interface';
import { VisitStatus } from '../../enums/Visits';
import { isValidUUID } from '../../utils/validators/schemas/uuidSchema';
import { z } from 'zod';

const cancelVisitSchema = z.object({
  rejectionReasonId: z
    .string()
    .uuid(ERROR_MESSAGES.VISIT.INVALID_REJECTION_REASON_ID)
    .optional(),
  coordinatorNotes: z
    .string()
    .max(1000, ERROR_MESSAGES.VISIT.INVALID_COORDINATOR_NOTES)
    .optional(),
});

export const cancelVisit = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const body = req.body;

    if (!id || !isValidUUID(id)) {
      return sendBadRequest(res, ERROR_MESSAGES.VISIT.INVALID_VISIT_ID);
    }

    const validatedData = cancelVisitSchema.parse(body || {});

    // Find the existing visit
    const existingVisit = await VisitModel.findOne({
      where: { id, isActive: true },
    });

    if (!existingVisit) {
      return sendNotFound(res, ERROR_MESSAGES.VISIT.NOT_FOUND);
    }

    const existingVisitJson = existingVisit.toJSON() as IVisit;

    // Validate visit can be cancelled
    if (existingVisitJson.status === VisitStatus.COMPLETED) {
      return sendBadRequest(res, ERROR_MESSAGES.VISIT.CANNOT_CANCEL_COMPLETED);
    }

    if (existingVisitJson.status === VisitStatus.CANCELLED) {
      return sendBadRequest(res, ERROR_MESSAGES.VISIT.ALREADY_CANCELLED);
    }

    const cancellationData = {
      status: VisitStatus.CANCELLED,
      cancelledByUserId: req.user?.id,
      cancelledDateTime: new Date(),
      rejectionReasonId: validatedData.rejectionReasonId,
      coordinatorNotes: validatedData.coordinatorNotes,
    };

    // Update the visit
    await VisitModel.update(cancellationData, {
      where: { id },
    });

    // Create audit trail
    await VisitChangeAuditModel.create({
      visitId: id,
      field: 'status',
      oldValue: existingVisitJson.status,
      newValue: VisitStatus.CANCELLED,
      userId: req.user?.id,
      changeDateTime: new Date(),
      reason: `Visit cancelled by ${req.user?.username || 'system'}${validatedData.rejectionReasonId ? ` with reason ${validatedData.rejectionReasonId}` : ''}`,
    });

    // Get the updated visit
    const updatedVisit = await VisitModel.findOne({
      where: { id, isActive: true },
    });

    const updatedVisitJson = updatedVisit!.toJSON() as IVisit;

    const response = {
      visit: {
        id: updatedVisitJson.id,
        patientId: updatedVisitJson.patientId,
        journeyId: updatedVisitJson.journeyId,
        status: updatedVisitJson.status,
        cancelledByUserId: updatedVisitJson.cancelledByUserId,
        cancelledDateTime: updatedVisitJson.cancelledDateTime,
        rejectionReasonId: updatedVisitJson.rejectionReasonId,
        coordinatorNotes: updatedVisitJson.coordinatorNotes,
        updatedAt: updatedVisitJson.updatedAt,
      },
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.VISIT.VISIT_CANCELLED,
      response
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0].message;
      return sendBadRequest(res, firstError);
    }

    console.error('Error cancelling visit:', error);
    return sendInternalErrorResponse(res);
  }
};
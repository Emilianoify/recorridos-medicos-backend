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
  ConfirmationStatusModel,
  RejectionReasonModel,
  VisitChangeAuditModel,
} from '../../models';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { confirmVisitSchema } from '../../utils/validators/schemas/visitSchemas';
import { IVisit } from '../../interfaces/visit.interface';
import { VisitStatus } from '../../enums/Visits';
import { isValidUUID } from '../../utils/validators/schemas/uuidSchema';

export const confirmVisit = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const body = req.body;

    if (!id) {
      return sendBadRequest(res, ERROR_MESSAGES.VISIT.INVALID_VISIT_ID);
    }

    if (!isValidUUID(id)) {
      return sendBadRequest(res, ERROR_MESSAGES.VISIT.INVALID_VISIT_ID);
    }

    if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
      return sendBadRequest(res, ERROR_MESSAGES.SERVER.EMPTY_BODY);
    }

    const validatedData = confirmVisitSchema.parse(body);

    // Find the existing visit
    const existingVisit = await VisitModel.findOne({
      where: { id, isActive: true },
    });

    if (!existingVisit) {
      return sendNotFound(res, ERROR_MESSAGES.VISIT.NOT_FOUND);
    }

    const existingVisitJson = existingVisit.toJSON() as IVisit;

    // Validate visit can be confirmed
    if (existingVisitJson.status === VisitStatus.COMPLETED) {
      return sendBadRequest(res, ERROR_MESSAGES.VISIT.CANNOT_CONFIRM_COMPLETED);
    }

    if (existingVisitJson.status === VisitStatus.CANCELLED) {
      return sendBadRequest(res, ERROR_MESSAGES.VISIT.CANNOT_CONFIRM_CANCELLED);
    }

    // Verify confirmation status exists
    const confirmationStatus = await ConfirmationStatusModel.findOne({
      where: { id: validatedData.confirmationStatusId },
    });

    if (!confirmationStatus) {
      return sendBadRequest(res, ERROR_MESSAGES.VISIT.INVALID_CONFIRMATION_STATUS_ID);
    }

    // Verify rejection reason if provided
    if (validatedData.rejectionReasonId) {
      const rejectionReason = await RejectionReasonModel.findOne({
        where: { id: validatedData.rejectionReasonId },
      });

      if (!rejectionReason) {
        return sendBadRequest(res, ERROR_MESSAGES.VISIT.INVALID_REJECTION_REASON_ID);
      }
    }

    // Determine new status based on confirmation
    const confirmationStatusData = confirmationStatus.toJSON() as { name: string };
    let newStatus = VisitStatus.SCHEDULED; // Default status
    
    if (confirmationStatusData.name?.toLowerCase().includes('rechaza') || 
        confirmationStatusData.name?.toLowerCase().includes('reject')) {
      newStatus = VisitStatus.CANCELLED;
    }

    const confirmationData = {
      status: newStatus,
      confirmationStatusId: validatedData.confirmationStatusId,
      confirmationDateTime: new Date(),
      confirmationMethod: validatedData.confirmationMethod,
      confirmedByUserId: req.user?.id,
      rejectionReasonId: validatedData.rejectionReasonId,
    };

    // Update the visit
    await VisitModel.update(confirmationData, {
      where: { id },
    });

    // Create audit trail
    await VisitChangeAuditModel.create({
      visitId: id,
      field: 'status',
      oldValue: existingVisitJson.status,
      newValue: newStatus,
      userId: req.user?.id,
      changeDateTime: new Date(),
      reason: `Visit ${newStatus.toLowerCase()} by ${req.user?.username || 'system'} via ${validatedData.confirmationMethod}`,
    });

    // Get the updated visit
    const updatedVisit = await VisitModel.findOne({
      where: { id, isActive: true },
      include: [
        {
          model: ConfirmationStatusModel,
          as: 'confirmationStatus',
          attributes: ['id', 'name', 'description'],
        },
        {
          model: RejectionReasonModel,
          as: 'rejectionReason',
          attributes: ['id', 'reason'],
          required: false,
        },
      ],
    });

    if (!updatedVisit) {
      return sendInternalErrorResponse(res);
    }

    const updatedVisitJson = updatedVisit.toJSON() as IVisit;

    const response = {
      visit: {
        id: updatedVisitJson.id,
        patientId: updatedVisitJson.patientId,
        journeyId: updatedVisitJson.journeyId,
        status: updatedVisitJson.status,
        confirmationStatusId: updatedVisitJson.confirmationStatusId,
        confirmationDateTime: updatedVisitJson.confirmationDateTime,
        confirmationMethod: updatedVisitJson.confirmationMethod,
        confirmedByUserId: updatedVisitJson.confirmedByUserId,
        rejectionReasonId: updatedVisitJson.rejectionReasonId,
        updatedAt: updatedVisitJson.updatedAt,
        confirmationStatus: updatedVisitJson.confirmationStatus,
        rejectionReason: updatedVisitJson.rejectionReason,
      },
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.VISIT.VISIT_CONFIRMED,
      response
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0].message;
      return sendBadRequest(res, firstError);
    }

    console.error('Error confirming visit:', error);
    return sendInternalErrorResponse(res);
  }
};
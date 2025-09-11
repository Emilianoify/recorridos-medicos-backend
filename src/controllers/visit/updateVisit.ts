import { Response } from 'express';
import { AuthRequest } from '../../interfaces/auth.interface';
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
import { isValidUUID } from '../../utils/validators/schemas/uuidSchema';

export const updateVisit = async (
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

    // Manual validation for update fields - following project pattern
    const allowedFields = ['scheduledDateTime', 'orderInJourney', 'professionalNotes', 'coordinatorNotes'];
    const updateData: Record<string, string | number> = {};
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return sendBadRequest(res, ERROR_MESSAGES.VISIT.NO_CHANGES_DETECTED);
    }

    // Find the existing visit
    const existingVisit = await VisitModel.findOne({
      where: { id, isActive: true },
    });

    if (!existingVisit) {
      return sendNotFound(res, ERROR_MESSAGES.VISIT.NOT_FOUND);
    }

    const existingVisitJson = existingVisit.toJSON() as IVisit;

    // Create audit trail for changes
    const changes: Record<string, unknown> = {};
    const auditChanges: Array<{
      visitId: string;
      field: string;
      oldValue: string | null;
      newValue: string | null;
      userId: string | undefined;
      changeDateTime: Date;
      reason: string;
    }> = [];

    // Compare and track changes
    Object.keys(updateData).forEach(key => {
      const newValue = (updateData as Record<string, unknown>)[key];
      const oldValue = (existingVisitJson as unknown as Record<string, unknown>)[key];
      
      if (newValue !== undefined && newValue !== oldValue) {
        changes[key] = newValue;
        
        // Record audit trail
        auditChanges.push({
          visitId: id,
          field: key,
          oldValue: oldValue ? JSON.stringify(oldValue) : null,
          newValue: newValue ? JSON.stringify(newValue) : null,
          userId: req.user?.id,
          changeDateTime: new Date(),
          reason: `Updated via API by ${req.user?.username || 'system'}`,
        });
      }
    });

    if (Object.keys(changes).length === 0) {
      return sendBadRequest(res, ERROR_MESSAGES.VISIT.NO_CHANGES_DETECTED);
    }

    // Update the visit
    await VisitModel.update(updateData, {
      where: { id },
    });

    // Create audit trail entries
    if (auditChanges.length > 0) {
      await VisitChangeAuditModel.bulkCreate(auditChanges);
    }

    // Get the updated visit
    const updatedVisit = await VisitModel.findOne({
      where: { id, isActive: true },
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
        scheduledDateTime: updatedVisitJson.scheduledDateTime,
        orderInJourney: updatedVisitJson.orderInJourney,
        confirmationStatusId: updatedVisitJson.confirmationStatusId,
        confirmationDateTime: updatedVisitJson.confirmationDateTime,
        confirmationMethod: updatedVisitJson.confirmationMethod,
        confirmedByUserId: updatedVisitJson.confirmedByUserId,
        completedDateTime: updatedVisitJson.completedDateTime,
        durationMinutes: updatedVisitJson.durationMinutes,
        rejectionReasonId: updatedVisitJson.rejectionReasonId,
        notCompletedReasonId: updatedVisitJson.notCompletedReasonId,
        rescheduledFromVisitId: updatedVisitJson.rescheduledFromVisitId,
        rescheduledToVisitId: updatedVisitJson.rescheduledToVisitId,
        checkInLocation: updatedVisitJson.checkInLocation,
        checkOutLocation: updatedVisitJson.checkOutLocation,
        professionalNotes: updatedVisitJson.professionalNotes,
        coordinatorNotes: updatedVisitJson.coordinatorNotes,
        cancelledByUserId: updatedVisitJson.cancelledByUserId,
        cancelledDateTime: updatedVisitJson.cancelledDateTime,
        isActive: updatedVisitJson.isActive,
        createdAt: updatedVisitJson.createdAt,
        updatedAt: updatedVisitJson.updatedAt,
      },
      changesApplied: Object.keys(changes),
      auditTrailEntries: auditChanges.length,
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.VISIT.VISIT_UPDATED,
      response
    );
  } catch (error) {
    console.error('Error updating visit:', error);
    return sendInternalErrorResponse(res);
  }
};
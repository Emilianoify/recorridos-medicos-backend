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
  NotCompletedReasonModel,
  VisitChangeAuditModel,
} from '../../models';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { markNotPresentSchema } from '../../utils/validators/schemas/visitSchemas';
import { IVisit } from '../../interfaces/visit.interface';
import { VisitStatus } from '../../enums/Visits';
import { isValidUUID } from '../../utils/validators/schemas/uuidSchema';

export const markNotPresent = async (
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

    const validatedData = markNotPresentSchema.parse(body);

    // Find the existing visit
    const existingVisit = await VisitModel.findOne({
      where: { id, isActive: true },
    });

    if (!existingVisit) {
      return sendNotFound(res, ERROR_MESSAGES.VISIT.NOT_FOUND);
    }

    const existingVisitJson = existingVisit.toJSON() as IVisit;

    // Validate visit can be marked as not present
    if (existingVisitJson.status === VisitStatus.COMPLETED) {
      return sendBadRequest(res, ERROR_MESSAGES.VISIT.CANNOT_MARK_NOT_PRESENT_COMPLETED);
    }

    if (existingVisitJson.status === VisitStatus.CANCELLED) {
      return sendBadRequest(res, ERROR_MESSAGES.VISIT.CANNOT_MARK_NOT_PRESENT_CANCELLED);
    }

    if (existingVisitJson.status === VisitStatus.NOT_PRESENT) {
      return sendBadRequest(res, ERROR_MESSAGES.VISIT.ALREADY_MARKED_NOT_PRESENT);
    }

    // Verify not completed reason if provided
    if (validatedData.notCompletedReasonId) {
      const notCompletedReason = await NotCompletedReasonModel.findOne({
        where: { id: validatedData.notCompletedReasonId },
      });

      if (!notCompletedReason) {
        return sendBadRequest(res, ERROR_MESSAGES.VISIT.INVALID_NOT_COMPLETED_REASON_ID);
      }
    }

    const notPresentData = {
      status: VisitStatus.NOT_PRESENT,
      completedDateTime: new Date(),
      durationMinutes: 0, // No time spent if not present
      notCompletedReasonId: validatedData.notCompletedReasonId,
      professionalNotes: validatedData.professionalNotes || 'Paciente no presente en el domicilio',
      checkInLocation: validatedData.checkInLocation,
      checkOutLocation: validatedData.checkOutLocation,
    };

    // Update the visit
    await VisitModel.update(notPresentData, {
      where: { id },
    });

    // Create audit trail
    await VisitChangeAuditModel.create({
      visitId: id,
      field: 'status',
      oldValue: existingVisitJson.status,
      newValue: VisitStatus.NOT_PRESENT,
      userId: req.user?.id,
      changeDateTime: new Date(),
      reason: `Visit marked as not present by ${req.user?.username || 'system'}. Reason: ${validatedData.notCompletedReasonId ? 'See notCompletedReasonId' : 'No specific reason provided'}`,
    });

    // Get the updated visit
    const updatedVisit = await VisitModel.findOne({
      where: { id, isActive: true },
      include: [
        {
          model: NotCompletedReasonModel,
          as: 'notCompletedReason',
          attributes: ['id', 'reason', 'category', 'suggestedAction'],
          required: false,
        },
      ],
    });

    const updatedVisitJson = updatedVisit!.toJSON() as IVisit;

    const response = {
      visit: {
        id: updatedVisitJson.id,
        patientId: updatedVisitJson.patientId,
        journeyId: updatedVisitJson.journeyId,
        status: updatedVisitJson.status,
        completedDateTime: updatedVisitJson.completedDateTime,
        durationMinutes: updatedVisitJson.durationMinutes,
        notCompletedReasonId: updatedVisitJson.notCompletedReasonId,
        professionalNotes: updatedVisitJson.professionalNotes,
        checkInLocation: updatedVisitJson.checkInLocation,
        checkOutLocation: updatedVisitJson.checkOutLocation,
        updatedAt: updatedVisitJson.updatedAt,
        notCompletedReason: updatedVisitJson.notCompletedReason,
      },
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.VISIT.PATIENT_MARKED_NOT_PRESENT,
      response
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0].message;
      return sendBadRequest(res, firstError);
    }

    console.error('Error marking visit as not present:', error);
    return sendInternalErrorResponse(res);
  }
};
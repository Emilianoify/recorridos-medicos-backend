import { Response } from 'express';
import { AuthRequest } from '../../interfaces/auth.interface';
import { ZodError } from 'zod';
import {
  sendBadRequest,
  sendInternalErrorResponse,
  sendSuccessResponse,
  sendNotFound,
  sendConflict,
} from '../../utils/commons/responseFunctions';
import {
  VisitModel,
  PatientModel,
  JourneyModel,
  VisitChangeAuditModel,
} from '../../models';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { rescheduleVisitSchema } from '../../utils/validators/schemas/visitSchemas';
import { IVisit } from '../../interfaces/visit.interface';
import { IPatient } from '../../interfaces/patient.interface';
import { VisitStatus } from '../../enums/Visits';
import { isValidUUID } from '../../utils/validators/schemas/uuidSchema';

export const rescheduleVisit = async (
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

    const validatedData = rescheduleVisitSchema.parse(body);

    // Find the existing visit
    const existingVisit = await VisitModel.findOne({
      where: { id, isActive: true },
    });

    if (!existingVisit) {
      return sendNotFound(res, ERROR_MESSAGES.VISIT.NOT_FOUND);
    }

    const existingVisitJson = existingVisit.toJSON() as IVisit;

    // Validate visit can be rescheduled
    if (existingVisitJson.status === VisitStatus.COMPLETED) {
      return sendBadRequest(res, ERROR_MESSAGES.VISIT.CANNOT_RESCHEDULE_COMPLETED);
    }

    if (existingVisitJson.status === VisitStatus.CANCELLED) {
      return sendBadRequest(res, ERROR_MESSAGES.VISIT.CANNOT_RESCHEDULE_CANCELLED);
    }

    // Verify new journey exists if provided
    if (validatedData.newJourneyId) {
      const newJourney = await JourneyModel.findOne({
        where: { id: validatedData.newJourneyId, isActive: true },
      });

      if (!newJourney) {
        return sendBadRequest(res, ERROR_MESSAGES.VISIT.INVALID_JOURNEY_ID);
      }
    }

    // Check for conflicts in the new time slot
    const newDateTime = new Date(validatedData.newScheduledDateTime);
    const conflictingVisit = await VisitModel.findOne({
      where: {
        patientId: existingVisitJson.patientId,
        scheduledDateTime: newDateTime,
        status: VisitStatus.SCHEDULED,
        isActive: true,
        id: { [require('sequelize').Op.ne]: id }, // Exclude current visit
      },
    });

    if (conflictingVisit) {
      return sendConflict(res, ERROR_MESSAGES.VISIT.RESCHEDULE_CONFLICT);
    }

    // Check for journey order conflicts if new journey provided
    if (validatedData.newJourneyId && validatedData.newOrderInJourney) {
      const orderConflict = await VisitModel.findOne({
        where: {
          journeyId: validatedData.newJourneyId,
          orderInJourney: validatedData.newOrderInJourney,
          isActive: true,
          id: { [require('sequelize').Op.ne]: id }, // Exclude current visit
        },
      });

      if (orderConflict) {
        return sendConflict(res, ERROR_MESSAGES.VISIT.ORDER_CONFLICT);
      }
    }

    // Create the new rescheduled visit
    const newVisitData = {
      patientId: existingVisitJson.patientId,
      journeyId: validatedData.newJourneyId || existingVisitJson.journeyId,
      scheduledDateTime: newDateTime,
      orderInJourney: validatedData.newOrderInJourney || existingVisitJson.orderInJourney,
      status: VisitStatus.SCHEDULED,
      rescheduledFromVisitId: id,
      isActive: true,
    };

    const newVisitInstance = await VisitModel.create(newVisitData);
    const newVisit = newVisitInstance.toJSON() as IVisit;

    // Update the original visit
    await VisitModel.update(
      {
        status: VisitStatus.RESCHEDULED,
        rescheduledToVisitId: newVisit.id,
        cancelledByUserId: req.user?.id,
        cancelledDateTime: new Date(),
      },
      { where: { id } }
    );

    // Create audit trail for original visit
    await VisitChangeAuditModel.create({
      visitId: id,
      field: 'status',
      oldValue: existingVisitJson.status,
      newValue: VisitStatus.RESCHEDULED,
      userId: req.user?.id,
      changeDateTime: new Date(),
      reason: `Visit rescheduled by ${req.user?.username || 'system'}. New visit ID: ${newVisit.id}`,
    });

    // Create audit trail for new visit
    await VisitChangeAuditModel.create({
      visitId: newVisit.id,
      field: 'creation',
      oldValue: null,
      newValue: 'created_from_reschedule',
      userId: req.user?.id,
      changeDateTime: new Date(),
      reason: `Visit created from rescheduling visit ID: ${id} by ${req.user?.username || 'system'}`,
    });

    // Update patient's next scheduled visit if necessary
    const patientScheduledDateTime = newDateTime;
    const patient = await PatientModel.findByPk(existingVisitJson.patientId);
    
    if (patient) {
      const patientData: IPatient = patient.toJSON() as IPatient;
      const currentNextVisitDate = patientData.nextScheduledVisitDate ? new Date(patientData.nextScheduledVisitDate) : null;
      
      if (!currentNextVisitDate || patientScheduledDateTime < currentNextVisitDate) {
        await PatientModel.update(
          { nextScheduledVisitDate: patientScheduledDateTime },
          { where: { id: existingVisitJson.patientId } }
        );
      }
    }

    const response = {
      originalVisit: {
        id: existingVisitJson.id,
        status: VisitStatus.RESCHEDULED,
        rescheduledToVisitId: newVisit.id,
        cancelledDateTime: new Date(),
        cancelledByUserId: req.user?.id,
      },
      newVisit: {
        id: newVisit.id,
        patientId: newVisit.patientId,
        journeyId: newVisit.journeyId,
        status: newVisit.status,
        scheduledDateTime: newVisit.scheduledDateTime,
        orderInJourney: newVisit.orderInJourney,
        rescheduledFromVisitId: newVisit.rescheduledFromVisitId,
        isActive: newVisit.isActive,
        createdAt: newVisit.createdAt,
      },
      rescheduleReason: validatedData.reason,
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.VISIT.VISIT_RESCHEDULED,
      response
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0].message;
      return sendBadRequest(res, firstError);
    }

    console.error('Error rescheduling visit:', error);
    return sendInternalErrorResponse(res);
  }
};
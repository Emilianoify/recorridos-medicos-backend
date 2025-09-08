import { Response } from 'express';
import { AuthRequest } from '../../interfaces/auth.interface';
import {
  sendBadRequest,
  sendInternalErrorResponse,
  sendSuccessResponse,
} from '../../utils/commons/responseFunctions';
import {
  VisitModel,
  PatientModel,
  ConfirmationStatusModel,
  RejectionReasonModel,
  NotCompletedReasonModel,
} from '../../models';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { IVisit } from '../../interfaces/visit.interface';
import { isValidUUID } from '../../utils/validators/schemas/uuidSchema';
import { VisitStatus } from '../../enums/Visits';

export const getVisitsByJourney = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { journeyId } = req.params;

    if (!journeyId) {
      return sendBadRequest(res, ERROR_MESSAGES.VISIT.INVALID_JOURNEY_ID);
    }

    if (!isValidUUID(journeyId)) {
      return sendBadRequest(res, ERROR_MESSAGES.VISIT.INVALID_JOURNEY_ID);
    }

    // Parse query parameters
    const includeInactive = req.query.includeInactive === 'true';
    const status = req.query.status as string;

    // Build filters
    const filters: Record<string, string | boolean> = {
      journeyId,
    };

    if (!includeInactive) {
      filters.isActive = true;
    }

    if (status) {
      filters.status = status;
    }

    const visits = await VisitModel.findAll({
      where: filters,
      include: [
        {
          model: PatientModel,
          as: 'patient',
          attributes: [
            'id',
            'fullName',
            'healthcareId',
            'address',
            'locality',
            'phone',
            'emergencyPhone',
            'requiresConfirmation',
            'diagnosis',
            'medicalObservations',
          ],
        },
        {
          model: ConfirmationStatusModel,
          as: 'confirmationStatus',
          attributes: ['id', 'name', 'description'],
          required: false,
        },
        {
          model: RejectionReasonModel,
          as: 'rejectionReason',
          attributes: ['id', 'reason'],
          required: false,
        },
        {
          model: NotCompletedReasonModel,
          as: 'notCompletedReason',
          attributes: ['id', 'reason'],
          required: false,
        },
      ],
      order: [
        ['orderInJourney', 'ASC'], // Primary sort by order in journey
        ['scheduledDateTime', 'ASC'], // Secondary sort by scheduled time
      ],
    });

    // Calculate journey statistics
    const totalVisits = visits.length;
    const completedVisits = visits.filter(v => (v.toJSON() as IVisit).status === VisitStatus.COMPLETED).length;
    const scheduledVisits = visits.filter(v => (v.toJSON() as IVisit).status === VisitStatus.SCHEDULED).length;
    const cancelledVisits = visits.filter(v => (v.toJSON() as IVisit).status === VisitStatus.CANCELLED).length;
    const notPresentVisits = visits.filter(v => (v.toJSON() as IVisit).status === VisitStatus.NOT_PRESENT).length;

    const response = {
      journeyId,
      totalVisits,
      statistics: {
        scheduled: scheduledVisits,
        completed: completedVisits,
        cancelled: cancelledVisits,
        notPresent: notPresentVisits,
        completionRate: totalVisits > 0 ? Math.round((completedVisits / totalVisits) * 100) : 0,
      },
      visits: visits.map((visit) => {
        const visitJson = visit.toJSON() as IVisit;
        return {
          id: visitJson.id,
          patientId: visitJson.patientId,
          status: visitJson.status,
          scheduledDateTime: visitJson.scheduledDateTime,
          orderInJourney: visitJson.orderInJourney,
          confirmationStatusId: visitJson.confirmationStatusId,
          confirmationDateTime: visitJson.confirmationDateTime,
          confirmationMethod: visitJson.confirmationMethod,
          completedDateTime: visitJson.completedDateTime,
          durationMinutes: visitJson.durationMinutes,
          rejectionReasonId: visitJson.rejectionReasonId,
          notCompletedReasonId: visitJson.notCompletedReasonId,
          professionalNotes: visitJson.professionalNotes,
          coordinatorNotes: visitJson.coordinatorNotes,
          checkInLocation: visitJson.checkInLocation,
          checkOutLocation: visitJson.checkOutLocation,
          isActive: visitJson.isActive,
          createdAt: visitJson.createdAt,
          updatedAt: visitJson.updatedAt,
          // Relations
          patient: visitJson.patient,
          confirmationStatus: visitJson.confirmationStatus,
          rejectionReason: visitJson.rejectionReason,
          notCompletedReason: visitJson.notCompletedReason,
        };
      }),
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.VISIT.VISITS_BY_JOURNEY_FETCHED,
      response
    );
  } catch (error) {
    console.error('Error fetching visits by journey:', error);
    return sendInternalErrorResponse(res);
  }
};
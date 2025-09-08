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
  PatientModel,
  JourneyModel,
  ProfessionalModel,
  ZoneModel,
  ConfirmationStatusModel,
  RejectionReasonModel,
  NotCompletedReasonModel,
  UserModel,
} from '../../models';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { IVisit } from '../../interfaces/visit.interface';
import { isValidUUID } from '../../utils/validators/schemas/uuidSchema';

export const getVisitById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id || !isValidUUID(id)) {
      return sendBadRequest(res, ERROR_MESSAGES.VISIT.INVALID_VISIT_ID);
    }

    const visit = await VisitModel.findOne({
      where: { id, isActive: true },
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
            'zoneId',
            'requiresConfirmation',
            'diagnosis',
            'medicalObservations',
          ],
        },
        {
          model: JourneyModel,
          as: 'journey',
          attributes: [
            'id',
            'date',
            'status',
            'startTime',
            'endTime',
            'professionalId',
            'zoneId',
          ],
          include: [
            {
              model: ProfessionalModel,
              as: 'professional',
              attributes: ['id', 'fullName', 'specialtyId', 'phone'],
            },
            {
              model: ZoneModel,
              as: 'zone',
              attributes: ['id', 'name', 'description'],
            },
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
        {
          model: UserModel,
          as: 'confirmedByUser',
          attributes: ['id', 'username', 'firstName', 'lastName'],
          required: false,
        },
        {
          model: UserModel,
          as: 'cancelledByUser',
          attributes: ['id', 'username', 'firstName', 'lastName'],
          required: false,
        },
        {
          model: VisitModel,
          as: 'rescheduledFromVisit',
          attributes: [
            'id',
            'scheduledDateTime',
            'status',
            'cancelledDateTime',
          ],
          required: false,
        },
        {
          model: VisitModel,
          as: 'rescheduledToVisit',
          attributes: [
            'id',
            'scheduledDateTime',
            'status',
          ],
          required: false,
        },
      ],
    });

    if (!visit) {
      return sendNotFound(res, ERROR_MESSAGES.VISIT.NOT_FOUND);
    }

    const visitJson = visit.toJSON() as IVisit;

    const response = {
      visit: {
        id: visitJson.id,
        patientId: visitJson.patientId,
        journeyId: visitJson.journeyId,
        status: visitJson.status,
        scheduledDateTime: visitJson.scheduledDateTime,
        orderInJourney: visitJson.orderInJourney,
        confirmationStatusId: visitJson.confirmationStatusId,
        confirmationDateTime: visitJson.confirmationDateTime,
        confirmationMethod: visitJson.confirmationMethod,
        confirmedByUserId: visitJson.confirmedByUserId,
        completedDateTime: visitJson.completedDateTime,
        durationMinutes: visitJson.durationMinutes,
        rejectionReasonId: visitJson.rejectionReasonId,
        notCompletedReasonId: visitJson.notCompletedReasonId,
        rescheduledFromVisitId: visitJson.rescheduledFromVisitId,
        rescheduledToVisitId: visitJson.rescheduledToVisitId,
        checkInLocation: visitJson.checkInLocation,
        checkOutLocation: visitJson.checkOutLocation,
        professionalNotes: visitJson.professionalNotes,
        coordinatorNotes: visitJson.coordinatorNotes,
        cancelledByUserId: visitJson.cancelledByUserId,
        cancelledDateTime: visitJson.cancelledDateTime,
        isActive: visitJson.isActive,
        createdAt: visitJson.createdAt,
        updatedAt: visitJson.updatedAt,
        // Included relations
        patient: visitJson.patient,
        journey: visitJson.journey,
        confirmationStatus: visitJson.confirmationStatus,
        rejectionReason: visitJson.rejectionReason,
        notCompletedReason: visitJson.notCompletedReason,
        confirmedByUser: visitJson.confirmedByUser,
        cancelledByUser: visitJson.cancelledByUser,
        rescheduledFromVisit: visitJson.rescheduledFromVisit,
        rescheduledToVisit: visitJson.rescheduledToVisit,
      },
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.VISIT.VISIT_FOUND,
      response
    );
  } catch (error) {
    console.error('Error fetching visit by ID:', error);
    return sendInternalErrorResponse(res);
  }
};
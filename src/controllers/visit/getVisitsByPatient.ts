import { Response } from 'express';
import { AuthRequest } from '../../interfaces/auth.interface';
import { Op, WhereOptions } from 'sequelize';
import {
  sendBadRequest,
  sendInternalErrorResponse,
  sendSuccessResponse,
} from '../../utils/commons/responseFunctions';
import {
  VisitModel,
  JourneyModel,
  ProfessionalModel,
  ZoneModel,
  ConfirmationStatusModel,
  RejectionReasonModel,
  NotCompletedReasonModel,
} from '../../models';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { IVisit } from '../../interfaces/visit.interface';
import { isValidUUID } from '../../utils/validators/schemas/uuidSchema';
import { VisitStatus } from '../../enums/Visits';

export const getVisitsByPatient = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { patientId } = req.params;

    if (!patientId) {
      return sendBadRequest(res, ERROR_MESSAGES.VISIT.INVALID_PATIENT_ID);
    }

    if (!isValidUUID(patientId)) {
      return sendBadRequest(res, ERROR_MESSAGES.VISIT.INVALID_PATIENT_ID);
    }

    // Parse pagination parameters
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const offset = (page - 1) * limit;

    // Parse filters
    const includeInactive = req.query.includeInactive === 'true';
    const status = req.query.status as string;
    const dateFrom = req.query.dateFrom as string;
    const dateTo = req.query.dateTo as string;

    // Build filters
    const filters: WhereOptions = {
      patientId,
    };

    if (!includeInactive) {
      filters.isActive = true;
    }

    if (status) {
      filters.status = status;
    }

    // Date range filter
    if (dateFrom && dateTo) {
      filters.scheduledDateTime = {
        [Op.between]: [
          new Date(`${dateFrom}T00:00:00.000Z`),
          new Date(`${dateTo}T23:59:59.999Z`),
        ],
      };
    } else if (dateFrom) {
      filters.scheduledDateTime = {
        [Op.gte]: new Date(`${dateFrom}T00:00:00.000Z`),
      };
    } else if (dateTo) {
      filters.scheduledDateTime = {
        [Op.lte]: new Date(`${dateTo}T23:59:59.999Z`),
      };
    }

    // Get visits with pagination
    const { rows: visits, count: totalVisits } = await VisitModel.findAndCountAll({
      where: filters,
      include: [
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
      ],
      order: [['scheduledDateTime', 'DESC']], // Most recent first
      limit,
      offset,
      distinct: true,
    });

    // Calculate patient visit statistics
    const completedVisits = visits.filter(v => (v.toJSON() as IVisit).status === VisitStatus.COMPLETED).length;
    const totalScheduled = visits.filter(v => [VisitStatus.SCHEDULED, VisitStatus.COMPLETED].includes((v.toJSON() as IVisit).status as VisitStatus)).length;
    const upcomingVisits = visits.filter(v => {
      const visitData = v.toJSON() as IVisit;
      return visitData.status === VisitStatus.SCHEDULED && 
        new Date(visitData.scheduledDateTime) > new Date();
    }).length;
    const overdueVisits = visits.filter(v => {
      const visitData = v.toJSON() as IVisit;
      return visitData.status === VisitStatus.SCHEDULED && 
        new Date(visitData.scheduledDateTime) < new Date();
    }).length;

    const totalPages = Math.ceil(totalVisits / limit);

    const response = {
      patientId,
      totalVisits,
      statistics: {
        completed: completedVisits,
        totalScheduled,
        upcoming: upcomingVisits,
        overdue: overdueVisits,
        completionRate: totalScheduled > 0 ? Math.round((completedVisits / totalScheduled) * 100) : 0,
      },
      visits: visits.map((visit) => {
        const visitJson = visit.toJSON() as IVisit;
        return {
          id: visitJson.id,
          journeyId: visitJson.journeyId,
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
          rescheduledFromVisitId: visitJson.rescheduledFromVisitId,
          rescheduledToVisitId: visitJson.rescheduledToVisitId,
          professionalNotes: visitJson.professionalNotes,
          coordinatorNotes: visitJson.coordinatorNotes,
          checkInLocation: visitJson.checkInLocation,
          checkOutLocation: visitJson.checkOutLocation,
          isActive: visitJson.isActive,
          createdAt: visitJson.createdAt,
          updatedAt: visitJson.updatedAt,
          // Relations
          journey: visitJson.journey,
          confirmationStatus: visitJson.confirmationStatus,
          rejectionReason: visitJson.rejectionReason,
          notCompletedReason: visitJson.notCompletedReason,
        };
      }),
      pagination: {
        total: totalVisits,
        page: page,
        limit: limit,
        totalPages: totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.VISIT.VISITS_BY_PATIENT_FETCHED,
      response
    );
  } catch (error) {
    console.error('Error fetching visits by patient:', error);
    return sendInternalErrorResponse(res);
  }
};
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
  PatientModel,
  JourneyModel,
  ProfessionalModel,
  ZoneModel,
  ConfirmationStatusModel,
} from '../../models';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { IVisit } from '../../interfaces/visit.interface';
import { VisitStatus } from '../../enums/Visits';

export const getVisitsByStatus = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { status } = req.params;

    if (!status) {
      return sendBadRequest(res, ERROR_MESSAGES.VISIT.INVALID_STATUS);
    }

    // Validate status
    if (!Object.values(VisitStatus).includes(status as VisitStatus)) {
      return sendBadRequest(res, ERROR_MESSAGES.VISIT.INVALID_STATUS);
    }

    // Parse pagination parameters
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit as string) || 20)
    );
    const offset = (page - 1) * limit;

    // Parse filters
    const zoneId = req.query.zoneId as string;
    const professionalId = req.query.professionalId as string;
    const dateFrom = req.query.dateFrom as string;
    const dateTo = req.query.dateTo as string;
    const includeInactive = req.query.includeInactive === 'true';

    // Build filters
    const filters: WhereOptions = {
      status,
    };

    if (!includeInactive) {
      filters.isActive = true;
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

    // Build includes with potential filters
    const includeFilters: any[] = [
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
          'requiresConfirmation',
        ],
      },
      {
        model: ConfirmationStatusModel,
        as: 'confirmationStatus',
        attributes: ['id', 'name', 'description'],
        required: false,
      },
    ];

    // Journey include with potential professional/zone filters
    const journeyInclude: any = {
      model: JourneyModel,
      as: 'journey',
      attributes: ['id', 'date', 'status', 'startTime', 'endTime'],
      include: [
        {
          model: ProfessionalModel,
          as: 'professional',
          attributes: ['id', 'fullName', 'specialtyId'],
        },
        {
          model: ZoneModel,
          as: 'zone',
          attributes: ['id', 'name', 'description'],
        },
      ],
    };

    // Apply professional filter if provided
    if (professionalId) {
      journeyInclude.where = { professionalId };
    }

    // Apply zone filter if provided
    if (zoneId) {
      if (journeyInclude.where) {
        journeyInclude.where.zoneId = zoneId;
      } else {
        journeyInclude.where = { zoneId };
      }
    }

    includeFilters.push(journeyInclude);

    // Get visits with pagination
    const { rows: visits, count: totalVisits } =
      await VisitModel.findAndCountAll({
        where: filters,
        include: includeFilters,
        order: [
          ['scheduledDateTime', 'ASC'], // Oldest first for dashboard workflow
          ['orderInJourney', 'ASC'],
        ],
        limit,
        offset,
        distinct: true,
      });

    // Calculate additional statistics
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const todayVisits = visits.filter(v => {
      const visitData = v.toJSON() as IVisit;
      const visitDate = new Date(visitData.scheduledDateTime);
      return visitDate.toDateString() === today.toDateString();
    }).length;

    const overdueVisits = visits.filter(v => {
      const visitData = v.toJSON() as IVisit;
      return new Date(visitData.scheduledDateTime) < today;
    }).length;

    const upcomingVisits = visits.filter(v => {
      const visitData = v.toJSON() as IVisit;
      return new Date(visitData.scheduledDateTime) > today;
    }).length;

    const totalPages = Math.ceil(totalVisits / limit);

    const response = {
      status,
      totalVisits,
      statistics: {
        today: todayVisits,
        overdue: overdueVisits,
        upcoming: upcomingVisits,
      },
      visits: visits.map(visit => {
        const visitJson = visit.toJSON() as IVisit;
        return {
          id: visitJson.id,
          patientId: visitJson.patientId,
          journeyId: visitJson.journeyId,
          status: visitJson.status,
          scheduledDateTime: visitJson.scheduledDateTime,
          orderInJourney: visitJson.orderInJourney,
          confirmationStatusId: visitJson.confirmationStatusId,
          confirmationDateTime: visitJson.confirmationDateTime,
          confirmationMethod: visitJson.confirmationMethod,
          professionalNotes: visitJson.professionalNotes,
          coordinatorNotes: visitJson.coordinatorNotes,
          isActive: visitJson.isActive,
          createdAt: visitJson.createdAt,
          updatedAt: visitJson.updatedAt,
          // Relations
          patient: visitJson.patient,
          journey: visitJson.journey,
          confirmationStatus: visitJson.confirmationStatus,
        };
      }),
      pagination: {
        currentPage: page,
        totalPages,
        totalVisits,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.VISIT.VISITS_BY_STATUS_FETCHED,
      response
    );
  } catch (error) {
    console.error('Error fetching visits by status:', error);
    return sendInternalErrorResponse(res);
  }
};

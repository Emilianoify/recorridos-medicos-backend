import { Response } from 'express';
import { AuthRequest } from '../../interfaces/auth.interface';
import { Op, WhereOptions } from 'sequelize';
import {
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
  RejectionReasonModel,
  NotCompletedReasonModel,
} from '../../models';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { IVisit } from '../../interfaces/visit.interface';

export const getVisits = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const query = req.query;
    
    // Parse pagination parameters
    const page = Math.max(1, parseInt(query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || 10));
    const offset = (page - 1) * limit;

    // Parse sorting
    const sortBy = (query.sortBy as string) || 'scheduledDateTime';
    const sortOrder = (query.sortOrder as string)?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Build filters
    const filters: WhereOptions = {};
    
    if (query.patientId && typeof query.patientId === 'string') {
      filters.patientId = query.patientId;
    }
    
    if (query.journeyId && typeof query.journeyId === 'string') {
      filters.journeyId = query.journeyId;
    }
    
    if (query.status && typeof query.status === 'string') {
      filters.status = query.status;
    }
    
    if (query.confirmationStatusId && typeof query.confirmationStatusId === 'string') {
      filters.confirmationStatusId = query.confirmationStatusId;
    }
    
    if (query.scheduledFrom && query.scheduledTo) {
      filters.scheduledDateTime = {
        [Op.between]: [
          new Date(`${query.scheduledFrom}T00:00:00.000Z`),
          new Date(`${query.scheduledTo}T23:59:59.999Z`),
        ],
      };
    } else if (query.scheduledFrom) {
      filters.scheduledDateTime = {
        [Op.gte]: new Date(`${query.scheduledFrom}T00:00:00.000Z`),
      };
    } else if (query.scheduledTo) {
      filters.scheduledDateTime = {
        [Op.lte]: new Date(`${query.scheduledTo}T23:59:59.999Z`),
      };
    }

    if (query.isActive !== undefined) {
      filters.isActive = query.isActive === 'true';
    } else {
      filters.isActive = true; // Default to active visits
    }

    // Additional filters for professional (via journey)
    const includeFilters: object[] = [];
    
    if (query.professionalId && typeof query.professionalId === 'string') {
      includeFilters.push({
        model: JourneyModel,
        as: 'journey',
        where: { professionalId: query.professionalId },
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
      });
    } else {
      includeFilters.push({
        model: JourneyModel,
        as: 'journey',
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
      });
    }

    // Always include patient information
    includeFilters.push({
      model: PatientModel,
      as: 'patient',
      attributes: [
        'id',
        'fullName',
        'healthcareId',
        'address',
        'locality',
        'phone',
        'zoneId',
        'requiresConfirmation',
      ],
    });

    // Include optional confirmation status
    includeFilters.push({
      model: ConfirmationStatusModel,
      as: 'confirmationStatus',
      attributes: ['id', 'name', 'description'],
      required: false,
    });

    // Include optional rejection reason
    includeFilters.push({
      model: RejectionReasonModel,
      as: 'rejectionReason',
      attributes: ['id', 'reason'],
      required: false,
    });

    // Include optional not completed reason
    includeFilters.push({
      model: NotCompletedReasonModel,
      as: 'notCompletedReason',
      attributes: ['id', 'reason'],
      required: false,
    });

    // Get visits with pagination
    const { rows: visits, count: totalVisits } = await VisitModel.findAndCountAll({
      where: filters,
      include: includeFilters,
      order: [[sortBy, sortOrder]],
      limit,
      offset,
      distinct: true,
    });

    const totalPages = Math.ceil(totalVisits / limit);

    const response = {
      visits: visits.map((visit) => {
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
          completedDateTime: visitJson.completedDateTime,
          durationMinutes: visitJson.durationMinutes,
          rejectionReasonId: visitJson.rejectionReasonId,
          notCompletedReasonId: visitJson.notCompletedReasonId,
          professionalNotes: visitJson.professionalNotes,
          coordinatorNotes: visitJson.coordinatorNotes,
          isActive: visitJson.isActive,
          createdAt: visitJson.createdAt,
          updatedAt: visitJson.updatedAt,
          patient: visitJson.patient,
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
      SUCCESS_MESSAGES.VISIT.VISITS_FETCHED,
      response
    );
  } catch (error) {
    console.error('Error fetching visits:', error);
    return sendInternalErrorResponse(res);
  }
};
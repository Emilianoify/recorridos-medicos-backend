import { Response } from 'express';
import { AuthRequest } from '../../interfaces/auth.interface';
import { ZodError } from 'zod';
import {
  sendBadRequest,
  sendInternalErrorResponse,
  sendSuccessResponse,
  sendNotFound,
} from '../../utils/commons/responseFunctions';
import { Op, WhereOptions } from 'sequelize';
import { JourneyModel, ProfessionalModel, ZoneModel } from '../../models';
import { IJourney } from '../../interfaces/journey.interface';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { isValidUUID } from '../../utils/validators/schemas/uuidSchema';
import { journeysByProfessionalQuerySchema } from '../../utils/validators/schemas/paginationSchemas';
import { JourneyStatus } from '../../enums/JourneyStatus';
import { IProfessional } from '../../interfaces/professional.interface';

export const getJourneysByProfessional = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { professionalId } = req.params;

    if (!professionalId) {
      return sendBadRequest(res, ERROR_MESSAGES.PROFESSIONAL.ID_REQUIRED);
    }

    if (!isValidUUID(professionalId)) {
      return sendBadRequest(res, ERROR_MESSAGES.PROFESSIONAL.INVALID_ID);
    }

    const validatedQuery = journeysByProfessionalQuerySchema.parse(req.query);

    const {
      page,
      limit,
      sortBy,
      sortOrder,
      zoneId,
      status,
      dateFrom,
      dateTo,
      isActive,
    } = validatedQuery;

    // Validate that professional exists
    const professionalInstance = await ProfessionalModel.findOne({
      where: { id: professionalId, isActive: true },
      attributes: ['id', 'firstname', 'lastname', 'licenseNumber'],
    });

    if (!professionalInstance) {
      return sendNotFound(res, ERROR_MESSAGES.PROFESSIONAL.NOT_FOUND);
    }

    const professional: IProfessional =
      professionalInstance.toJSON() as IProfessional;
    const whereClause: WhereOptions = {
      professionalId: professionalId,
      isActive: typeof isActive === 'boolean' ? isActive : true,
    };

    if (zoneId) {
      whereClause.zoneId = zoneId;
    }

    if (status) {
      whereClause.status = status;
    }

    if (dateFrom || dateTo) {
      whereClause.date = {
        ...(dateFrom && { [Op.gte]: dateFrom }),
        ...(dateTo && { [Op.lte]: dateTo }),
      };
    }

    // Dynamic ordering
    const orderDirection = sortOrder.toUpperCase() as 'ASC' | 'DESC';
    const orderBy: [string, 'ASC' | 'DESC'][] = [[sortBy, orderDirection]];

    // Database query
    const journeysData = await JourneyModel.findAndCountAll({
      where: whereClause,
      limit: limit,
      offset: (page - 1) * limit,
      order: orderBy,
      attributes: { exclude: ['deletedAt'] },
      include: [
        {
          model: ProfessionalModel,
          as: 'professional',
          attributes: ['id', 'firstname', 'lastname', 'licenseNumber'],
          where: { isActive: true },
          required: false,
        },
        {
          model: ZoneModel,
          as: 'zone',
          attributes: ['id', 'name', 'description'],
          where: { isActive: true },
          required: false,
        },
      ],
    });

    const totalPages = Math.ceil(journeysData.count / limit);

    // Calculate summary stats
    const totalJourneys = journeysData.count;
    const completedJourneys = await JourneyModel.count({
      where: { ...whereClause, status: JourneyStatus.COMPLETED },
    });
    const inProgressJourneys = await JourneyModel.count({
      where: { ...whereClause, status: JourneyStatus.IN_PROGRESS },
    });
    const plannedJourneys = await JourneyModel.count({
      where: { ...whereClause, status: JourneyStatus.PLANNED },
    });

    const response = {
      professional: {
        id: professional.id,
        firstname: professional.firstname,
        lastname: professional.lastname,
        specialtyId: professional.specialtyId,
      },
      journeys: journeysData.rows.map(journeyInstance => {
        const journey: IJourney = journeyInstance.toJSON() as IJourney;
        return {
          id: journey.id,
          professionalId: journey.professionalId,
          date: journey.date,
          zoneId: journey.zoneId,
          zone: journey.zone,
          status: journey.status,
          plannedStartTime: journey.plannedStartTime,
          plannedEndTime: journey.plannedEndTime,
          actualStartTime: journey.actualStartTime,
          actualEndTime: journey.actualEndTime,
          estimatedVisits: journey.estimatedVisits,
          completedVisits: journey.completedVisits,
          totalTravelDistance: journey.totalTravelDistance,
          observations: journey.observations,
          isActive: journey.isActive,
          createdAt: journey.createdAt,
          updatedAt: journey.updatedAt,
        };
      }),
      pagination: {
        total: totalJourneys,
        page: page,
        limit: limit,
        totalPages: totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      filters: {
        professionalId: professionalId,
        zoneId: zoneId || null,
        status: status || null,
        dateFrom: dateFrom || null,
        dateTo: dateTo || null,
        isActive: isActive ?? null,
      },
      summary: {
        totalJourneys,
        completedJourneys,
        inProgressJourneys,
        plannedJourneys,
        completionRate:
          totalJourneys > 0
            ? Math.round((completedJourneys / totalJourneys) * 100)
            : 0,
      },
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.JOURNEY.JOURNEYS_BY_PROFESSIONAL_FETCHED,
      response
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0].message;
      return sendBadRequest(res, firstError);
    }
    console.error('Error fetching journeys by professional:', error);
    return sendInternalErrorResponse(res);
  }
};

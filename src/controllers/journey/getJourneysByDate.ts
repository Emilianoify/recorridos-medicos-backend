import { Response } from 'express';
import { AuthRequest } from '../../interfaces/auth.interface';
import { ZodError } from 'zod';
import {
  sendBadRequest,
  sendInternalErrorResponse,
  sendSuccessResponse,
} from '../../utils/commons/responseFunctions';
import { Op } from 'sequelize';
import { JourneyModel, ProfessionalModel, ZoneModel } from '../../models';
import { IJourney, IJourneyWhereClause } from '../../interfaces/journey.interface';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { journeysByDateQuerySchema } from '../../utils/validators/schemas/paginationSchemas';

export const getJourneysByDate = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const validatedQuery = journeysByDateQuerySchema.parse(req.query);

    const {
      page,
      limit,
      sortBy,
      sortOrder,
      date,
      professionalId,
      zoneId,
      status,
      isActive,
    } = validatedQuery;

    const whereClause: IJourneyWhereClause = {
      date: date,
      isActive: typeof isActive === 'boolean' ? isActive : true,
    };

    if (professionalId) {
      whereClause.professionalId = professionalId;
    }

    if (zoneId) {
      whereClause.zoneId = zoneId;
    }

    if (status) {
      whereClause.status = status;
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
          attributes: ['id', 'firstName', 'lastName', 'licenseNumber'],
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

    const response = {
      journeys: journeysData.rows.map(journeyInstance => {
        const journey: IJourney = journeyInstance.toJSON() as IJourney;
        return {
          id: journey.id,
          professionalId: journey.professionalId,
          professional: journey.professional,
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
        total: journeysData.count,
        page: page,
        limit: limit,
        totalPages: totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      filters: {
        date: date,
        professionalId: professionalId || null,
        zoneId: zoneId || null,
        status: status || null,
        isActive: isActive ?? null,
      },
      summary: {
        totalJourneysForDate: journeysData.count,
        date: date,
      },
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.JOURNEY.JOURNEYS_BY_DATE_FETCHED,
      response
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0].message;
      return sendBadRequest(res, firstError);
    }
    console.error('Error fetching journeys by date:', error);
    return sendInternalErrorResponse(res);
  }
};

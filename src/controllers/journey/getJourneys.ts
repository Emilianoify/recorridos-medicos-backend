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
import { IJourney, IJourneyGeneralWhereClause } from '../../interfaces/journey.interface';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { journeyQuerySchema } from '../../utils/validators/schemas/paginationSchemas';

export const getJourneys = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const validatedQuery = journeyQuerySchema.parse(req.query);

    const {
      page,
      limit,
      sortBy,
      sortOrder,
      professionalId,
      zoneId,
      status,
      dateFrom,
      dateTo,
      isActive,
    } = validatedQuery;

    // Build where clause
    const whereClause: IJourneyGeneralWhereClause = {};

    if (professionalId) {
      whereClause.professionalId = professionalId;
    }

    if (zoneId) {
      whereClause.zoneId = zoneId;
    }

    if (status) {
      whereClause.status = status;
    }

    if (typeof isActive === 'boolean') {
      whereClause.isActive = isActive;
    }

    // Date range filtering
    if (dateFrom || dateTo) {
      whereClause.date = {};
      if (dateFrom) {
        whereClause.date[Op.gte] = dateFrom;
      }
      if (dateTo) {
        whereClause.date[Op.lte] = dateTo;
      }
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
          attributes: ['id', 'firstname', 'lastname', 'specialtyId'],
        },
        {
          model: ZoneModel,
          as: 'zone',
          attributes: ['id', 'name', 'description'],
        },
      ],
    });

    const totalPages = Math.ceil(journeysData.count / limit);

    const response = {
      journeys: journeysData.rows.map((journeyInstance) => {
        const journey: IJourney = journeyInstance.toJSON() as IJourney;
        return {
          id: journey.id,
          professional: journey.professional,
          date: journey.date,
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
        professionalId: professionalId || null,
        zoneId: zoneId || null,
        status: status || null,
        dateFrom: dateFrom || null,
        dateTo: dateTo || null,
        isActive: isActive ?? null,
      },
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.JOURNEY.JOURNEYS_FETCHED,
      response
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0].message;
      return sendBadRequest(res, firstError);
    }
    console.error('Error fetching journeys:', error);
    return sendInternalErrorResponse(res);
  }
};
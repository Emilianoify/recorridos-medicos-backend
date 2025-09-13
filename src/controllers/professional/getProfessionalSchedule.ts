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
import {
  ProfessionalModel,
  JourneyModel,
  VisitModel,
  ZoneModel,
  PatientModel,
  HolidayModel,
} from '../../models';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { isValidUUID } from '../../utils/validators/schemas/uuidSchema';
import { dateRangeSchema } from '../../utils/validators/schemas/dateSchemas';
import { IProfessional } from '../../interfaces/professional.interface';
import {
  IDaySchedule,
  IJourneyWithVisits,
} from '../../interfaces/journey.interface';
import { IHoliday } from '../../interfaces/holiday.interface';
import { JourneyStatus } from '../../enums/JourneyStatus';

export const getProfessionalSchedule = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { professionalId } = req.params;
    const { includeCompleted } = req.query;

    if (!professionalId) {
      return sendBadRequest(res, ERROR_MESSAGES.PROFESSIONAL.ID_REQUIRED);
    }

    if (!isValidUUID(professionalId)) {
      return sendBadRequest(res, ERROR_MESSAGES.PROFESSIONAL.INVALID_ID);
    }

    // Validate dates using Zod schema
    const validatedQuery = dateRangeSchema.parse({
      fromDate: req.query.fromDate,
      toDate: req.query.toDate,
    });

    const { fromDate, toDate } = validatedQuery;

    // Build date filter
    const dateFilter: { date?: { [Op.gte]?: string; [Op.lte]?: string } } = {};
    if (fromDate || toDate) {
      dateFilter.date = {
        ...(fromDate && { [Op.gte]: fromDate }),
        ...(toDate && { [Op.lte]: toDate }),
      };
    }

    // Verify professional exists
    const professionalInstance =
      await ProfessionalModel.findByPk(professionalId);
    if (!professionalInstance) {
      return sendNotFound(res, ERROR_MESSAGES.PROFESSIONAL.NOT_FOUND);
    }

    const professional: IProfessional =
      professionalInstance.toJSON() as IProfessional;

    // Build journey filter
    const journeyWhereClause: WhereOptions = {
      professionalId,
      isActive: true,
      ...dateFilter,
    };

    // Include completed journeys if requested
    if (!includeCompleted) {
      journeyWhereClause.status = {
        [Op.ne]: JourneyStatus.COMPLETED,
      };
    }

    // Get professional's journeys with visits
    const [journeysInstances, holidaysInstances] = await Promise.all([
      JourneyModel.findAll({
        where: journeyWhereClause,
        include: [
          {
            model: ZoneModel,
            as: 'zone',
            attributes: ['id', 'name', 'description'],
            where: { isActive: true },
            required: false,
          },
          {
            model: VisitModel,
            as: 'visits',
            attributes: [
              'id',
              'patientId',
              'scheduledDate',
              'scheduledTime',
              'estimatedDuration',
              'status',
              'orderInJourney',
              'observations',
              'isActive',
            ],
            where: { isActive: true },
            include: [
              {
                model: PatientModel,
                as: 'patient',
                attributes: ['id', 'fullName', 'address', 'locality'],
                where: { isActive: true },
                required: true,
              },
            ],
            required: false,
          },
        ],
        order: [
          ['date', 'ASC'],
          ['plannedStartTime', 'ASC'],
          [{ model: VisitModel, as: 'visits' }, 'orderInJourney', 'ASC'],
        ],
      }),

      // Get holidays in the date range
      HolidayModel.findAll({
        where: {
          isActive: true,
          ...(fromDate || toDate
            ? {
                date: {
                  ...(fromDate && { [Op.gte]: fromDate }),
                  ...(toDate && { [Op.lte]: toDate }),
                },
              }
            : {}),
        },
        order: [['date', 'ASC']],
      }),
    ]);

    const journeys: IJourneyWithVisits[] = journeysInstances.map(
      instance => instance.toJSON() as IJourneyWithVisits
    );
    const holidays: IHoliday[] = holidaysInstances.map(
      instance => instance.toJSON() as IHoliday
    );

    const scheduleByDate: Record<string, IDaySchedule> = {};

    journeys.forEach(journey => {
      const dateKey = journey.date.toString();

      if (!scheduleByDate[dateKey]) {
        scheduleByDate[dateKey] = {
          date: dateKey,
          dayOfWeek: new Date(dateKey).toLocaleDateString('es-ES', {
            weekday: 'long',
          }),
          journeys: [],
          totalVisits: 0,
          completedVisits: 0,
          isHoliday: false,
          holiday: null,
        };
      }

      const processedJourney = {
        ...journey,
        visits: journey.visits || [],
      };

      scheduleByDate[dateKey].journeys.push(processedJourney);
      scheduleByDate[dateKey].totalVisits += 0;
      scheduleByDate[dateKey].completedVisits += 0;
    });

    // Mark holidays
    holidays.forEach(holiday => {
      const dateKey = holiday.date.toString();
      if (scheduleByDate[dateKey]) {
        scheduleByDate[dateKey].isHoliday = true;
        scheduleByDate[dateKey].holiday = holiday;
      } else {
        scheduleByDate[dateKey] = {
          date: dateKey,
          dayOfWeek: new Date(dateKey).toLocaleDateString('es-ES', {
            weekday: 'long',
          }),
          journeys: [],
          totalVisits: 0,
          completedVisits: 0,
          isHoliday: true,
          holiday: holiday,
        };
      }
    });

    // Convert to sorted array
    const scheduleArray = Object.values(scheduleByDate).sort(
      (a: IDaySchedule, b: IDaySchedule) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Calculate summary statistics
    const summary = {
      totalDays: scheduleArray.length,
      workingDays: scheduleArray.filter(
        (day: IDaySchedule) => day.journeys.length > 0
      ).length,
      holidays: scheduleArray.filter((day: IDaySchedule) => day.isHoliday)
        .length,
      totalJourneys: journeys.length,
      totalVisits: scheduleArray.reduce(
        (sum: number, day: IDaySchedule) => sum + day.totalVisits,
        0
      ),
      completedVisits: scheduleArray.reduce(
        (sum: number, day: IDaySchedule) => sum + day.completedVisits,
        0
      ),
      pendingJourneys: journeys.filter(j => j.status === JourneyStatus.PLANNED)
        .length,
      inProgressJourneys: journeys.filter(
        j => j.status === JourneyStatus.IN_PROGRESS
      ).length,
      completedJourneys: journeys.filter(
        j => j.status === JourneyStatus.COMPLETED
      ).length,
    };

    summary.completedVisits =
      summary.totalVisits > 0
        ? Math.round((summary.completedVisits / summary.totalVisits) * 100)
        : 0;

    const response = {
      professional: {
        id: professional.id,
        name: `${professional.firstname} ${professional.lastname}`,
        specialtyId: professional.specialtyId,
        state: professional.state,
      },
      schedule: scheduleArray,
      summary,
      metadata: {
        generatedAt: new Date().toISOString(),
        filters: {
          dateRange: {
            fromDate: fromDate || 'No especificado',
            toDate: toDate || 'No especificado',
          },
          includeCompleted: includeCompleted === 'true',
        },
        statusLegend: {
          [JourneyStatus.PLANNED]: 'Planificado',
          [JourneyStatus.IN_PROGRESS]: 'En progreso',
          [JourneyStatus.COMPLETED]: 'Completado',
        },
      },
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.PROFESSIONAL.PROFESSIONAL_FOUND,
      response
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0].message;
      return sendBadRequest(res, firstError);
    }

    console.error('Error fetching professional schedule:', error);
    return sendInternalErrorResponse(res);
  }
};

import { Response } from 'express';
import { AuthRequest } from '../../interfaces/auth.interface';
import { ZodError } from 'zod';
import {
  sendBadRequest,
  sendInternalErrorResponse,
  sendSuccessResponse,
} from '../../utils/commons/responseFunctions';
import { Op, WhereOptions } from 'sequelize';
import {
  PatientModel,
  HealthcareProviderModel,
  ZoneModel,
  FrequencyModel,
  ProfessionalModel,
} from '../../models';
import { IPatient } from '../../interfaces/patient.interface';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { patientQuerySchema } from '../../utils/validators/schemas/paginationSchemas';

export const getPatients = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const validatedQuery = patientQuerySchema.parse(req.query);

    const {
      page,
      limit,
      sortBy,
      sortOrder,
      zoneId,
      frequencyId,
      primaryProfessionalId,
      healthcareProviderId,
      state,
      locality,
      requiresConfirmation,
      search,
      hasUpcomingVisit,
      authorizationExpired,
    } = validatedQuery;

    // Build where clause
    const whereClause: WhereOptions = {};

    if (state) {
      whereClause.state = state;
    }

    if (zoneId) {
      whereClause.zoneId = zoneId;
    }

    if (frequencyId) {
      whereClause.frequencyId = frequencyId;
    }

    if (primaryProfessionalId) {
      whereClause.primaryProfessionalId = primaryProfessionalId;
    }

    if (healthcareProviderId) {
      whereClause.healthcareProviderId = healthcareProviderId;
    }

    if (locality) {
      whereClause.locality = { [Op.iLike]: `%${locality.trim()}%` };
    }

    if (typeof requiresConfirmation === 'boolean') {
      whereClause.requiresConfirmation = requiresConfirmation;
    }

    // Search functionality
    if (search) {
      whereClause[Op.or.toString()] = [
        { firstname: { [Op.iLike]: `%${search.trim()}%` } },
        { lastname: { [Op.iLike]: `%${search.trim()}%` } },
        { username: { [Op.iLike]: `%${search.trim()}%` } },
        { corporative_email: { [Op.iLike]: `%${search.trim()}%` } },
      ];
    }

    // Filter by upcoming visits
    if (hasUpcomingVisit !== undefined) {
      if (hasUpcomingVisit) {
        whereClause.nextScheduledVisitDate = { [Op.gte]: new Date() };
      } else {
        whereClause[Op.or.toString()] = [
          { nextScheduledVisitDate: null },
          { nextScheduledVisitDate: { [Op.lt]: new Date() } },
        ];
      }
    }

    // Filter by authorization expiration (assumes last month)
    if (authorizationExpired !== undefined) {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      if (authorizationExpired) {
        whereClause.lastAuthorizationDate = { [Op.lt]: lastMonth };
      } else {
        whereClause.lastAuthorizationDate = { [Op.gte]: lastMonth };
      }
    }

    // Dynamic ordering
    const orderDirection = sortOrder.toUpperCase() as 'ASC' | 'DESC';

    const orderBy: [string, 'ASC' | 'DESC'][] = [[sortBy, orderDirection]];

    // Database query
    const patientsData = await PatientModel.findAndCountAll({
      where: whereClause,
      limit: limit,
      offset: (page - 1) * limit,
      order: orderBy,
      attributes: { exclude: ['deletedAt'] },
      include: [
        {
          model: HealthcareProviderModel,
          as: 'healthcareProvider',
          attributes: ['id', 'name', 'code', 'isActive'],
        },
        {
          model: ZoneModel,
          as: 'zone',
          attributes: ['id', 'name', 'isActive'],
        },
        {
          model: FrequencyModel,
          as: 'frequency',
          attributes: [
            'id',
            'name',
            'description',
            'frequencyType',
            'isActive',
          ],
        },
        {
          model: ProfessionalModel,
          as: 'primaryProfessional',
          attributes: ['id', 'firstname', 'lastname', 'specialtyId'],
          required: false,
        },
      ],
    });

    const totalPages = Math.ceil(patientsData.count / limit);

    const response = {
      patients: patientsData.rows.map(patient => {
        const patientJson = patient.toJSON() as IPatient;
        return {
          id: patientJson.id,
          fullName: patientJson.fullName,
          healthcareId: patientJson.healthcareId,
          healthcareProvider: patientJson.healthcareProvider,
          address: patientJson.address,
          locality: patientJson.locality,
          zone: patientJson.zone,
          phone: patientJson.phone,
          emergencyPhone: patientJson.emergencyPhone,
          state: patientJson.state,
          lastAuthorizationDate: patientJson.lastAuthorizationDate,
          authorizedVisitsPerMonth: patientJson.authorizedVisitsPerMonth,
          completedVisitsThisMonth: patientJson.completedVisitsThisMonth,
          frequency: patientJson.frequency,
          primaryProfessional: patientJson.primaryProfessional,
          lastVisitDate: patientJson.lastVisitDate,
          nextScheduledVisitDate: patientJson.nextScheduledVisitDate,
          diagnosis: patientJson.diagnosis,
          medicalObservations: patientJson.medicalObservations,
          requiresConfirmation: patientJson.requiresConfirmation,
          preferredContactMethod: patientJson.preferredContactMethod,
          isActive: patientJson.isActive,
          createdAt: patientJson.createdAt,
          updatedAt: patientJson.updatedAt,
        };
      }),
      pagination: {
        total: patientsData.count,
        page: page,
        limit: limit,
        totalPages: totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      filters: {
        zoneId: zoneId || null,
        frequencyId: frequencyId || null,
        primaryProfessionalId: primaryProfessionalId || null,
        healthcareProviderId: healthcareProviderId || null,
        state: state || null,
        locality: locality || null,
        requiresConfirmation: requiresConfirmation ?? null,
        search: search || null,
        hasUpcomingVisit: hasUpcomingVisit ?? null,
        authorizationExpired: authorizationExpired ?? null,
      },
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.PATIENT.PATIENTS_FETCHED,
      response
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0].message;
      return sendBadRequest(res, firstError);
    }
    console.error('Error fetching patients:', error);
    return sendInternalErrorResponse(res);
  }
};

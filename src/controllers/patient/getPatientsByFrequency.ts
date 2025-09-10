import { Response } from 'express';
import { AuthRequest } from '../../interfaces/auth.interface';
import { ZodError } from 'zod';
import {
  sendBadRequest,
  sendInternalErrorResponse,
  sendSuccessResponse,
} from '../../utils/commons/responseFunctions';
import {
  PatientModel,
  HealthcareProviderModel,
  ZoneModel,
  FrequencyModel,
  ProfessionalModel,
} from '../../models';
import { IPatient } from '../../interfaces/patient.interface';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { Op } from 'sequelize';
import { getPatientsByFrequencyQuerySchema } from '../../utils/validators/schemas/paginationSchemas';
import { isValidUUID } from '../../utils/validators/schemas/uuidSchema';

export const getPatientsByFrequency = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { frequencyId } = req.params;

    // 1. Manual ID validation (standard pattern)
    if (!frequencyId) {
      return sendBadRequest(
        res,
        ERROR_MESSAGES.PATIENT.FREQUENCY_ID_REQUIRED
      );
    }

    if (!isValidUUID(frequencyId)) {
      return sendBadRequest(res, ERROR_MESSAGES.PATIENT.INVALID_FREQUENCY_ID);
    }

    const { page, limit, zoneId, state, search, includeInactive } =
      getPatientsByFrequencyQuerySchema.parse(req.query);

    const whereClause: any = { frequencyId };

    if (zoneId) {
      whereClause.zoneId = zoneId;
    }

    if (state) {
      whereClause.state = state;
    }

    if (!includeInactive) {
      whereClause.isActive = true;
    }

    if (search) {
      whereClause[Op.or] = [
        { fullName: { [Op.iLike]: `%${search.trim()}%` } },
        { healthcareId: { [Op.iLike]: `%${search.trim()}%` } },
        { locality: { [Op.iLike]: `%${search.trim()}%` } },
      ];
    }

    const patientsData = (await PatientModel.findAndCountAll({
      where: whereClause,
      limit: limit,
      offset: (page - 1) * limit,
      order: [
        ['nextScheduledVisitDate', 'ASC'],
        ['fullName', 'ASC'],
      ],
      attributes: { exclude: ['deletedAt'] },
      include: [
        {
          model: HealthcareProviderModel,
          as: 'healthcareProvider',
          attributes: ['id', 'name', 'code'],
        },
        {
          model: ZoneModel,
          as: 'zone',
          attributes: ['id', 'name'],
        },
        {
          model: FrequencyModel,
          as: 'frequency',
          attributes: [
            'id',
            'name',
            'frequencyType',
            'daysBetweenVisits',
            'visitsPerMonth',
          ],
        },
        {
          model: ProfessionalModel,
          as: 'primaryProfessional',
          attributes: ['id', 'firstname', 'lastname'],
          required: false,
        },
      ],
    })) as IPatient | any;

    const totalPages = Math.ceil(patientsData.count / limit);

    const response = {
      patients: patientsData.rows.map((patient: IPatient | any) => ({
        id: patient.id,
        fullName: patient.fullName,
        healthcareId: patient.healthcareId,
        healthcareProvider: patient.healthcareProvider,
        address: patient.address,
        locality: patient.locality,
        zone: patient.zone,
        phone: patient.phone,
        state: patient.state,
        lastVisitDate: patient.lastVisitDate,
        nextScheduledVisitDate: patient.nextScheduledVisitDate,
        completedVisitsThisMonth: patient.completedVisitsThisMonth,
        authorizedVisitsPerMonth: patient.authorizedVisitsPerMonth,
        primaryProfessional: patient.primaryProfessional,
        isActive: patient.isActive,
      })),
      pagination: {
        total: patientsData.count,
        page: page,
        limit: limit,
        totalPages: totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      frequency: patientsData.frequency || null,
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
    console.error('Error fetching patients by frequency:', error);
    return sendInternalErrorResponse(res);
  }
};

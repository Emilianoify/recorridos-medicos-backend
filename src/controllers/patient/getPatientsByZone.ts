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
import { Op, WhereOptions } from 'sequelize';
import { getPatientsByZoneQuerySchema } from '../../utils/validators/schemas/paginationSchemas';
import { isValidUUID } from '../../utils/validators/schemas/uuidSchema';

export const getPatientsByZone = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { zoneId } = req.params;

    // 1. Manual ID validation (standard pattern)
    if (!zoneId) {
      return sendBadRequest(res, ERROR_MESSAGES.ZONE.ID_REQUIRED);
    }

    if (!isValidUUID(zoneId)) {
      return sendBadRequest(res, ERROR_MESSAGES.ZONE.INVALID_ID);
    }

    const { page, limit, state, search, includeInactive } =
      getPatientsByZoneQuerySchema.parse(req.query);

    const whereClause: WhereOptions = { zoneId };

    if (state) {
      whereClause.state = state;
    }

    if (!includeInactive) {
      whereClause.isActive = true;
    }

    if (search) {
      whereClause[Op.or.toString()] = [
        { fullName: { [Op.iLike]: `%${search.trim()}%` } },
        { healthcareId: { [Op.iLike]: `%${search.trim()}%` } },
        { locality: { [Op.iLike]: `%${search.trim()}%` } },
      ];
    }

    const patientsData = (await PatientModel.findAndCountAll({
      where: whereClause,
      limit: limit,
      offset: (page - 1) * limit,
      order: [['fullName', 'ASC']],
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
          attributes: ['id', 'name', 'frequencyType'],
        },
        {
          model: ProfessionalModel,
          as: 'primaryProfessional',
          attributes: ['id', 'firstname', 'lastname'],
          required: false,
        },
      ],
    }));

    const totalPages = Math.ceil(patientsData.count / limit);

    const response = {
      patients: patientsData.rows.map((patientInstance) => {
        const patient: IPatient = patientInstance.toJSON() as IPatient;
        return {
        id: patient.id,
        fullName: patient.fullName,
        healthcareId: patient.healthcareId,
        healthcareProvider: patient.healthcareProvider,
        address: patient.address,
        locality: patient.locality,
        phone: patient.phone,
        state: patient.state,
        frequency: patient.frequency,
        primaryProfessional: patient.primaryProfessional,
        nextScheduledVisitDate: patient.nextScheduledVisitDate,
        isActive: patient.isActive,
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
      zone: patientsData.rows.length > 0 ? (patientsData.rows[0].toJSON() as IPatient).zone || null : null,
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
    console.error('Error fetching patients by zone:', error);
    return sendInternalErrorResponse(res);
  }
};

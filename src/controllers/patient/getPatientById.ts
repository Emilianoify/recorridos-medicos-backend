import { Response } from 'express';
import { AuthRequest } from '../../interfaces/auth.interface';
import { ZodError } from 'zod';
import {
  sendBadRequest,
  sendInternalErrorResponse,
  sendSuccessResponse,
  sendNotFound,
} from '../../utils/commons/responseFunctions';
import {
  PatientModel,
  HealthcareProviderModel,
  ZoneModel,
  FrequencyModel,
  ProfessionalModel,
} from '../../models';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { IPatient } from '../../interfaces/patient.interface';
import { isValidUUID } from '../../utils/validators/schemas/uuidSchema';

export const getPatientById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // 1. Manual ID validation (standard pattern)
    if (!id) {
      return sendBadRequest(
        res,
        ERROR_MESSAGES.PATIENT.ID_REQUIRED
      );
    }

    if (!isValidUUID(id)) {
      return sendBadRequest(res, ERROR_MESSAGES.PATIENT.INVALID_ID);
    }

    const patient = (await PatientModel.findByPk(id, {
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
          attributes: ['id', 'name', 'description', 'isActive'],
        },
        {
          model: FrequencyModel,
          as: 'frequency',
          attributes: [
            'id',
            'name',
            'description',
            'frequencyType',
            'nextDateCalculationRule',
            'daysBetweenVisits',
            'visitsPerMonth',
            'isActive',
          ],
        },
        {
          model: ProfessionalModel,
          as: 'primaryProfessional',
          attributes: [
            'id',
            'firstname',
            'lastname',
            'specialtyId',
            'phone',
            'isActive',
          ],
          required: false,
        },
      ],
    })) as IPatient | null;

    if (!patient) {
      return sendNotFound(res, ERROR_MESSAGES.PATIENT.NOT_FOUND);
    }

    const response = {
      patient: {
        id: patient.id,
        fullName: patient.fullName,
        healthcareId: patient.healthcareId,
        healthcareProvider: patient.healthcareProvider,
        address: patient.address,
        locality: patient.locality,
        zone: patient.zone,
        phone: patient.phone,
        emergencyPhone: patient.emergencyPhone,
        state: patient.state,
        lastAuthorizationDate: patient.lastAuthorizationDate,
        authorizedVisitsPerMonth: patient.authorizedVisitsPerMonth,
        completedVisitsThisMonth: patient.completedVisitsThisMonth,
        frequency: patient.frequency,
        primaryProfessional: patient.primaryProfessional,
        lastVisitDate: patient.lastVisitDate,
        nextScheduledVisitDate: patient.nextScheduledVisitDate,
        diagnosis: patient.diagnosis,
        medicalObservations: patient.medicalObservations,
        requiresConfirmation: patient.requiresConfirmation,
        preferredContactMethod: patient.preferredContactMethod,
        isActive: patient.isActive,
        createdAt: patient.createdAt,
        updatedAt: patient.updatedAt,
      },
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.PATIENT.PATIENT_FOUND,
      response
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0].message;
      return sendBadRequest(res, firstError);
    }

    console.error('Error fetching patient by ID:', error);
    return sendInternalErrorResponse(res);
  }
};

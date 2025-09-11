import { Response } from 'express';
import { AuthRequest } from '../../interfaces/auth.interface';
import { ZodError } from 'zod';
import {
  sendBadRequest,
  sendInternalErrorResponse,
  sendSuccessResponse,
  sendNotFound,
  sendConflict,
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
import { updatePatientSchema } from '../../utils/validators/schemas/patientSchemas';
import { Op } from 'sequelize';
import { IPatient } from '../../interfaces/patient.interface';
import { isValidUUID } from '../../utils/validators/schemas/uuidSchema';

export const updatePatient = async (
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

    const body = req.body;

    if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
      return sendBadRequest(res, ERROR_MESSAGES.PATIENT.NO_FIELDS_TO_UPDATE);
    }

    const validatedData = updatePatientSchema.parse(body);

    const patientInstance = await PatientModel.findByPk(id);
    if (!patientInstance) {
      return sendNotFound(res, ERROR_MESSAGES.PATIENT.NOT_FOUND);
    }

    const patient: IPatient = patientInstance.toJSON() as IPatient;

    // Check for healthcare ID conflicts if being updated
    if (validatedData.healthcareId && validatedData.healthcareProviderId) {
      const existingPatient = await PatientModel.findOne({
        where: {
          healthcareId: validatedData.healthcareId,
          healthcareProviderId: validatedData.healthcareProviderId,
          id: { [Op.ne]: id },
        },
        paranoid: false,
      });

      if (existingPatient) {
        return sendConflict(res, ERROR_MESSAGES.PATIENT.HEALTHCARE_ID_IN_USE);
      }
    }

    // Validate related entities if they're being updated
    if (validatedData.healthcareProviderId) {
      const healthcareProvider = await HealthcareProviderModel.findOne({
        where: { id: validatedData.healthcareProviderId, isActive: true },
      });
      if (!healthcareProvider) {
        return sendBadRequest(
          res,
          ERROR_MESSAGES.PATIENT.INVALID_HEALTHCARE_PROVIDER_ID
        );
      }
    }

    if (validatedData.zoneId) {
      const zone = await ZoneModel.findOne({
        where: { id: validatedData.zoneId, isActive: true },
      });
      if (!zone) {
        return sendBadRequest(res, ERROR_MESSAGES.PATIENT.INVALID_ZONE_ID);
      }
    }

    if (validatedData.frequencyId) {
      const frequency = await FrequencyModel.findOne({
        where: { id: validatedData.frequencyId, isActive: true },
      });
      if (!frequency) {
        return sendBadRequest(res, ERROR_MESSAGES.PATIENT.INVALID_FREQUENCY_ID);
      }
    }

    if (validatedData.primaryProfessionalId) {
      const professional = await ProfessionalModel.findOne({
        where: { id: validatedData.primaryProfessionalId, isActive: true },
      });
      if (!professional) {
        return sendBadRequest(
          res,
          ERROR_MESSAGES.PATIENT.INVALID_PROFESSIONAL_ID
        );
      }
    }

    await PatientModel.update(validatedData, { where: { id } });

    // Fetch updated patient with all relations
    const updatedPatientInstance = await PatientModel.findByPk(id, {
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
    });

    if (!updatedPatientInstance) {
      return sendNotFound(res, ERROR_MESSAGES.PATIENT.NOT_FOUND);
    }

    const updatedPatient: IPatient = updatedPatientInstance.toJSON() as IPatient;

    const response = {
      patient: {
        id: updatedPatient.id,
        fullName: updatedPatient.fullName,
        healthcareId: updatedPatient.healthcareId,
        healthcareProvider: updatedPatient.healthcareProvider,
        address: updatedPatient.address,
        locality: updatedPatient.locality,
        zone: updatedPatient.zone,
        phone: updatedPatient.phone,
        emergencyPhone: updatedPatient.emergencyPhone,
        state: updatedPatient.state,
        lastAuthorizationDate: updatedPatient.lastAuthorizationDate,
        authorizedVisitsPerMonth: updatedPatient.authorizedVisitsPerMonth,
        completedVisitsThisMonth: updatedPatient.completedVisitsThisMonth,
        frequency: updatedPatient.frequency,
        primaryProfessional: updatedPatient.primaryProfessional,
        lastVisitDate: updatedPatient.lastVisitDate,
        nextScheduledVisitDate: updatedPatient.nextScheduledVisitDate,
        diagnosis: updatedPatient.diagnosis,
        medicalObservations: updatedPatient.medicalObservations,
        requiresConfirmation: updatedPatient.requiresConfirmation,
        preferredContactMethod: updatedPatient.preferredContactMethod,
        isActive: updatedPatient.isActive,
        updatedAt: updatedPatient.updatedAt,
      },
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.PATIENT.PATIENT_UPDATED,
      response
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0].message;
      return sendBadRequest(res, firstError);
    }

    console.error('Error updating patient:', error);
    return sendInternalErrorResponse(res);
  }
};

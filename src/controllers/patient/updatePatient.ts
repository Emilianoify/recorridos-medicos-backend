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
import { updatePatientParamsSchema } from '../../utils/validators/schemas/paginationSchemas';

export const updatePatient = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = updatePatientParamsSchema.parse(req.params);
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
        updatedAt: patient.updatedAt,
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

import { Response } from 'express';
import { AuthRequest } from '../../interfaces/auth.interface';
import { ZodError } from 'zod';
import {
  sendBadRequest,
  sendInternalErrorResponse,
  sendSuccessResponse,
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
import { createPatientSchema } from '../../utils/validators/schemas/patientSchemas';
import { IPatient } from '../../interfaces/patient.interface';
import { ProfessionalState } from '../../enums/ProfessionalState';

export const createPatient = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const body = req.body;

    if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
      return sendBadRequest(res, ERROR_MESSAGES.SERVER.EMPTY_BODY);
    }

    const validatedData = createPatientSchema.parse(body);

    // Check if patient already exists with same healthcareId and providerId
    const existingPatient = await PatientModel.findOne({
      where: {
        healthcareId: validatedData.healthcareId,
        healthcareProviderId: validatedData.healthcareProviderId,
      },
      paranoid: false,
    });

    if (existingPatient) {
      return sendConflict(res, ERROR_MESSAGES.PATIENT.HEALTHCARE_ID_IN_USE);
    }

    // Validate related entities exist and are active
    const healthcareProvider = await HealthcareProviderModel.findOne({
      where: { id: validatedData.healthcareProviderId, isActive: true },
    });
    if (!healthcareProvider) {
      return sendBadRequest(
        res,
        ERROR_MESSAGES.PATIENT.INVALID_HEALTHCARE_PROVIDER_ID
      );
    }

    const zone = await ZoneModel.findOne({
      where: { id: validatedData.zoneId, isActive: true },
    });
    if (!zone) {
      return sendBadRequest(res, ERROR_MESSAGES.PATIENT.INVALID_ZONE_ID);
    }

    const frequency = await FrequencyModel.findOne({
      where: { id: validatedData.frequencyId, isActive: true },
    });
    if (!frequency) {
      return sendBadRequest(res, ERROR_MESSAGES.PATIENT.INVALID_FREQUENCY_ID);
    }

    if (validatedData.primaryProfessionalId) {
      const professional = await ProfessionalModel.findOne({
        where: {
          id: validatedData.primaryProfessionalId,
          state: ProfessionalState.ACTIVE,
        },
      });
      if (!professional) {
        return sendBadRequest(
          res,
          ERROR_MESSAGES.PATIENT.INVALID_PROFESSIONAL_ID
        );
      }
    }

    const createdPatientInstance = await PatientModel.create(
      validatedData
    );
    
    const createdPatient: IPatient = createdPatientInstance.toJSON() as IPatient;

    const response = {
      patient: {
        id: createdPatient.id,
        fullName: createdPatient.fullName,
        healthcareId: createdPatient.healthcareId,
        healthcareProviderId: createdPatient.healthcareProviderId,
        address: createdPatient.address,
        locality: createdPatient.locality,
        zoneId: createdPatient.zoneId,
        phone: createdPatient.phone,
        emergencyPhone: createdPatient.emergencyPhone,
        state: createdPatient.state,
        lastAuthorizationDate: createdPatient.lastAuthorizationDate,
        authorizedVisitsPerMonth: createdPatient.authorizedVisitsPerMonth,
        completedVisitsThisMonth: createdPatient.completedVisitsThisMonth,
        frequencyId: createdPatient.frequencyId,
        primaryProfessionalId: createdPatient.primaryProfessionalId,
        lastVisitDate: createdPatient.lastVisitDate,
        nextScheduledVisitDate: createdPatient.nextScheduledVisitDate,
        diagnosis: createdPatient.diagnosis,
        medicalObservations: createdPatient.medicalObservations,
        requiresConfirmation: createdPatient.requiresConfirmation,
        preferredContactMethod: createdPatient.preferredContactMethod,
        isActive: createdPatient.isActive,
        createdAt: createdPatient.createdAt,
        updatedAt: createdPatient.updatedAt,
      },
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.PATIENT.PATIENT_CREATED,
      response
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0].message;
      return sendBadRequest(res, firstError);
    }

    console.error('Error creating patient:', error);
    return sendInternalErrorResponse(res);
  }
};

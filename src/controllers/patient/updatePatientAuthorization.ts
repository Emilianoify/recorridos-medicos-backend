import { Response } from 'express';
import { AuthRequest } from '../../interfaces/auth.interface';
import { ZodError } from 'zod';
import {
  sendBadRequest,
  sendInternalErrorResponse,
  sendSuccessResponse,
  sendNotFound,
} from '../../utils/commons/responseFunctions';
import { PatientModel } from '../../models';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { IPatient } from '../../interfaces/patient.interface';
import { updateAuthorizationSchema } from '../../utils/validators/schemas/paginationSchemas';
import { isValidUUID } from '../../utils/validators/schemas/uuidSchema';

export const updatePatientAuthorization = async (
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
      return sendBadRequest(res, ERROR_MESSAGES.SERVER.EMPTY_BODY);
    }

    const validatedData = updateAuthorizationSchema.parse(body);

    const patientInstance = await PatientModel.findByPk(id);
    if (!patientInstance) {
      return sendNotFound(res, ERROR_MESSAGES.PATIENT.NOT_FOUND);
    }

    const patient: IPatient = patientInstance.toJSON() as IPatient;

    const updateData: Partial<IPatient> = {
      lastAuthorizationDate: new Date(validatedData.lastAuthorizationDate),
      authorizedVisitsPerMonth: validatedData.authorizedVisitsPerMonth,
    };

    // Optionally reset completed visits counter
    if (validatedData.resetCompletedVisits) {
      updateData.completedVisitsThisMonth = 0;
    }

    await PatientModel.update(updateData, { where: { id } });

    const response = {
      patient: {
        id: patient.id,
        fullName: patient.fullName,
        healthcareId: patient.healthcareId,
        lastAuthorizationDate: patient.lastAuthorizationDate,
        authorizedVisitsPerMonth: patient.authorizedVisitsPerMonth,
        completedVisitsThisMonth: patient.completedVisitsThisMonth,
        updatedAt: patient.updatedAt,
      },
      authorizationStatus: {
        remainingVisits:
          patient.authorizedVisitsPerMonth! - patient.completedVisitsThisMonth,
        isAuthorized:
          patient.authorizedVisitsPerMonth! > patient.completedVisitsThisMonth,
        authorizationCurrent:
          new Date(validatedData.lastAuthorizationDate) >
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Within last 30 days
      },
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.PATIENT.AUTHORIZATION_UPDATED,
      response
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0].message;
      return sendBadRequest(res, firstError);
    }

    console.error('Error updating patient authorization:', error);
    return sendInternalErrorResponse(res);
  }
};

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
import { z } from 'zod';
import { IPatient } from '../../interfaces/patient.interface';

const updatePatientAuthorizationParamsSchema = z.object({
  id: z.string().uuid(ERROR_MESSAGES.PATIENT.INVALID_ID),
});

const updateAuthorizationSchema = z.object({
  lastAuthorizationDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, ERROR_MESSAGES.PATIENT.INVALID_DATE_FORMAT),
  authorizedVisitsPerMonth: z
    .number()
    .int()
    .min(0, ERROR_MESSAGES.PATIENT.INVALID_AUTHORIZED_VISITS)
    .max(31, ERROR_MESSAGES.PATIENT.INVALID_AUTHORIZED_VISITS),
  resetCompletedVisits: z.boolean().default(false),
});

export const updatePatientAuthorization = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = updatePatientAuthorizationParamsSchema.parse(req.params);
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

    const updateData: any = {
      lastAuthorizationDate: validatedData.lastAuthorizationDate,
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

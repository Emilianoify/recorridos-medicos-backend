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
import { PatientModel, VisitModel } from '../../models';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { isValidUUID } from '../../utils/validators/schemas/uuidSchema';

export const deletePatient = async (
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

    const patient = await PatientModel.findByPk(id);
    if (!patient) {
      return sendNotFound(res, ERROR_MESSAGES.PATIENT.NOT_FOUND);
    }

    // Check if patient has active visits
    const activeVisits = await VisitModel.count({
      where: { patientId: id, status: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] },
    });

    if (activeVisits > 0) {
      return sendConflict(res, ERROR_MESSAGES.PATIENT.HAS_ACTIVE_VISITS);
    }

    await patient.destroy();

    return sendSuccessResponse(res, SUCCESS_MESSAGES.PATIENT.PATIENT_DELETED);
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0].message;
      return sendBadRequest(res, firstError);
    }

    console.error('Error deleting patient:', error);
    return sendInternalErrorResponse(res);
  }
};
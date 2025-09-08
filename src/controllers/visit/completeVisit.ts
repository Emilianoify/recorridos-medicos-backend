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
  VisitModel,
  PatientModel,
  VisitChangeAuditModel,
} from '../../models';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { completeVisitSchema } from '../../utils/validators/schemas/visitSchemas';
import { IVisit } from '../../interfaces/visit.interface';
import { VisitStatus } from '../../enums/Visits';
import { isValidUUID } from '../../utils/validators/schemas/uuidSchema';

export const completeVisit = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const body = req.body;

    if (!id || !isValidUUID(id)) {
      return sendBadRequest(res, ERROR_MESSAGES.VISIT.INVALID_VISIT_ID);
    }

    if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
      return sendBadRequest(res, ERROR_MESSAGES.SERVER.EMPTY_BODY);
    }

    const validatedData = completeVisitSchema.parse(body);

    // Find the existing visit
    const existingVisit = await VisitModel.findOne({
      where: { id, isActive: true },
      include: [
        {
          model: PatientModel,
          as: 'patient',
          attributes: ['id', 'frequencyId', 'completedVisitsThisMonth'],
        },
      ],
    });

    if (!existingVisit) {
      return sendNotFound(res, ERROR_MESSAGES.VISIT.NOT_FOUND);
    }

    const existingVisitJson = existingVisit.toJSON() as IVisit;

    // Validate visit can be completed
    if (existingVisitJson.status === VisitStatus.COMPLETED) {
      return sendBadRequest(res, ERROR_MESSAGES.VISIT.ALREADY_COMPLETED);
    }

    if (existingVisitJson.status === VisitStatus.CANCELLED) {
      return sendBadRequest(res, ERROR_MESSAGES.VISIT.CANNOT_COMPLETE_CANCELLED);
    }

    const completionData = {
      status: VisitStatus.COMPLETED,
      completedDateTime: new Date(),
      durationMinutes: validatedData.durationMinutes,
      professionalNotes: validatedData.professionalNotes,
      checkOutLocation: validatedData.checkOutLocation,
    };

    // Update the visit
    await VisitModel.update(completionData, {
      where: { id },
    });

    // Create audit trail
    await VisitChangeAuditModel.create({
      visitId: id,
      field: 'status',
      oldValue: existingVisitJson.status,
      newValue: VisitStatus.COMPLETED,
      userId: req.user?.id,
      changeDateTime: new Date(),
      reason: `Visit completed by ${req.user?.username || 'system'}`,
    });

    // Update patient's completed visits counter
    const visitWithPatient = existingVisit.toJSON() as IVisit & { 
      patient?: { 
        id: string; 
        completedVisitsThisMonth?: number; 
      } 
    };
    const patient = visitWithPatient.patient;
    
    if (patient) {
      const newCompletedCount = (patient.completedVisitsThisMonth || 0) + 1;
      await PatientModel.update(
        { 
          completedVisitsThisMonth: newCompletedCount,
          lastVisitDate: new Date(),
        },
        { where: { id: patient.id } }
      );
    }

    // Get the updated visit
    const updatedVisit = await VisitModel.findOne({
      where: { id, isActive: true },
    });

    const updatedVisitJson = updatedVisit!.toJSON() as IVisit;

    const response = {
      visit: {
        id: updatedVisitJson.id,
        patientId: updatedVisitJson.patientId,
        journeyId: updatedVisitJson.journeyId,
        status: updatedVisitJson.status,
        completedDateTime: updatedVisitJson.completedDateTime,
        durationMinutes: updatedVisitJson.durationMinutes,
        professionalNotes: updatedVisitJson.professionalNotes,
        checkOutLocation: updatedVisitJson.checkOutLocation,
        updatedAt: updatedVisitJson.updatedAt,
      },
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.VISIT.VISIT_COMPLETED,
      response
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0].message;
      return sendBadRequest(res, firstError);
    }

    console.error('Error completing visit:', error);
    return sendInternalErrorResponse(res);
  }
};
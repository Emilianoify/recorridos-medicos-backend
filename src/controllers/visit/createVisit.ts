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
  VisitModel,
  PatientModel,
  JourneyModel,
} from '../../models';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { createVisitSchema } from '../../utils/validators/schemas/visitSchemas';
import { IVisit } from '../../interfaces/visit.interface';
import { VisitStatus } from '../../enums/Visits';
import { PatientState } from '../../enums/PatientState';
import { JourneyStatus } from '../../enums/JourneyStatus';

export const createVisit = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const body = req.body;

    if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
      return sendBadRequest(res, ERROR_MESSAGES.SERVER.EMPTY_BODY);
    }

    const validatedData = createVisitSchema.parse(body);

    // Verificar que el paciente existe y está activo
    const patient = await PatientModel.findOne({
      where: { 
        id: validatedData.patientId, 
        state: PatientState.ACTIVE,
        isActive: true 
      },
    });
    if (!patient) {
      return sendBadRequest(res, ERROR_MESSAGES.VISIT.INVALID_PATIENT_ID);
    }

    // Verificar que el recorrido existe y está en estado válido para agregar visitas
    const journey = await JourneyModel.findOne({
      where: { 
        id: validatedData.journeyId,
        status: [JourneyStatus.PLANNED, JourneyStatus.IN_PROGRESS],
        isActive: true 
      },
    });
    if (!journey) {
      return sendBadRequest(res, ERROR_MESSAGES.VISIT.INVALID_JOURNEY_ID);
    }

    // Verificar que no existe una visita duplicada en el mismo recorrido y orden
    const existingVisitByOrder = await VisitModel.findOne({
      where: {
        journeyId: validatedData.journeyId,
        orderInJourney: validatedData.orderInJourney,
        isActive: true,
      },
      paranoid: false,
    });

    if (existingVisitByOrder) {
      return sendConflict(
        res,
        `Ya existe una visita en la posición ${validatedData.orderInJourney} de este recorrido.`
      );
    }

    // Verificar que no hay otra visita activa para el mismo paciente en la misma fecha y hora
    const existingVisitByDateTime = await VisitModel.findOne({
      where: {
        patientId: validatedData.patientId,
        scheduledDateTime: validatedData.scheduledDateTime,
        status: VisitStatus.SCHEDULED,
        isActive: true,
      },
      paranoid: false,
    });

    if (existingVisitByDateTime) {
      return sendConflict(
        res,
        ERROR_MESSAGES.VISIT.VISIT_DUPLICATE
      );
    }

    // Crear la visita
    const visitData = {
      ...validatedData,
      status: VisitStatus.SCHEDULED,
      isActive: true,
    };

    const createdVisitInstance = await VisitModel.create(visitData);
    const createdVisit: IVisit = createdVisitInstance.toJSON() as IVisit;

    // Actualizar la próxima fecha de visita del paciente si es necesario
    const patientScheduledDateTime = new Date(validatedData.scheduledDateTime);
    const patientData = patient.toJSON() as { nextScheduledVisitDate?: Date | null };
    const currentNextVisitDate = patientData.nextScheduledVisitDate ? new Date(patientData.nextScheduledVisitDate) : null;
    
    if (!currentNextVisitDate || patientScheduledDateTime < currentNextVisitDate) {
      await PatientModel.update(
        { nextScheduledVisitDate: patientScheduledDateTime },
        { where: { id: validatedData.patientId } }
      );
    }

    const response = {
      visit: {
        id: createdVisit.id,
        patientId: createdVisit.patientId,
        journeyId: createdVisit.journeyId,
        status: createdVisit.status,
        scheduledDateTime: createdVisit.scheduledDateTime,
        orderInJourney: createdVisit.orderInJourney,
        isActive: createdVisit.isActive,
        createdAt: createdVisit.createdAt,
        updatedAt: createdVisit.updatedAt,
      },
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.VISIT.VISIT_CREATED,
      response
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0].message;
      return sendBadRequest(res, firstError);
    }

    console.error('Error creating visit:', error);
    return sendInternalErrorResponse(res);
  }
};
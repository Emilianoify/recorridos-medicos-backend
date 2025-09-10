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
  VisitModel,
  JourneyModel,
  ProfessionalModel,
  ConfirmationStatusModel,
  RejectionReasonModel,
  NotCompletedReasonModel,
} from '../../models';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { Op } from 'sequelize';
import { IPatient } from '../../interfaces/patient.interface';
import { IVisit } from '../../interfaces/visit.interface';
import { getPatientVisitHistoryQuerySchema } from '../../utils/validators/schemas/paginationSchemas';
import { isValidUUID } from '../../utils/validators/schemas/uuidSchema';

export const getPatientVisitHistory = async (
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

    const { page, limit, status, fromDate, toDate, sortOrder } =
      getPatientVisitHistoryQuerySchema.parse(req.query);

    // Verify patient exists
    const patient = (await PatientModel.findByPk(id, {
      attributes: ['id', 'fullName', 'healthcareId'],
    })) as IPatient | null;

    if (!patient) {
      return sendNotFound(res, ERROR_MESSAGES.PATIENT.NOT_FOUND);
    }

    const whereClause: any = { patientId: id };

    if (status) {
      whereClause.status = status;
    }

    if (fromDate || toDate) {
      whereClause.scheduledDateTime = {};
      if (fromDate) {
        whereClause.scheduledDateTime[Op.gte] = new Date(fromDate);
      }
      if (toDate) {
        whereClause.scheduledDateTime[Op.lte] = new Date(
          `${toDate}T23:59:59.999Z`
        );
      }
    }

    const visitsData = await VisitModel.findAndCountAll({
      where: whereClause,
      limit: limit,
      offset: (page - 1) * limit,
      order: [['scheduledDateTime', sortOrder.toUpperCase()]],
      attributes: { exclude: ['deletedAt'] },
      include: [
        {
          model: JourneyModel,
          as: 'journey',
          attributes: ['id', 'date', 'status'],
          include: [
            {
              model: ProfessionalModel,
              as: 'professional',
              attributes: ['id', 'firstname', 'lastname'],
            },
          ],
        },
        {
          model: ConfirmationStatusModel,
          as: 'confirmationStatus',
          attributes: ['id', 'name', 'description'],
          required: false,
        },
        {
          model: RejectionReasonModel,
          as: 'rejectionReason',
          attributes: ['id', 'name', 'description', 'category'],
          required: false,
        },
        {
          model: NotCompletedReasonModel,
          as: 'notCompletedReason',
          attributes: ['id', 'name', 'description', 'category'],
          required: false,
        },
      ],
    });

    const totalPages = Math.ceil(visitsData.count / limit);

    const response = {
      patient: {
        id: patient.id,
        fullName: patient.fullName,
        healthcareId: patient.healthcareId,
      },
      visits: visitsData.rows.map((visitInstance) => {
        const visit: IVisit = visitInstance.toJSON() as IVisit;
        return {
        id: visit.id,
        status: visit.status,
        scheduledDateTime: visit.scheduledDateTime,
        completedDateTime: visit.completedDateTime,
        durationMinutes: visit.durationMinutes,
        orderInJourney: visit.orderInJourney,
        journey: visit.journey,
        confirmationStatus: visit.confirmationStatus,
        confirmationDateTime: visit.confirmationDateTime,
        confirmationMethod: visit.confirmationMethod,
        rejectionReason: visit.rejectionReason,
        notCompletedReason: visit.notCompletedReason,
        professionalNotes: visit.professionalNotes,
        coordinatorNotes: visit.coordinatorNotes,
        createdAt: visit.createdAt,
      })),
      pagination: {
        total: visitsData.count,
        page: page,
        limit: limit,
        totalPages: totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      filters: {
        status: status || null,
        fromDate: fromDate || null,
        toDate: toDate || null,
      },
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.PATIENT.VISIT_HISTORY_FETCHED,
      response
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0].message;
      return sendBadRequest(res, firstError);
    }
    console.error('Error fetching patient visit history:', error);
    return sendInternalErrorResponse(res);
  }
};

import { Response } from 'express';
import { AuthRequest } from '../../interfaces/auth.interface';
import { ZodError } from 'zod';
import {
  sendBadRequest,
  sendInternalErrorResponse,
  sendSuccessResponse,
  sendNotFound,
} from '../../utils/commons/responseFunctions';
import { PatientModel, FrequencyModel, HolidayModel } from '../../models';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { IPatient } from '../../interfaces/patient.interface';
import { IFrequency } from '../../interfaces/frequency.interface';
import { FrequencyType } from '../../enums/Frequency';
import { calculateNextVisitQuerySchema } from '../../utils/validators/schemas/paginationSchemas';
import { isValidUUID } from '../../utils/validators/schemas/uuidSchema';

// Helper function to add business days
const addBusinessDays = (
  date: Date,
  days: number,
  allowWeekends: boolean = false
): Date => {
  const result = new Date(date);
  let addedDays = 0;

  while (addedDays < days) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();

    // Skip weekends if not allowed
    if (!allowWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
      continue;
    }

    addedDays++;
  }

  return result;
};

// Helper function to check if date is a holiday
const isHoliday = async (date: Date): Promise<boolean> => {
  const holiday = await HolidayModel.findOne({
    where: {
      date: date.toISOString().split('T')[0],
      isActive: true,
    },
  });
  return !!holiday;
};

// Helper function to find next valid visit date
const findNextValidDate = async (
  baseDate: Date,
  frequency: IFrequency
): Promise<Date> => {
  let candidateDate = new Date(baseDate);

  // Keep checking dates until we find a valid one
  while (true) {
    const dayOfWeek = candidateDate.getDay();

    // Check weekends
    if (!frequency.allowWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
      candidateDate.setDate(candidateDate.getDate() + 1);
      continue;
    }

    // Check holidays
    if (!frequency.allowHolidays && (await isHoliday(candidateDate))) {
      candidateDate.setDate(candidateDate.getDate() + 1);
      continue;
    }

    // If we get here, the date is valid
    break;
  }

  return candidateDate;
};

export const calculateNextVisit = async (
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

    const { fromDate, updatePatient } = calculateNextVisitQuerySchema.parse(req.query);

    const patientInstance = await PatientModel.findByPk(id, {
      include: [
        {
          model: FrequencyModel,
          as: 'frequency',
          attributes: [
            'id',
            'name',
            'frequencyType',
            'daysBetweenVisits',
            'visitsPerMonth',
            'intervalValue',
            'intervalUnit',
            'allowWeekends',
            'allowHolidays',
            'nextDateCalculationRule',
          ],
        },
      ],
    });

    if (!patientInstance) {
      return sendNotFound(res, ERROR_MESSAGES.PATIENT.NOT_FOUND);
    }

    const patient: IPatient = patientInstance.toJSON() as IPatient;

    const frequency = patient.frequency;
    if (!frequency) {
      return sendBadRequest(res, ERROR_MESSAGES.PATIENT.INVALID_FREQUENCY_ID);
    }

    // Determine base date for calculation
    let baseDate: Date;
    if (fromDate) {
      baseDate = new Date(fromDate);
    } else if (patient.lastVisitDate) {
      baseDate = new Date(patient.lastVisitDate);
    } else {
      baseDate = new Date(); // Today
    }

    let nextVisitDate: Date;

    // Calculate next visit based on frequency type
    switch (frequency.frequencyType) {
      case 'SIMPLE':
        if (frequency.daysBetweenVisits) {
          if (frequency.allowWeekends) {
            nextVisitDate = new Date(baseDate);
            nextVisitDate.setDate(
              nextVisitDate.getDate() + frequency.daysBetweenVisits
            );
          } else {
            nextVisitDate = addBusinessDays(
              baseDate,
              frequency.daysBetweenVisits,
              frequency.allowWeekends
            );
          }
        } else if (frequency.intervalValue && frequency.intervalUnit) {
          nextVisitDate = new Date(baseDate);
          switch (frequency.intervalUnit) {
            case 'DAYS':
              nextVisitDate.setDate(
                nextVisitDate.getDate() + frequency.intervalValue
              );
              break;
            case 'WEEKS':
              nextVisitDate.setDate(
                nextVisitDate.getDate() + frequency.intervalValue * 7
              );
              break;
            case 'MONTHS':
              nextVisitDate.setMonth(
                nextVisitDate.getMonth() + frequency.intervalValue
              );
              break;
            default:
              nextVisitDate.setDate(
                nextVisitDate.getDate() + frequency.intervalValue
              );
          }
        } else {
          // Default to 7 days if no specific interval
          nextVisitDate = addBusinessDays(baseDate, 7, frequency.allowWeekends);
        }
        break;

      case FrequencyType.WEEKLY:
        // For weekly, add 7 days
        nextVisitDate = new Date(baseDate);
        nextVisitDate.setDate(nextVisitDate.getDate() + 7);
        break;

      case FrequencyType.MONTHLY:
        // For monthly, add 1 month
        nextVisitDate = new Date(baseDate);
        nextVisitDate.setMonth(nextVisitDate.getMonth() + 1);
        break;

      default:
        // Default case: 7 days
        nextVisitDate = addBusinessDays(baseDate, 7, frequency.allowWeekends);
    }

    // Apply business rules to find valid date
    nextVisitDate = await findNextValidDate(nextVisitDate, frequency);

    // Update patient record if requested
    if (updatePatient) {
      await PatientModel.update(
        { nextScheduledVisitDate: nextVisitDate.toISOString().split('T')[0] },
        {
          where: { id },
          returning: true,
        }
      );
    }

    const response = {
      patient: {
        id: patient.id,
        fullName: patient.fullName,
        lastVisitDate: patient.lastVisitDate,
        currentNextScheduledVisitDate: patient.nextScheduledVisitDate,
      },
      calculation: {
        baseDate: baseDate.toISOString().split('T')[0],
        calculatedNextVisitDate: nextVisitDate.toISOString().split('T')[0],
        frequency: {
          name: frequency.name,
          type: frequency.frequencyType,
          daysBetween: frequency.daysBetweenVisits,
          allowWeekends: frequency.allowWeekends,
          allowHolidays: frequency.allowHolidays,
        },
        updated: updatePatient,
      },
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.PATIENT.NEXT_VISIT_CALCULATED,
      response
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0].message;
      return sendBadRequest(res, firstError);
    }

    console.error('Error calculating next visit:', error);
    return sendInternalErrorResponse(res);
  }
};

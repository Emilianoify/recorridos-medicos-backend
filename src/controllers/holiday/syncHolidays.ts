import { Response } from 'express';
import { AuthRequest } from '../../interfaces/auth.interface';
import { ZodError } from 'zod';
import {
  sendBadRequest,
  sendInternalErrorResponse,
  sendSuccessResponse,
} from '../../utils/commons/responseFunctions';
import { HolidayModel } from '../../models';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { IHoliday } from '../../interfaces/holiday.interface';
import { z } from 'zod';

// Schema for sync holidays request
const syncHolidaysSchema = z.object({
  year: z
    .number()
    .int()
    .min(2020, ERROR_MESSAGES.HOLIDAY.INVALID_YEAR)
    .max(2030, ERROR_MESSAGES.HOLIDAY.INVALID_YEAR),
  country: z.string().optional().default('AR'),
  overwriteExisting: z.boolean().optional().default(false),
});

export const syncHolidays = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const body = req.body;

    if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
      return sendBadRequest(res, ERROR_MESSAGES.SERVER.EMPTY_BODY);
    }

    const validatedData = syncHolidaysSchema.parse(body);
    const { year, country, overwriteExisting } = validatedData;

    // Mock national holidays for Argentina (in a real implementation, this would come from an external API)
    const nationalHolidays = [
      {
        name: 'A�o Nuevo',
        date: `${year}-01-01`,
        description: 'Celebraci�n del A�o Nuevo',
        isNational: true,
        isRecurring: true,
      },
      {
        name: 'D�a del Trabajador',
        date: `${year}-05-01`,
        description: 'D�a Internacional del Trabajador',
        isNational: true,
        isRecurring: true,
      },
      {
        name: 'D�a de la Independencia',
        date: `${year}-07-09`,
        description: 'Declaraci�n de la Independencia Argentina',
        isNational: true,
        isRecurring: true,
      },
      {
        name: 'D�a de la Inmaculada Concepci�n',
        date: `${year}-12-08`,
        description: 'Festividad religiosa cat�lica',
        isNational: true,
        isRecurring: true,
      },
      {
        name: 'Navidad',
        date: `${year}-12-25`,
        description: 'Celebraci�n del nacimiento de Jesucristo',
        isNational: true,
        isRecurring: true,
      },
    ];

    const syncResults = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      holidays: [] as IHoliday[],
    };

    for (const holidayData of nationalHolidays) {
      try {
        const existingHoliday = await HolidayModel.findOne({
          where: { date: holidayData.date },
          paranoid: false,
        });

        if (existingHoliday) {
          if (overwriteExisting) {
            await HolidayModel.update(
              {
                name: holidayData.name,
                description: holidayData.description,
                isNational: holidayData.isNational,
                isRecurring: holidayData.isRecurring,
                isActive: true,
                deletedAt: '', // Restore if soft deleted
              },
              { where: { id: existingHoliday.id }, paranoid: false }
            );

            const updatedHolidayInstance = await HolidayModel.findByPk(
              existingHoliday.id
            );
            if (updatedHolidayInstance) {
              const updatedHoliday: IHoliday = updatedHolidayInstance.toJSON() as IHoliday;
              syncResults.holidays.push(updatedHoliday);
              syncResults.updated++;
            }
          } else {
            syncResults.skipped++;
          }
        } else {
          const newHolidayInstance = await HolidayModel.create({
            name: holidayData.name,
            date: holidayData.date,
            description: holidayData.description,
            isNational: holidayData.isNational,
            isRecurring: holidayData.isRecurring,
            affectsScheduling: true,
            isActive: true,
          });

          const newHoliday: IHoliday = newHolidayInstance.toJSON() as IHoliday;
          syncResults.holidays.push(newHoliday);
          syncResults.created++;
        }
      } catch (holidayError) {
        console.error(`Error syncing holiday ${holidayData.name}:`, holidayError);
        syncResults.errors++;
      }
    }

    const response = {
      year: year,
      country: country,
      syncResults: {
        total: nationalHolidays.length,
        created: syncResults.created,
        updated: syncResults.updated,
        skipped: syncResults.skipped,
        errors: syncResults.errors,
      },
      holidays: syncResults.holidays.map(holiday => ({
        id: holiday.id,
        name: holiday.name,
        date: holiday.date,
        description: holiday.description,
        isNational: holiday.isNational,
        isRecurring: holiday.isRecurring,
        affectsScheduling: holiday.affectsScheduling,
        isActive: holiday.isActive,
        dayOfWeek: new Date(holiday.date).toLocaleDateString('es-AR', {
          weekday: 'long',
        }),
        createdAt: holiday.createdAt,
        updatedAt: holiday.updatedAt,
      })),
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.HOLIDAY.HOLIDAYS_SYNCED,
      response
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0].message;
      return sendBadRequest(res, firstError);
    }

    console.error('Error syncing holidays:', error);
    return sendInternalErrorResponse(res);
  }
};
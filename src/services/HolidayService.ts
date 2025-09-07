import {
  IHoliday,
  IHolidayApiResponse,
  IHolidaySyncResult,
  ICompanyHolidaySettings,
  WorkingDayCheck,
} from '../interfaces/holiday.interface';
import { HolidayModel } from '../models';
import { HolidayType, HolidaySource, Country } from '../enums/Holiday';

export class HolidayService {
  private static readonly ARGENTINA_API_URL =
    'https://date.nager.at/api/v3/publicholidays';

  /**
   * Sincroniza feriados nacionales de Argentina desde API externa
   */
  async syncNationalHolidays(year: number): Promise<IHolidaySyncResult> {
    const result: IHolidaySyncResult = {
      year,
      totalFound: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [],
      syncDate: new Date(),
    };

    try {
      // Llamar a la API
      const response = await fetch(
        `${HolidayService.ARGENTINA_API_URL}/${year}/AR`
      );

      if (!response.ok) {
        throw new Error(
          `API response: ${response.status} ${response.statusText}`
        );
      }

      const holidays: IHolidayApiResponse[] = await response.json();
      result.totalFound = holidays.length;

      // Procesar cada feriado
      for (const apiHoliday of holidays) {
        try {
          // Solo procesar feriados nacionales (global: true)
          if (!apiHoliday.global) {
            result.skipped++;
            continue;
          }

          const holidayDate = new Date(apiHoliday.date);

          // Verificar si ya existe
          const existingHoliday = (await HolidayModel.findOne({
            where: {
              date: holidayDate,
              country: Country.ARGENTINA,
              name: apiHoliday.localName,
            },
          })) as IHoliday | null;

          if (existingHoliday) {
            // Actualizar información si viene de API
            if (existingHoliday.source === HolidaySource.API) {
              await HolidayModel.update(
                {
                  description: apiHoliday.name,
                  isRecurring: apiHoliday.fixed,
                  recurringDay: apiHoliday.fixed ? holidayDate.getDate() : null,
                  recurringMonth: apiHoliday.fixed
                    ? holidayDate.getMonth() + 1
                    : null,
                  externalId: `${apiHoliday.countryCode}-${apiHoliday.date}`,
                  lastSyncDate: new Date(),
                },
                {
                  where: { id: existingHoliday.id },
                }
              );
              result.updated++;
            } else {
              result.skipped++;
            }
          } else {
            // Crear nuevo feriado
            await HolidayModel.create({
              date: holidayDate,
              name: apiHoliday.localName,
              description: apiHoliday.name,
              country: Country.ARGENTINA,
              type: HolidayType.NATIONAL,
              source: HolidaySource.API,
              isRecurring: apiHoliday.fixed,
              recurringDay: apiHoliday.fixed ? holidayDate.getDate() : null,
              recurringMonth: apiHoliday.fixed
                ? holidayDate.getMonth() + 1
                : null,
              allowWork: false, // Por defecto no se trabaja en feriados
              externalId: `${apiHoliday.countryCode}-${apiHoliday.date}`,
              lastSyncDate: new Date(),
              isActive: true,
            });
            result.created++;
          }
        } catch (error: any) {
          result.errors.push(
            `Error procesando ${apiHoliday.localName}: ${error.message}`
          );
        }
      }
    } catch (error: any) {
      result.errors.push(`Error en sincronización: ${error.message}`);
    }

    return result;
  }

  /**
   * Verifica si una fecha es día laborable
   */
  async isWorkingDay(
    date: Date,
    settings?: ICompanyHolidaySettings
  ): Promise<WorkingDayCheck> {
    const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const dayOfWeek = date.getDay(); // 0=Sunday, 6=Saturday

    // Verificar fin de semana
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return {
        date,
        isWorkingDay: false,
        reason: 'Fin de semana',
      };
    }

    // Buscar si es feriado
    const holiday = (await HolidayModel.findOne({
      where: {
        date: date,
        country: Country.ARGENTINA,
        isActive: true,
      },
    })) as IHoliday | null;

    if (!holiday) {
      // Verificar días custom no laborables
      if (settings?.customNonWorkingDays?.includes(dateString)) {
        return {
          date,
          isWorkingDay: false,
          reason: 'Día no laboral personalizado',
        };
      }

      return {
        date,
        isWorkingDay: true,
      };
    }

    // Es feriado, aplicar reglas empresariales
    let isWorkingDay = false;

    // 1. Si la empresa permite trabajar en feriados por defecto
    if (settings?.allowWorkOnHolidays) {
      isWorkingDay = true;
    }

    // 2. Si el feriado específico permite trabajo
    if (holiday.allowWork) {
      isWorkingDay = true;
    }

    // 3. Si está en la lista de feriados donde SÍ se trabaja
    if (settings?.customWorkingHolidays?.includes(dateString)) {
      isWorkingDay = true;
    }

    // 4. Si está en la lista de días donde NO se trabaja (override)
    if (settings?.customNonWorkingDays?.includes(dateString)) {
      isWorkingDay = false;
    }

    return {
      date,
      isWorkingDay,
      holiday,
      reason: isWorkingDay ? undefined : `Feriado: ${holiday.name}`,
    };
  }

  /**
   * Obtiene el próximo día hábil desde una fecha
   */
  async getNextWorkingDay(
    fromDate: Date,
    settings?: ICompanyHolidaySettings
  ): Promise<Date> {
    let nextDate = new Date(fromDate);
    nextDate.setDate(nextDate.getDate() + 1);

    let attempts = 0;
    while (attempts < 14) {
      // Máximo 2 semanas de búsqueda
      const check = await this.isWorkingDay(nextDate, settings);
      if (check.isWorkingDay) {
        return nextDate;
      }
      nextDate.setDate(nextDate.getDate() + 1);
      attempts++;
    }

    // Fallback: devolver la fecha + 1 día
    return new Date(fromDate.getTime() + 24 * 60 * 60 * 1000);
  }

  /**
   * Genera feriados recurrentes para un año
   */
  async generateRecurringHolidays(year: number): Promise<number> {
    const recurringHolidaysInstances = await HolidayModel.findAll({
      where: {
        isRecurring: true,
        isActive: true,
      },
    });
    
    const recurringHolidays: IHoliday[] = recurringHolidaysInstances.map(instance => 
      instance.toJSON() as IHoliday
    );

    let created = 0;

    for (const holiday of recurringHolidays) {
      if (!holiday.recurringMonth || !holiday.recurringDay) continue;

      const newDate = new Date(
        year,
        holiday.recurringMonth - 1,
        holiday.recurringDay
      );

      // Verificar si ya existe
      const exists = await HolidayModel.findOne({
        where: {
          date: newDate,
          name: holiday.name,
          country: holiday.country,
        },
      });

      if (!exists) {
        await HolidayModel.create({
          date: newDate,
          name: holiday.name,
          description: holiday.description,
          country: holiday.country,
          type: holiday.type,
          source: HolidaySource.API,
          isRecurring: true,
          recurringDay: holiday.recurringDay,
          recurringMonth: holiday.recurringMonth,
          allowWork: holiday.allowWork,
          isActive: true,
        });
        created++;
      }
    }

    return created;
  }
}

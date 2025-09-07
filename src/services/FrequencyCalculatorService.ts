import { IFrequency } from '../interfaces/frequency.interface';
import { ICompanyHolidaySettings } from '../interfaces/holiday.interface';
import { HolidayService } from './HolidayService';
import {
  NextDateCalculationRule,
  FrequencyType,
  FrequencyInterval,
  WeekDay,
} from '../enums/Frequency';

export interface INextVisitCalculation {
  nextVisitDate: Date;
  calculationMethod: NextDateCalculationRule;
  frequencyApplied: IFrequency;
  businessDayAdjustment?: boolean;
  holidayAdjustment?: boolean;
  adjustmentDetails?: string;
  possibleTimes?: string[]; // Para m�ltiples visitas por d�a
  metadata?: any;
}

export interface IFrequencyValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
}

export interface IVisitScheduleOptions {
  respectBusinessHours?: boolean;
  allowWeekends?: boolean;
  allowHolidays?: boolean;
  customHolidaySettings?: ICompanyHolidaySettings;
  preferredTimeSlots?: string[]; // ['08:00', '14:00', '20:00']
  excludeDates?: Date[];
  maxLookAheadDays?: number;
  timeZone?: string;
}

export class FrequencyCalculatorService {
  private static holidayService = new HolidayService();

  /**
   * Calcula la pr�xima fecha de visita basada en frecuencia y reglas
   */
  static async calculateNextVisitDate(
    frequency: IFrequency,
    lastVisitDate: Date,
    options: IVisitScheduleOptions = {}
  ): Promise<INextVisitCalculation> {
    const defaultOptions: IVisitScheduleOptions = {
      respectBusinessHours: frequency.respectBusinessHours,
      allowWeekends: frequency.allowWeekends,
      allowHolidays: frequency.allowHolidays,
      maxLookAheadDays: 90,
      timeZone: 'America/Argentina/Buenos_Aires',
      ...options,
    };

    let nextDate = new Date(lastVisitDate);
    let possibleTimes: string[] = [];
    let adjustmentDetails = '';
    let businessDayAdjustment = false;
    let holidayAdjustment = false;

    // Aplicar l�gica seg�n tipo de frecuencia
    switch (frequency.frequencyType) {
      case FrequencyType.SIMPLE:
        nextDate = await this.calculateSimpleFrequency(
          frequency,
          lastVisitDate
        );
        break;

      case FrequencyType.HOURLY:
        const hourlyResult = await this.calculateHourlyFrequency(
          frequency,
          lastVisitDate,
          defaultOptions
        );
        nextDate = hourlyResult.nextDate;
        possibleTimes = hourlyResult.possibleTimes;
        break;

      case FrequencyType.DAILY_MULTIPLE:
        const dailyResult = await this.calculateDailyMultipleFrequency(
          frequency,
          lastVisitDate,
          defaultOptions
        );
        nextDate = dailyResult.nextDate;
        possibleTimes = dailyResult.possibleTimes;
        break;

      case FrequencyType.WEEKLY_PATTERN:
        nextDate = await this.calculateWeeklyPatternFrequency(
          frequency,
          lastVisitDate
        );
        break;

      case FrequencyType.CUSTOM:
        const customResult = await this.calculateCustomFrequency(
          frequency,
          lastVisitDate,
          defaultOptions
        );
        nextDate = customResult.nextDate;
        possibleTimes = customResult.possibleTimes;
        break;

      default:
        throw new Error(
          `Tipo de frecuencia no soportado: ${frequency.frequencyType}`
        );
    }

    // Aplicar reglas de c�lculo de fecha
    const finalResult = await this.applyNextDateCalculationRule(
      frequency.nextDateCalculationRule,
      nextDate,
      defaultOptions
    );

    nextDate = finalResult.adjustedDate;
    businessDayAdjustment = finalResult.businessDayAdjustment;
    holidayAdjustment = finalResult.holidayAdjustment;
    adjustmentDetails = finalResult.adjustmentDetails;

    return {
      nextVisitDate: nextDate,
      calculationMethod: frequency.nextDateCalculationRule,
      frequencyApplied: frequency,
      businessDayAdjustment,
      holidayAdjustment,
      adjustmentDetails,
      possibleTimes,
      metadata: {
        originalCalculatedDate: new Date(lastVisitDate),
        frequencyType: frequency.frequencyType,
        optionsUsed: defaultOptions,
      },
    };
  }

  /**
   * Calcula frecuencias simples (d�as entre visitas, visitas por mes)
   */
  private static async calculateSimpleFrequency(
    frequency: IFrequency,
    lastVisitDate: Date
  ): Promise<Date> {
    const nextDate = new Date(lastVisitDate);

    if (frequency.daysBetweenVisits) {
      nextDate.setDate(nextDate.getDate() + frequency.daysBetweenVisits);
    } else if (frequency.visitsPerMonth) {
      // Calcular d�as promedio entre visitas
      const daysInMonth = 30; // Promedio
      const daysBetween = Math.round(daysInMonth / frequency.visitsPerMonth);
      nextDate.setDate(nextDate.getDate() + daysBetween);
    } else if (frequency.intervalValue && frequency.intervalUnit) {
      switch (frequency.intervalUnit) {
        case FrequencyInterval.HOURS:
          nextDate.setHours(nextDate.getHours() + frequency.intervalValue);
          break;
        case FrequencyInterval.DAYS:
          nextDate.setDate(nextDate.getDate() + frequency.intervalValue);
          break;
        case FrequencyInterval.WEEKS:
          nextDate.setDate(nextDate.getDate() + frequency.intervalValue * 7);
          break;
        case FrequencyInterval.MONTHS:
          nextDate.setMonth(nextDate.getMonth() + frequency.intervalValue);
          break;
      }
    }

    return nextDate;
  }

  /**
   * Calcula frecuencias por horas (ej: cada 8 horas)
   */
  private static async calculateHourlyFrequency(
    frequency: IFrequency,
    lastVisitDate: Date,
    _options: IVisitScheduleOptions
  ): Promise<{ nextDate: Date; possibleTimes: string[] }> {
    const nextDate = new Date(lastVisitDate);
    const possibleTimes: string[] = [];

    if (frequency.customSchedule?.scheduleType === 'FIXED_HOURS') {
      // Horarios fijos (ej: 8:00, 16:00, 00:00)
      const fixedTimes = frequency.customSchedule.fixedTimes || [];
      const currentHour = lastVisitDate.getHours();
      const currentMinute = lastVisitDate.getMinutes();

      // Encontrar el pr�ximo horario
      let nextTimeFound = false;
      for (const timeStr of fixedTimes) {
        const [hour, minute] = timeStr.split(':').map(Number);
        if (
          hour > currentHour ||
          (hour === currentHour && minute > currentMinute)
        ) {
          nextDate.setHours(hour, minute, 0, 0);
          nextTimeFound = true;
          break;
        }
      }

      // Si no se encontr� en el mismo d�a, ir al primer horario del d�a siguiente
      if (!nextTimeFound && fixedTimes.length > 0) {
        nextDate.setDate(nextDate.getDate() + 1);
        const [hour, minute] = fixedTimes[0].split(':').map(Number);
        nextDate.setHours(hour, minute, 0, 0);
      }

      possibleTimes.push(...fixedTimes);
    } else if (frequency.intervalValue) {
      // Intervalo por horas
      nextDate.setHours(nextDate.getHours() + frequency.intervalValue);
    }

    return { nextDate, possibleTimes };
  }

  /**
   * Calcula m�ltiples visitas por d�a
   */
  private static async calculateDailyMultipleFrequency(
    frequency: IFrequency,
    lastVisitDate: Date,
    _options: IVisitScheduleOptions
  ): Promise<{ nextDate: Date; possibleTimes: string[] }> {
    const nextDate = new Date(lastVisitDate);
    const possibleTimes: string[] = [];

    if (frequency.visitsPerDay && frequency.visitsPerDay > 1) {
      const hoursInDay = 24;
      const interval = Math.floor(hoursInDay / frequency.visitsPerDay);

      // Generar horarios posibles
      for (let i = 0; i < frequency.visitsPerDay; i++) {
        const hour = i * interval;
        possibleTimes.push(`${hour.toString().padStart(2, '0')}:00`);
      }

      // Si hay configuraci�n personalizada, usarla
      if (frequency.customSchedule?.fixedTimes) {
        possibleTimes.length = 0;
        possibleTimes.push(...frequency.customSchedule.fixedTimes);
      }

      // Calcular pr�ximo horario basado en la �ltima visita
      const currentHour = lastVisitDate.getHours();
      const nextTimeSlot = possibleTimes.find(time => {
        const hour = parseInt(time.split(':')[0]);
        return hour > currentHour;
      });

      if (nextTimeSlot) {
        const [hour, minute] = nextTimeSlot.split(':').map(Number);
        nextDate.setHours(hour, minute, 0, 0);
      } else {
        // Pasar al primer horario del d�a siguiente
        nextDate.setDate(nextDate.getDate() + 1);
        const [hour, minute] = possibleTimes[0].split(':').map(Number);
        nextDate.setHours(hour, minute, 0, 0);
      }
    }

    return { nextDate, possibleTimes };
  }

  /**
   * Calcula patrones semanales (ej: L-M-V)
   */
  private static async calculateWeeklyPatternFrequency(
    frequency: IFrequency,
    lastVisitDate: Date
  ): Promise<Date> {
    const nextDate = new Date(lastVisitDate);
    const weeklyPattern = frequency.weeklyPattern || [];

    if (weeklyPattern.length === 0) {
      // Sin patr�n espec�fico, avanzar 1 d�a
      nextDate.setDate(nextDate.getDate() + 1);
      return nextDate;
    }

    const currentDayOfWeek = lastVisitDate.getDay();
    let nextDayFound = false;

    // Buscar el pr�ximo d�a en el patr�n
    for (const day of weeklyPattern) {
      if (day > currentDayOfWeek) {
        const daysToAdd = day - currentDayOfWeek;
        nextDate.setDate(nextDate.getDate() + daysToAdd);
        nextDayFound = true;
        break;
      }
    }

    // Si no se encontr� en esta semana, ir al primer d�a de la pr�xima semana
    if (!nextDayFound) {
      const firstDay = Math.min(...weeklyPattern);
      const daysToAdd = 7 - currentDayOfWeek + firstDay;
      nextDate.setDate(nextDate.getDate() + daysToAdd);
    }

    return nextDate;
  }

  /**
   * Calcula frecuencias personalizadas
   */
  private static async calculateCustomFrequency(
    frequency: IFrequency,
    lastVisitDate: Date,
    _options: IVisitScheduleOptions
  ): Promise<{ nextDate: Date; possibleTimes: string[] }> {
    const nextDate = new Date(lastVisitDate);
    let possibleTimes: string[] = [];

    // Implementar l�gica personalizada basada en customSchedule
    if (frequency.customSchedule) {
      const schedule = frequency.customSchedule;

      switch (schedule.scheduleType) {
        case 'SPECIFIC_TIMES':
          if (schedule.fixedTimes) {
            possibleTimes = schedule.fixedTimes;
            // L�gica similar a horarios fijos
            const currentTime = `${lastVisitDate.getHours().toString().padStart(2, '0')}:${lastVisitDate.getMinutes().toString().padStart(2, '0')}`;
            const nextTime = schedule.fixedTimes.find(
              time => time > currentTime
            );

            if (nextTime) {
              const [hour, minute] = nextTime.split(':').map(Number);
              nextDate.setHours(hour, minute, 0, 0);
            } else {
              // Siguiente d�a, primer horario
              nextDate.setDate(nextDate.getDate() + 1);
              if (schedule.fixedTimes.length > 0) {
                const [hour, minute] = schedule.fixedTimes[0]
                  .split(':')
                  .map(Number);
                nextDate.setHours(hour, minute, 0, 0);
              }
            }
          }
          break;

        case 'FLEXIBLE_INTERVALS':
          if (schedule.startTime && schedule.intervalHours) {
            const [startHour, startMinute] = schedule.startTime
              .split(':')
              .map(Number);
            const lastHour = lastVisitDate.getHours();
            const lastMinute = lastVisitDate.getMinutes();

            // Calcular pr�ximo intervalo
            const nextHour = lastHour + schedule.intervalHours;
            if (nextHour < 24) {
              nextDate.setHours(nextHour, lastMinute, 0, 0);
            } else {
              // Siguiente d�a
              nextDate.setDate(nextDate.getDate() + 1);
              nextDate.setHours(startHour, startMinute, 0, 0);
            }
          }
          break;

        default:
          // Fallback: agregar 1 d�a
          nextDate.setDate(nextDate.getDate() + 1);
          break;
      }
    }

    return { nextDate, possibleTimes };
  }

  /**
   * Aplica reglas de c�lculo de fechas (d�as h�biles, feriados, etc.)
   */
  private static async applyNextDateCalculationRule(
    rule: NextDateCalculationRule,
    calculatedDate: Date,
    options: IVisitScheduleOptions
  ): Promise<{
    adjustedDate: Date;
    businessDayAdjustment: boolean;
    holidayAdjustment: boolean;
    adjustmentDetails: string;
  }> {
    let adjustedDate = new Date(calculatedDate);
    let businessDayAdjustment = false;
    let holidayAdjustment = false;
    let adjustmentDetails = '';

    switch (rule) {
      case NextDateCalculationRule.EXACT_DAYS:
        // Sin ajustes, mantener fecha exacta
        adjustmentDetails = 'Fecha exacta sin ajustes';
        break;

      case NextDateCalculationRule.NEXT_BUSINESS_DAY:
        const workingDayCheck = await this.holidayService.isWorkingDay(
          adjustedDate,
          options.customHolidaySettings
        );

        if (!workingDayCheck.isWorkingDay) {
          adjustedDate = await this.holidayService.getNextWorkingDay(
            adjustedDate,
            options.customHolidaySettings
          );
          businessDayAdjustment = true;
          adjustmentDetails = `Ajustado a pr�ximo d�a h�bil: ${workingDayCheck.reason}`;
        }
        break;

      case NextDateCalculationRule.SAME_DAY_NEXT_MONTH:
        const currentDay = calculatedDate.getDate();
        adjustedDate.setMonth(adjustedDate.getMonth() + 1);
        adjustedDate.setDate(currentDay);

        // Verificar si el d�a existe en el mes (ej: 31 de febrero)
        if (adjustedDate.getDate() !== currentDay) {
          adjustedDate.setDate(0); // �ltimo d�a del mes anterior
          adjustmentDetails =
            'Ajustado al �ltimo d�a del mes (d�a inexistente)';
        } else {
          adjustmentDetails = 'Mismo d�a del mes siguiente';
        }
        break;

      case NextDateCalculationRule.SMART_FREQUENCY:
        // L�gica inteligente: evitar fines de semana y feriados
        let attempts = 0;
        const maxAttempts = 14;

        while (attempts < maxAttempts) {
          const dayCheck = await this.holidayService.isWorkingDay(
            adjustedDate,
            options.customHolidaySettings
          );

          if (dayCheck.isWorkingDay) {
            break;
          }

          adjustedDate.setDate(adjustedDate.getDate() + 1);
          businessDayAdjustment = true;
          attempts++;
        }

        if (businessDayAdjustment) {
          adjustmentDetails = `Ajuste inteligente: ${attempts} d�as adelantados`;
        } else {
          adjustmentDetails = 'Sin ajustes necesarios';
        }
        break;

      default:
        adjustmentDetails = 'Regla de c�lculo no implementada';
        break;
    }

    return {
      adjustedDate,
      businessDayAdjustment,
      holidayAdjustment,
      adjustmentDetails,
    };
  }

  /**
   * Valida la configuraci�n de una frecuencia
   */
  static validateFrequencyConfiguration(
    frequency: IFrequency
  ): IFrequencyValidation {
    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Validaciones b�sicas
    if (!frequency.name || frequency.name.trim().length < 2) {
      errors.push(
        'El nombre de la frecuencia es requerido (m�nimo 2 caracteres)'
      );
    }

    if (!frequency.frequencyType) {
      errors.push('El tipo de frecuencia es requerido');
    }

    // Validaciones espec�ficas por tipo
    switch (frequency.frequencyType) {
      case FrequencyType.SIMPLE:
        if (
          !frequency.daysBetweenVisits &&
          !frequency.visitsPerMonth &&
          !frequency.intervalValue
        ) {
          errors.push(
            'Frecuencia simple requiere: d�as entre visitas, visitas por mes, o valor de intervalo'
          );
        }

        if (frequency.daysBetweenVisits && frequency.daysBetweenVisits > 365) {
          warnings.push(
            'D�as entre visitas muy elevado (>365), considerar frecuencia mensual'
          );
        }
        break;

      case FrequencyType.HOURLY:
        if (!frequency.intervalValue || !frequency.customSchedule) {
          errors.push(
            'Frecuencia por horas requiere valor de intervalo y horarios configurados'
          );
        }

        if (frequency.intervalValue && frequency.intervalValue < 1) {
          errors.push('El intervalo por horas debe ser mayor a 0');
        }
        break;

      case FrequencyType.DAILY_MULTIPLE:
        if (!frequency.visitsPerDay || frequency.visitsPerDay < 2) {
          errors.push(
            'Frecuencia m�ltiple por d�a requiere al menos 2 visitas por d�a'
          );
        }

        if (frequency.visitsPerDay && frequency.visitsPerDay > 24) {
          errors.push('No se pueden tener m�s de 24 visitas por d�a');
        }
        break;

      case FrequencyType.WEEKLY_PATTERN:
        if (!frequency.weeklyPattern || frequency.weeklyPattern.length === 0) {
          errors.push('Patr�n semanal requiere al menos un d�a configurado');
        }

        if (frequency.weeklyPattern && frequency.weeklyPattern.length > 7) {
          warnings.push(
            'Patr�n semanal con todos los d�as es equivalente a diario'
          );
        }
        break;

      case FrequencyType.CUSTOM:
        if (!frequency.customSchedule) {
          errors.push(
            'Frecuencia personalizada requiere configuraci�n de horario personalizado'
          );
        }
        break;
    }

    // Recomendaciones generales
    if (!frequency.respectBusinessHours && frequency.allowWeekends) {
      recommendations.push(
        'Considerar respetar horarios laborales para mejor experiencia del paciente'
      );
    }

    if (frequency.allowHolidays) {
      warnings.push(
        'Permitir visitas en feriados puede afectar la disponibilidad de profesionales'
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      recommendations,
    };
  }

  /**
   * Calcula todas las pr�ximas fechas para un rango de tiempo
   */
  static async calculateVisitSchedule(
    frequency: IFrequency,
    startDate: Date,
    endDate: Date,
    options: IVisitScheduleOptions = {}
  ): Promise<Date[]> {
    const schedule: Date[] = [];
    let currentDate = new Date(startDate);
    const maxDate = new Date(endDate);
    let iterations = 0;
    const maxIterations = 1000; // Prevenir loops infinitos

    while (currentDate <= maxDate && iterations < maxIterations) {
      const nextVisit = await this.calculateNextVisitDate(
        frequency,
        currentDate,
        options
      );

      if (nextVisit.nextVisitDate <= maxDate) {
        schedule.push(new Date(nextVisit.nextVisitDate));
        currentDate = nextVisit.nextVisitDate;
      } else {
        break;
      }

      iterations++;
    }

    return schedule;
  }

  /**
   * Verifica si una fecha es v�lida para una frecuencia espec�fica
   */
  static async isValidVisitDate(
    frequency: IFrequency,
    proposedDate: Date,
    lastVisitDate?: Date,
    options: IVisitScheduleOptions = {}
  ): Promise<{ isValid: boolean; reason?: string }> {
    // Verificar d�a h�bil si es requerido
    if (frequency.respectBusinessHours && !options.allowWeekends) {
      const workingDayCheck = await this.holidayService.isWorkingDay(
        proposedDate,
        options.customHolidaySettings
      );

      if (!workingDayCheck.isWorkingDay) {
        return {
          isValid: false,
          reason: `Fecha no v�lida: ${workingDayCheck.reason}`,
        };
      }
    }

    // Verificar patr�n semanal si aplica
    if (
      frequency.frequencyType === FrequencyType.WEEKLY_PATTERN &&
      frequency.weeklyPattern
    ) {
      const dayOfWeek = proposedDate.getDay();
      if (!frequency.weeklyPattern.includes(dayOfWeek as WeekDay)) {
        return {
          isValid: false,
          reason: 'La fecha no coincide con el patr�n semanal configurado',
        };
      }
    }

    // Verificar intervalos m�nimos si hay fecha anterior
    if (lastVisitDate && frequency.daysBetweenVisits) {
      const daysDifference = Math.floor(
        (proposedDate.getTime() - lastVisitDate.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      if (daysDifference < frequency.daysBetweenVisits) {
        return {
          isValid: false,
          reason: `La fecha es muy temprana. Requiere al menos ${frequency.daysBetweenVisits} d�as desde la �ltima visita`,
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Obtiene estad�sticas de una frecuencia
   */
  static calculateFrequencyStats(frequency: IFrequency): {
    estimatedVisitsPerMonth: number;
    estimatedVisitsPerYear: number;
    averageDaysBetween: number;
    complexity: 'LOW' | 'MEDIUM' | 'HIGH';
  } {
    let estimatedVisitsPerMonth = 0;
    let averageDaysBetween = 0;
    let complexity: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';

    switch (frequency.frequencyType) {
      case FrequencyType.SIMPLE:
        if (frequency.daysBetweenVisits) {
          averageDaysBetween = frequency.daysBetweenVisits;
          estimatedVisitsPerMonth = Math.round(
            30 / frequency.daysBetweenVisits
          );
        } else if (frequency.visitsPerMonth) {
          estimatedVisitsPerMonth = frequency.visitsPerMonth;
          averageDaysBetween = Math.round(30 / frequency.visitsPerMonth);
        }
        complexity = 'LOW';
        break;

      case FrequencyType.HOURLY:
        if (frequency.intervalValue) {
          const visitsPerDay = Math.floor(24 / frequency.intervalValue);
          estimatedVisitsPerMonth = visitsPerDay * 30;
          averageDaysBetween = 1;
        }
        complexity = 'HIGH';
        break;

      case FrequencyType.DAILY_MULTIPLE:
        if (frequency.visitsPerDay) {
          estimatedVisitsPerMonth = frequency.visitsPerDay * 30;
          averageDaysBetween = 1;
        }
        complexity = 'HIGH';
        break;

      case FrequencyType.WEEKLY_PATTERN:
        if (frequency.weeklyPattern) {
          const visitsPerWeek = frequency.weeklyPattern.length;
          estimatedVisitsPerMonth = Math.round((visitsPerWeek * 30) / 7);
          averageDaysBetween = Math.round(7 / visitsPerWeek);
        }
        complexity = 'MEDIUM';
        break;

      case FrequencyType.CUSTOM:
        // Estimaci�n conservadora
        estimatedVisitsPerMonth = 4;
        averageDaysBetween = 7;
        complexity = 'HIGH';
        break;
    }

    return {
      estimatedVisitsPerMonth,
      estimatedVisitsPerYear: estimatedVisitsPerMonth * 12,
      averageDaysBetween,
      complexity,
    };
  }
}

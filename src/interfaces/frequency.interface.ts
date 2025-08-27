import {
  NextDateCalculationRule,
  FrequencyType,
  FrequencyInterval,
  WeekDay,
} from '../enums/Frequency';

export interface IFrequency {
  id: string;
  name: string;
  description?: string | null;

  // Configuración básica
  frequencyType: FrequencyType;
  nextDateCalculationRule: NextDateCalculationRule;

  // Para frecuencias simples
  daysBetweenVisits?: number | null;
  visitsPerMonth?: number | null;

  // Para frecuencias complejas
  intervalValue?: number | null;
  intervalUnit?: FrequencyInterval | null;
  visitsPerDay?: number | null;
  weeklyPattern?: WeekDay[] | null;
  customSchedule?: ICustomSchedule | null;

  // Configuraciones adicionales
  respectBusinessHours: boolean;
  allowWeekends: boolean;
  allowHolidays: boolean;

  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

// Para horarios personalizados complejos
export interface ICustomSchedule {
  scheduleType: 'FIXED_HOURS' | 'FLEXIBLE_INTERVALS' | 'SPECIFIC_TIMES';

  // Para horarios fijos (ej: 8:00, 16:00, 00:00)
  fixedTimes?: string[]; // ['08:00', '16:00', '00:00']

  // Para intervalos flexibles (ej: cada 8 horas desde las 8:00)
  startTime?: string; // '08:00'
  intervalHours?: number; // 8

  // Para días específicos
  specificDays?: WeekDay[];

  // Para casos muy complejos
  customRules?: string; // JSON string con reglas personalizadas
}

// Tipos auxiliares para casos de uso comunes
export interface IFrequencyExample {
  // Enfermería prestacional: cada 8 horas
  nursing8h: {
    frequencyType: FrequencyType.HOURLY;
    intervalValue: 8;
    intervalUnit: FrequencyInterval.HOURS;
    visitsPerDay: 3;
    customSchedule: {
      scheduleType: 'FIXED_HOURS';
      fixedTimes: ['08:00', '16:00', '00:00'];
    };
  };

  // Kinesiología: 2 veces por día
  kinesiology2x: {
    frequencyType: FrequencyType.DAILY_MULTIPLE;
    visitsPerDay: 2;
    customSchedule: {
      scheduleType: 'FLEXIBLE_INTERVALS';
      startTime: '09:00';
      intervalHours: 8;
    };
  };

  // Patrón semanal: Lunes-Miércoles-Viernes
  weeklyLMV: {
    frequencyType: FrequencyType.WEEKLY_PATTERN;
    weeklyPattern: [WeekDay.MONDAY, WeekDay.WEDNESDAY, WeekDay.FRIDAY];
  };
}

export interface FrequencyData {
  name: string;
  description: string;
  frequencyType: FrequencyType;
  nextDateCalculationRule: NextDateCalculationRule;
  daysBetweenVisits?: number | null;
  visitsPerMonth?: number | null;
  intervalValue?: number | null;
  intervalUnit?: FrequencyInterval | null;
  visitsPerDay?: number | null;
  weeklyPattern?: WeekDay[] | null;
  customSchedule?: any;
  respectBusinessHours?: boolean;
  allowWeekends?: boolean;
  allowHolidays?: boolean;
}

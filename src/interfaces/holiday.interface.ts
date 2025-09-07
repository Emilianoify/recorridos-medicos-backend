import { HolidayType, HolidaySource, Country } from '../enums/Holiday';

export interface IHoliday {
  id: string;

  // Información básica
  date: Date;
  name: string;
  description?: string | null;

  // Clasificación
  country: Country;
  type: HolidayType;
  source: HolidaySource;

  // Recurrencia
  isRecurring: boolean;
  recurringDay?: number | null;
  recurringMonth?: number | null;

  // Control empresarial
  allowWork: boolean;

  // Información adicional
  externalId?: string | null;
  lastSyncDate?: Date | null;
  isNational?: boolean | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

// Para creación de feriados
export interface IHolidayData {
  date: Date;
  name: string;
  description?: string;
  country?: Country;
  type?: HolidayType;
  source?: HolidaySource;
  isRecurring?: boolean;
  recurringDay?: number;
  recurringMonth?: number;
  allowWork?: boolean;
  externalId?: string;
}

// Para respuesta de API externa (Argentina)
export interface IHolidayApiResponse {
  date: string; // "2024-12-25"
  localName: string; // "Navidad"
  name: string; // "Christmas Day"
  countryCode: string; // "AR"
  fixed: boolean; // true para fechas fijas como Navidad
  global: boolean; // true para feriados nacionales
  counties?: string[]; // null para feriados nacionales
  types: string[]; // ["Public"]
}

// Para configuración de empresa
export interface ICompanyHolidaySettings {
  allowWorkOnHolidays: boolean; // ¿Trabajar en feriados por defecto?
  customWorkingHolidays: string[]; // Feriados donde SÍ se trabaja ["2024-12-25"]
  customNonWorkingDays: string[]; // Días custom que NO se trabaja ["2024-12-24", "2024-12-31"]
  autoSyncEnabled: boolean; // ¿Sincronizar automáticamente?
  lastSyncYear: number; // Último año sincronizado
}

// Para búsquedas y filtros
export interface IHolidayFilters {
  country?: Country;
  type?: HolidayType | HolidayType[];
  source?: HolidaySource;
  allowWork?: boolean;
  isRecurring?: boolean;
  year?: number;
  month?: number;
  dateFrom?: Date;
  dateTo?: Date;
  isActive?: boolean;
}

// Para estadísticas de feriados
export interface IHolidayStats {
  totalHolidays: number;
  holidaysByType: { [type: string]: number };
  holidaysByMonth: { [month: string]: number };
  workingHolidays: number;
  nonWorkingHolidays: number;
  recurringHolidays: number;
  customHolidays: number;
  nextHoliday?: IHoliday;
  upcomingHolidays: IHoliday[];
}

// Para servicio de sincronización
export interface IHolidaySyncResult {
  year: number;
  totalFound: number;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
  syncDate: Date;
}

// Tipos auxiliares
export type WorkingDayCheck = {
  date: Date;
  isWorkingDay: boolean;
  holiday?: IHoliday;
  reason?: string;
};

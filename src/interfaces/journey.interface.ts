import { JourneyStatus } from '../enums/JourneyStatus';
import { IHoliday } from './holiday.interface';
import { IProfessional } from './professional.interface';
import { IVisit } from './visit.interface';
import { IZone } from './zone.interface';

export interface IJourney {
  id: string;

  // Asignación básica
  professionalId: string;
  date: Date;
  zoneId: string;

  // Estado
  status: JourneyStatus;

  // Horarios planificados
  plannedStartTime?: string | null;
  plannedEndTime?: string | null;

  // Horarios reales
  actualStartTime?: string | null;
  actualEndTime?: string | null;

  // Información del recorrido
  estimatedVisits?: number | null;
  completedVisits: number;
  totalTravelDistance?: number | null;
  observations?: string | null;

  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;

  professional?: IProfessional;
  zone?: IZone;
}

// Para creación de recorridos
export interface IJourneyData {
  professionalId: string;
  date: Date;
  zoneId: string;
  status?: JourneyStatus;
  plannedStartTime?: string;
  plannedEndTime?: string;
  estimatedVisits?: number;
  observations?: string;
}

export interface IJourneyUpdateData {
  status?: JourneyStatus;
  actualStartTime?: string;
  actualEndTime?: string;
  completedVisits?: number;
  totalTravelDistance?: number;
  observations?: string;
}

// Para búsquedas y filtros
export interface IJourneyFilters {
  professionalId?: string | string[];
  zoneId?: string | string[];
  status?: JourneyStatus | JourneyStatus[];
  date?: Date;
  dateFrom?: Date;
  dateTo?: Date;
  isActive?: boolean;
}

// Para estadísticas de recorridos
export interface IJourneyStats {
  totalJourneys: number;
  plannedJourneys: number;
  inProgressJourneys: number;
  completedJourneys: number;
  cancelledJourneys: number;
  averageVisitsPerJourney: number;
  averageDurationHours: number;
  journeysByProfessional: { [professionalId: string]: number };
  journeysByZone: { [zoneId: string]: number };
}

// Para reporting de productividad
export interface IJourneyProductivity {
  professionalId: string;
  date: Date;
  plannedHours: number;
  actualHours: number;
  estimatedVisits: number;
  completedVisits: number;
  efficiency: number;
  punctuality: number;
}

// Interfaces para optimización de rutas
export interface IOptimalRouteResult {
  optimizedOrder: string[];
  totalDistance: number;
  estimatedTravelTime: number;
  routeSegments: Array<{
    from: string;
    to: string;
    distance: number;
    estimatedTime: number;
  }>;
}

// Tipos auxiliares
export type JourneyTimeString = string; // 'HH:MM:SS' format

export interface IJourneyWithVisits extends IJourney {
  visits?: IVisit[];
}

export interface IDaySchedule {
  date: string;
  dayOfWeek: string;
  journeys: IJourneyWithVisits[];
  totalVisits: number;
  completedVisits: number;
  isHoliday: boolean;
  holiday: IHoliday | null;
}

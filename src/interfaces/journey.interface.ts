import { JourneyStatus } from '../enums/JourneyStatus';
import { IProfessional } from './professional.interface';
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

// Where clause interfaces for database queries
export interface IJourneyWhereClause {
  date: string;
  professionalId?: string;
  zoneId?: string;
  status?: string;
  isActive: boolean;
}

export interface IJourneyProfessionalWhereClause {
  professionalId: string;
  zoneId?: string;
  status?: string;
  isActive: boolean;
  date?: {
    [key: string]: string; // For Op.gte, Op.lte
  };
}

export interface IJourneyGeneralWhereClause {
  professionalId?: string;
  zoneId?: string;
  status?: string;
  isActive?: boolean;
  date?: {
    [key: string]: string; // For Op.gte, Op.lte
  };
}

// Tipos auxiliares
export type JourneyTimeString = string; // 'HH:MM:SS' format

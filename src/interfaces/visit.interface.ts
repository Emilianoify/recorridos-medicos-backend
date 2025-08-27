import { VisitStatus, ConfirmationMethod } from '../enums/Visits';
import { IPatient } from './patient.interface';
import { IJourney } from './journey.interface';
import { IUser } from './user.interface';
import {
  IConfirmationStatus,
  IRejectionReason,
  INotCompletedReason,
} from './auxiliaryTables.interface';

export interface IVisit {
  id: string;

  // Relaciones principales
  patientId: string;
  journeyId: string;

  // Información básica
  status: VisitStatus;
  scheduledDateTime: Date;
  orderInJourney: number;

  // Confirmación
  confirmationStatusId?: string | null;
  confirmationDateTime?: Date | null;
  confirmationMethod?: ConfirmationMethod | null;
  confirmedByUserId?: string | null;

  // Realización
  completedDateTime?: Date | null;
  durationMinutes?: number | null;

  // Motivos
  rejectionReasonId?: string | null;
  notCompletedReasonId?: string | null;

  // Reprogramación
  rescheduledFromVisitId?: string | null;
  rescheduledToVisitId?: string | null;

  // Geolocalización (futuro)
  checkInLocation?: IGeoLocation | null;
  checkOutLocation?: IGeoLocation | null;

  // Observaciones
  professionalNotes?: string | null;
  coordinatorNotes?: string | null;

  // Auditoría
  cancelledByUserId?: string | null;
  cancelledDateTime?: Date | null;

  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;

  // Relaciones (cuando se incluyen en las consultas)
  patient?: IPatient;
  journey?: IJourney;
  confirmationStatus?: IConfirmationStatus;
  rejectionReason?: IRejectionReason;
  notCompletedReason?: INotCompletedReason;
  confirmedByUser?: IUser;
  cancelledByUser?: IUser;
  rescheduledFromVisit?: IVisit;
  rescheduledToVisit?: IVisit;
}

// Para creación de visitas
export interface IVisitData {
  patientId: string;
  journeyId: string;
  scheduledDateTime: Date;
  orderInJourney: number;
  status?: VisitStatus;
  professionalNotes?: string;
  coordinatorNotes?: string;
}

// Para actualización de visitas
export interface IVisitUpdateData {
  status?: VisitStatus;
  completedDateTime?: Date;
  durationMinutes?: number;
  professionalNotes?: string;
  coordinatorNotes?: string;
  checkInLocation?: IGeoLocation;
  checkOutLocation?: IGeoLocation;
}

// Para confirmación de visitas
export interface IVisitConfirmationData {
  confirmationStatusId: string;
  confirmationDateTime: Date;
  confirmationMethod: ConfirmationMethod;
  confirmedByUserId: string;
  rejectionReasonId?: string;
}

// Para cancelación/reprogramación
export interface IVisitCancellationData {
  status: VisitStatus.CANCELLED | VisitStatus.RESCHEDULED;
  cancelledByUserId: string;
  cancelledDateTime: Date;
  rejectionReasonId?: string;
  notCompletedReasonId?: string;
  coordinatorNotes?: string;
  rescheduledToVisitId?: string;
}

// Para geolocalización
export interface IGeoLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp: Date;
  address?: string;
}

// Para búsquedas y filtros
export interface IVisitFilters {
  patientId?: string | string[];
  journeyId?: string | string[];
  status?: VisitStatus | VisitStatus[];
  confirmationStatusId?: string | string[];
  scheduledDate?: Date;
  scheduledDateFrom?: Date;
  scheduledDateTo?: Date;
  professionalId?: string;
  zoneId?: string;
  requiresConfirmation?: boolean;
  isOverdue?: boolean;
  hasLocation?: boolean;
  searchText?: string;
}

// Para estadísticas de visitas
export interface IVisitStats {
  totalVisits: number;
  scheduledVisits: number;
  completedVisits: number;
  cancelledVisits: number;
  rescheduledVisits: number;
  notPresentVisits: number;
  pendingConfirmation: number;
  confirmedVisits: number;
  rejectedVisits: number;
  averageDurationMinutes: number;
  completionRate: number;
  confirmationRate: number;
  visitsByStatus: { [status: string]: number };
  visitsByRejectionReason: { [reasonId: string]: number };
  visitsByNotCompletedReason: { [reasonId: string]: number };
}

// Para reportes de productividad
export interface IVisitProductivityReport {
  date: Date;
  professionalId: string;
  journeyId: string;
  plannedVisits: number;
  completedVisits: number;
  efficiency: number;
  averageDuration: number;
  totalTravelTime: number;
  visitsByStatus: { [status: string]: number };
}

// Tipos auxiliares
export interface VisitStatusTransition {
  from: VisitStatus;
  to: VisitStatus;
  allowedBy: 'PROFESSIONAL' | 'COORDINATOR' | 'SYSTEM';
  requiresReason?: boolean;
}

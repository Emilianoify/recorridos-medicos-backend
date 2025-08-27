import { PatientState } from '../enums/PatientState';
import { IZone } from './zone.interface';
import { IFrequency } from './frequency.interface';
import { IProfessional } from './professional.interface';
import { IHealthcareProvider } from './healthcareProvider.interface';
import { ContactMethod } from '../enums/ContactMethod';

export interface IPatient {
  id: string;

  // Información personal
  fullName: string;
  healthcareId: string;
  healthcareProviderId: string;

  // Ubicación
  address: string;
  locality: string;
  zoneId: string;
  phone?: string | null;
  emergencyPhone?: string | null;

  // Estado del paciente
  state: PatientState;

  // Autorización y límites
  lastAuthorizationDate?: Date | null;
  authorizedVisitsPerMonth?: number | null;
  completedVisitsThisMonth: number;

  // Frecuencia y profesional
  frequencyId: string;
  primaryProfessionalId?: string | null;

  // Fechas importantes
  lastVisitDate?: Date | null;
  nextScheduledVisitDate?: Date | null;

  // Información médica
  diagnosis?: string | null;
  medicalObservations?: string | null;

  // Configuraciones
  requiresConfirmation: boolean;
  preferredContactMethod?: string | null;

  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;

  // Relaciones (cuando se incluyen en las consultas)
  zone?: IZone;
  frequency?: IFrequency;
  primaryProfessional?: IProfessional;
  healthcareProvider?: IHealthcareProvider;
}

// Para creación de pacientes
export interface IPatientData {
  fullName: string;
  healthcareId: string;
  healthcareProviderId: string;
  address: string;
  locality: string;
  zoneId: string;
  phone?: string;
  emergencyPhone?: string;
  state?: PatientState;
  lastAuthorizationDate?: Date;
  authorizedVisitsPerMonth?: number;
  frequencyId: string;
  primaryProfessionalId?: string;
  diagnosis?: string;
  medicalObservations?: string;
  requiresConfirmation?: boolean;
  preferredContactMethod?: ContactMethod;
}

// Para búsquedas y filtros
export interface IPatientFilters {
  state?: PatientState | PatientState[];
  zoneId?: string | string[];
  frequencyId?: string;
  primaryProfessionalId?: string;
  healthcareProviderId?: string;
  locality?: string;
  requiresConfirmation?: boolean;
  hasUpcomingVisit?: boolean;
  authorizationExpired?: boolean;
  visitLimitExceeded?: boolean;
  searchText?: string; // Para buscar por nombre o healthcareId
}

// Para estadísticas y reportes
export interface IPatientStats {
  totalPatients: number;
  activePatients: number;
  inactivePatients: number;
  hospitalizedPatients: number;
  noAuthorizationPatients: number;
  patientsByZone: { [zoneId: string]: number };
  patientsByFrequency: { [frequencyId: string]: number };
  upcomingVisits: number;
  overdueVisits: number;
}

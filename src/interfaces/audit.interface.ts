import { AuditAction, AuditEntity, ChangeReason } from '../enums/Audit';
import { IUser } from './user.interface';

export interface IVisitChangeAudit {
  id: string;

  // Identificación del cambio
  entityType: AuditEntity;
  entityId: string;
  action: AuditAction;

  // Información del cambio
  fieldName?: string | null;
  oldValue?: string | null;
  newValue?: string | null;

  // Contexto
  changeReason: ChangeReason;
  changeDescription?: string | null;

  // Auditoría
  userId?: string | null;
  userAgent?: string | null;
  ipAddress?: string | null;

  // Información adicional
  relatedEntityType?: AuditEntity | null;
  relatedEntityId?: string | null;
  metadata?: any | null;

  // Timestamp
  changeDateTime: Date;

  isActive: boolean;

  // Relaciones (cuando se incluyen)
  user?: IUser;
}

// Para creación de registros de auditoría
export interface IVisitChangeAuditData {
  entityType: AuditEntity;
  entityId: string;
  action: AuditAction;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  changeReason: ChangeReason;
  changeDescription?: string;
  userId?: string;
  userAgent?: string;
  ipAddress?: string;
  relatedEntityType?: AuditEntity;
  relatedEntityId?: string;
  metadata?: any;
}

// Para cambios múltiples en una sola operación
export interface IBulkAuditData {
  entityType: AuditEntity;
  entityId: string;
  action: AuditAction;
  changes: IFieldChange[];
  changeReason: ChangeReason;
  changeDescription?: string;
  userId?: string;
  userAgent?: string;
  ipAddress?: string;
  relatedEntityType?: AuditEntity;
  relatedEntityId?: string;
  metadata?: any;
}

export interface IFieldChange {
  fieldName: string;
  oldValue?: string;
  newValue?: string;
}

// Para búsquedas y filtros
export interface IAuditFilters {
  entityType?: AuditEntity | AuditEntity[];
  entityId?: string | string[];
  action?: AuditAction | AuditAction[];
  userId?: string | string[];
  changeReason?: ChangeReason | ChangeReason[];
  fieldName?: string | string[];
  dateFrom?: Date;
  dateTo?: Date;
  relatedEntityType?: AuditEntity;
  relatedEntityId?: string;
  searchText?: string; // Buscar en changeDescription
}

// Para estadísticas de auditoría
export interface IAuditStats {
  totalChanges: number;
  changesByAction: { [action: string]: number };
  changesByReason: { [reason: string]: number };
  changesByUser: { [userId: string]: number };
  changesByEntity: { [entityType: string]: number };
  mostChangedEntities: {
    entityId: string;
    entityType: string;
    changeCount: number;
  }[];
  changesByTimeframe: { [date: string]: number };
}

// Para reportes de actividad
export interface IUserActivityReport {
  userId: string;
  userName: string;
  totalChanges: number;
  actionBreakdown: { [action: string]: number };
  reasonBreakdown: { [reason: string]: number };
  entityBreakdown: { [entityType: string]: number };
  lastActivity: Date;
  mostActiveDay: string;
  averageChangesPerDay: number;
}

// Para seguimiento de entidades específicas
export interface IEntityAuditTrail {
  entityType: AuditEntity;
  entityId: string;
  entityName?: string; // Nombre del paciente, profesional, etc.
  totalChanges: number;
  createdAt: Date;
  lastModified: Date;
  changes: IVisitChangeAudit[];
  summary: {
    createdBy?: string;
    lastModifiedBy?: string;
    majorChanges: number; // Cambios importantes (status, cancelaciones, etc.)
    minorChanges: number; // Cambios menores (notas, horarios, etc.)
  };
}

// Para compliance y reportes regulatorios
export interface IComplianceAuditReport {
  reportPeriod: {
    from: Date;
    to: Date;
  };
  totalEntities: number;
  entitiesWithChanges: number;
  totalChanges: number;
  criticalChanges: number; // Cancelaciones, eliminaciones, etc.
  unauthorizedChanges: number; // Cambios sin usuario identificado
  changesByCompliance: {
    compliant: number;
    flagged: number;
    requiresReview: number;
  };
  topChangers: IUserActivityReport[];
  flaggedActivities: IVisitChangeAudit[];
}

// Tipos auxiliares para helpers de auditoría
export type AuditContext = {
  userId?: string;
  userAgent?: string;
  ipAddress?: string;
  reason?: ChangeReason;
  description?: string;
};

export type EntitySnapshot = {
  entityType: AuditEntity;
  entityId: string;
  beforeState: any;
  afterState: any;
  changes: IFieldChange[];
};

import {
  IVisitChangeAuditData,
  IBulkAuditData,
  IFieldChange,
  AuditContext,
  EntitySnapshot,
} from '../interfaces/audit.interface';
import { VisitChangeAuditModel } from '../models';
import { AuditAction, AuditEntity, ChangeReason } from '../enums/Audit';

export class AuditService {
  /**
   * Registra un cambio simple en auditoría
   */
  static async logChange(data: IVisitChangeAuditData): Promise<void> {
    try {
      await VisitChangeAuditModel.create({
        entityType: data.entityType,
        entityId: data.entityId,
        action: data.action,
        fieldName: data.fieldName,
        oldValue: data.oldValue,
        newValue: data.newValue,
        changeReason: data.changeReason,
        changeDescription: data.changeDescription,
        userId: data.userId,
        userAgent: data.userAgent,
        ipAddress: data.ipAddress,
        relatedEntityType: data.relatedEntityType,
        relatedEntityId: data.relatedEntityId,
        metadata: data.metadata,
        changeDateTime: new Date(),
        isActive: true,
      });
    } catch (error) {
      console.error('Error registrando cambio en auditoría:', error);
      // No fallar la operación principal por error de auditoría
    }
  }

  /**
   * Registra múltiples cambios en una sola operación
   */
  static async logBulkChanges(data: IBulkAuditData): Promise<void> {
    try {
      const auditRecords = data.changes.map(change => ({
        entityType: data.entityType,
        entityId: data.entityId,
        action: data.action,
        fieldName: change.fieldName,
        oldValue: change.oldValue,
        newValue: change.newValue,
        changeReason: data.changeReason,
        changeDescription: data.changeDescription,
        userId: data.userId,
        userAgent: data.userAgent,
        ipAddress: data.ipAddress,
        relatedEntityType: data.relatedEntityType,
        relatedEntityId: data.relatedEntityId,
        metadata: data.metadata,
        changeDateTime: new Date(),
        isActive: true,
      }));

      await VisitChangeAuditModel.bulkCreate(auditRecords);
    } catch (error) {
      console.error('Error registrando cambios en lote en auditoría:', error);
    }
  }

  /**
   * Registra la creación de una entidad
   */
  static async logCreation(
    entityType: AuditEntity,
    entityId: string,
    entityData: any,
    context?: AuditContext
  ): Promise<void> {
    await this.logChange({
      entityType,
      entityId,
      action: AuditAction.CREATE,
      newValue: JSON.stringify(entityData),
      changeReason: context?.reason || ChangeReason.USER_REQUEST,
      changeDescription: context?.description || `${entityType} creado`,
      userId: context?.userId,
      userAgent: context?.userAgent,
      ipAddress: context?.ipAddress,
    });
  }

  /**
   * Registra la eliminación de una entidad
   */
  static async logDeletion(
    entityType: AuditEntity,
    entityId: string,
    entityData: any,
    context?: AuditContext
  ): Promise<void> {
    await this.logChange({
      entityType,
      entityId,
      action: AuditAction.DELETE,
      oldValue: JSON.stringify(entityData),
      changeReason: context?.reason || ChangeReason.USER_REQUEST,
      changeDescription: context?.description || `${entityType} eliminado`,
      userId: context?.userId,
      userAgent: context?.userAgent,
      ipAddress: context?.ipAddress,
    });
  }

  /**
   * Compara dos estados de una entidad y registra los cambios
   */
  static async logEntityUpdate(
    snapshot: EntitySnapshot,
    context?: AuditContext
  ): Promise<void> {
    if (snapshot.changes.length === 0) return;

    await this.logBulkChanges({
      entityType: snapshot.entityType,
      entityId: snapshot.entityId,
      action: AuditAction.UPDATE,
      changes: snapshot.changes,
      changeReason: context?.reason || ChangeReason.USER_REQUEST,
      changeDescription:
        context?.description || `${snapshot.entityType} actualizado`,
      userId: context?.userId,
      userAgent: context?.userAgent,
      ipAddress: context?.ipAddress,
      metadata: {
        beforeState: JSON.stringify(snapshot.beforeState),
        afterState: JSON.stringify(snapshot.afterState),
      },
    });
  }

  /**
   * Helper para comparar dos objetos y extraer cambios
   */
  static compareEntities(
    before: any,
    after: any,
    excludeFields: string[] = []
  ): IFieldChange[] {
    const changes: IFieldChange[] = [];
    const fieldsToExclude = [
      'updatedAt',
      'createdAt',
      'deletedAt',
      ...excludeFields,
    ];

    // Campos que cambiaron
    Object.keys(after).forEach(key => {
      if (fieldsToExclude.includes(key)) return;

      const oldValue = before[key];
      const newValue = after[key];

      // Comparar valores (handling null/undefined)
      if (this.valuesAreDifferent(oldValue, newValue)) {
        changes.push({
          fieldName: key,
          oldValue: this.serializeValue(oldValue),
          newValue: this.serializeValue(newValue),
        });
      }
    });

    return changes;
  }

  /**
   * Registra acciones específicas de visitas
   */
  static async logVisitAction(
    action: AuditAction,
    visitId: string,
    patientId: string,
    context?: AuditContext & { additionalInfo?: any }
  ): Promise<void> {
    let description = '';
    let reason = context?.reason || ChangeReason.USER_REQUEST;

    switch (action) {
      case AuditAction.CONFIRM:
        description = 'Visita confirmada por el paciente';
        reason = ChangeReason.PATIENT_REQUEST;
        break;
      case AuditAction.CANCEL:
        description = 'Visita cancelada';
        break;
      case AuditAction.RESCHEDULE:
        description = 'Visita reprogramada';
        break;
      case AuditAction.COMPLETE:
        description = 'Visita completada por el profesional';
        break;
      default:
        description = `Acción ${action} realizada en visita`;
    }

    await this.logChange({
      entityType: AuditEntity.VISIT,
      entityId: visitId,
      action,
      changeReason: reason,
      changeDescription: context?.description || description,
      userId: context?.userId,
      userAgent: context?.userAgent,
      ipAddress: context?.ipAddress,
      relatedEntityType: AuditEntity.PATIENT,
      relatedEntityId: patientId,
      metadata: context?.additionalInfo,
    });
  }

  /**
   * Registra acciones de recorridos
   */
  static async logJourneyAction(
    action: AuditAction,
    journeyId: string,
    professionalId: string,
    context?: AuditContext & { additionalInfo?: any }
  ): Promise<void> {
    let description = '';

    switch (action) {
      case AuditAction.START_JOURNEY:
        description = 'Recorrido iniciado por el profesional';
        break;
      case AuditAction.END_JOURNEY:
        description = 'Recorrido finalizado por el profesional';
        break;
      default:
        description = `Acción ${action} realizada en recorrido`;
    }

    await this.logChange({
      entityType: AuditEntity.JOURNEY,
      entityId: journeyId,
      action,
      changeReason: context?.reason || ChangeReason.USER_REQUEST,
      changeDescription: context?.description || description,
      userId: context?.userId,
      userAgent: context?.userAgent,
      ipAddress: context?.ipAddress,
      relatedEntityType: AuditEntity.PROFESSIONAL,
      relatedEntityId: professionalId,
      metadata: context?.additionalInfo,
    });
  }

  // ===== HELPERS PRIVADOS =====

  private static valuesAreDifferent(oldValue: any, newValue: any): boolean {
    // Handle null/undefined
    if (oldValue == null && newValue == null) return false;
    if (oldValue == null || newValue == null) return true;

    // Handle dates
    if (oldValue instanceof Date && newValue instanceof Date) {
      return oldValue.getTime() !== newValue.getTime();
    }

    // Handle objects/arrays
    if (typeof oldValue === 'object' && typeof newValue === 'object') {
      return JSON.stringify(oldValue) !== JSON.stringify(newValue);
    }

    return oldValue !== newValue;
  }

  private static serializeValue(value: any): string {
    if (value == null) return 'null';
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }
}

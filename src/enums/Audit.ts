export enum AuditAction {
  CREATE = 'creado',
  UPDATE = 'actualizado',
  DELETE = 'eliminado',
  RESTORE = 'restaurado',
  CONFIRM = 'confirmado',
  CANCEL = 'cancelado',
  RESCHEDULE = 'reprogramado',
  COMPLETE = 'completado',
  START_JOURNEY = 'inicio_recorrido',
  END_JOURNEY = 'fin_recorrido',
}

export enum AuditEntity {
  VISIT = 'visita',
  JOURNEY = 'recorrido',
  PATIENT = 'paciente',
  PROFESSIONAL = 'profesional',
  USER = 'usuario',
}

export enum ChangeReason {
  USER_REQUEST = 'solicitud_usuario',
  PATIENT_REQUEST = 'solicitud_paciente',
  SYSTEM_AUTOMATIC = 'sistema_automatico',
  COORDINATOR_DECISION = 'decision_coordinador',
  PROFESSIONAL_ISSUE = 'problema_profesional',
  EMERGENCY = 'emergencia',
  DATA_CORRECTION = 'correccion_datos',
  BUSINESS_RULE = 'regla_negocio',
}

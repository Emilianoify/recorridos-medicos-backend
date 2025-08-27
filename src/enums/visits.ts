export enum VisitStatus {
  SCHEDULED = 'planificada',
  COMPLETED = 'realizada',
  NOT_PRESENT = 'no_presente',
  CANCELLED = 'cancelada',
  RESCHEDULED = 'reprogramada',
}

export enum ConfirmationStatus {
  PENDING = 'pendiente',
  CONFIRMED = 'confirmada',
  REJECTED = 'rechazada',
  NO_RESPONSE = 'sin_respuesta',
}

export enum ConfirmationMethod {
  PHONE = 'llamada_telefonica',
  WHATSAPP = 'whatsapp',
  EMAIL = 'email',
  SMS = 'mensajes_de_texto',
  IN_PERSON = 'presencial',
}

// Para los motivos cuando no se realiza la visita
export enum NotCompletedReasonType {
  PATIENT_NOT_FOUND = 'paciente_no_encontrado',
  PATIENT_HOSPITALIZED = 'paciente_internado',
  PATIENT_TRAVELING = 'paciente_de_viaje',
  ADDRESS_NOT_FOUND = 'domicilio_no_encontrado',
  PROFESSIONAL_ISSUE = 'problema_profesional',
  WEATHER_CONDITIONS = 'condiciones_climaticas',
  SAFETY_REASONS = 'razones_de_seguridad',
  OTHER = 'otro_motivo',
}

// Para los motivos de rechazo en confirmación
export enum RejectionReasonType {
  PATIENT_HOSPITALIZED = 'paciente_internado',
  PATIENT_IMPROVED = 'paciente_mejorado',
  PATIENT_TRAVELING = 'paciente_de_viaje',
  SCHEDULE_CONFLICT = 'conflicto_de_horario',
  FAMILY_UNAVAILABLE = 'familia_no_disponible',
  PATIENT_REFUSED = 'paciente_rechaza_visita',
  OTHER = 'otro_motivo',
}

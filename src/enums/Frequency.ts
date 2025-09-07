export enum NextDateCalculationRule {
  EXACT_DAYS = 'EXACT_DAYS', // Días exactos (puede caer fin de semana)
  NEXT_BUSINESS_DAY = 'NEXT_BUSINESS_DAY', // Próximo día hábil disponible
  SAME_DAY_NEXT_MONTH = 'SAME_DAY_NEXT_MONTH', // Mismo día del mes siguiente
  SMART_FREQUENCY = 'SMART_FREQUENCY', // Lógica inteligente (quincenal/mensual +7 si mismo mes)
  HOURLY_PATTERN = 'HOURLY_PATTERN', // Patrón por horas (cada X horas)
  DAILY_MULTIPLE = 'DAILY_MULTIPLE', // Múltiples visitas por día
  WEEKLY_PATTERN = 'WEEKLY_PATTERN', // Patrón semanal específico (L-M-V)
  CUSTOM_SCHEDULE = 'CUSTOM_SCHEDULE', // Horario completamente personalizado
}

export enum FrequencyType {
  WEEKLY = 'WEEKLY', // Semanal
  MONTHLY = 'MONTHLY', // Mensual
  SIMPLE = 'SIMPLE', // Frecuencias simples (semanal, mensual)
  HOURLY = 'HOURLY', // Por horas (cada 8h, cada 12h)
  DAILY_MULTIPLE = 'DAILY_MULTIPLE', // Múltiples por día (2x/día, 3x/día)
  WEEKLY_PATTERN = 'WEEKLY_PATTERN', // Patrón semanal (L-M-V, Ma-J)
  CUSTOM = 'CUSTOM', // Completamente personalizado
}

export enum FrequencyInterval {
  HOURS = 'HOURS',
  DAYS = 'DAYS',
  WEEKS = 'WEEKS',
  MONTHS = 'MONTHS',
}

// Para patrones semanales
export enum WeekDay {
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
  SUNDAY = 0,
}

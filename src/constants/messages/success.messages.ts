export const SUCCESS_MESSAGES = {
  AUTH: {
    LOGIN_SUCCESS: 'Sesión iniciada con éxito.',
    LOGOUT_SUCCESS: 'Sesión cerrada correctamente.',
    RECOVERY_EMAIL_SENT: 'Email de recuperación enviado.',
    PASSWORD_RESET_SUCCESS: 'Contraseña actualizada correctamente.',
    TOKEN_REFRESHED: 'Token renovado exitosamente.',
    PASSWORD_CHANGED_SUCCESS: 'Contraseña cambiada exitosamente.',
  },
  DB: {
    DB_CONNECTED: 'Conexión a la base de datos establecida correctamente.',
    DB_SYNCED: 'Sincronización de base de datos completada.',
    DB_UP: 'Base de datos inicializada correctamente.',
  },
  SERVER: {
    STARTUP: 'Servidor ejecutándose en puerto',
  },
  ROLE: {
    ROLE_CREATED: 'Rol creado correctamente.',
    ROLES_FETCHED: 'Roles obtenidos exitosamente.',
    ROLE_FOUND: 'Rol encontrado exitosamente.',
    ROLE_UPDATED: 'Rol actualizado exitosamente.',
    ROLE_DELETED: 'Rol eliminado exitosamente.',
    ROLE_RESTORED: 'Rol restaurado exitosamente.',
  },
  SPECIALTY: {
    SPECIALTY_CREATED: 'Especialidad creada correctamente.',
    SPECIALTIES_FETCHED: 'Especialidades obtenidas exitosamente.',
    SPECIALTY_FOUND: 'Especialidad encontrada exitosamente.',
    SPECIALTY_UPDATED: 'Especialidad actualizada exitosamente.',
    SPECIALTY_DELETED: 'Especialidad eliminada exitosamente.',
    SPECIALTY_RESTORED: 'Especialidad restaurada exitosamente.',
  },
  USER: {
    USER_RESTORED: 'Usuario restaurado exitosamente.',
    USER_DELETED: 'Usuario eliminado exitosamente.',
    USER_UPDATED: 'Usuario actualizado exitosamente.',
    USER_CREATED: 'Usuario creado correctamente.',
    PROFILE_RETRIEVED: 'Perfil obtenido exitosamente.',
    PROFILE_UPDATED: 'Perfil actualizado exitosamente.',
    USERS_FETCHED: 'Usuarios obtenidos exitosamente.',
  },

  PROFESSIONAL: {
    PROFESSIONAL_RESTORED: 'Profesional restaurado exitosamente.',
    PROFESSIONAL_DELETED: 'Profesional eliminado exitosamente.',
    PROFESSIONAL_UPDATED: 'Profesional actualizado exitosamente.',
    PROFESSIONAL_CREATED: 'Profesional creado correctamente.',
    PROFESSIONAL_FOUND: 'Profesional encontrado exitosamente.',
    PROFESSIONAL_FETCHED: 'Profesionales obtenidos exitosamente.',
    SCHEDULE_FETCHED: 'Horario del profesional obtenido exitosamente.',
    PROFESSIONALS_BY_ZONE_FETCHED:
      'Profesionales de la zona obtenidos exitosamente.',
  },
  HEALTHCARE_PROVIDER: {
    HEALTHCARE_CREATED: 'Obra social/prepaga creada correctamente.',
    HEALTHCARE_FETCHED: 'Obras sociales/prepagas obtenidas exitosamente.',
    HEALTHCARE_FOUND: 'Obra social/prepaga encontrada exitosamente.',
    HEALTHCARE_UPDATED: 'Obra social/prepaga actualizada exitosamente.',
    HEALTHCARE_DELETED: 'Obra social/prepaga eliminada exitosamente.',
    HEALTHCARE_RESTORES: 'Obra social/prepaga restaurada exitosamente.',
  },
  FREQUENCY: {
    FREQUENCY_CREATED: 'Frecuencia creada correctamente.',
    FREQUENCY_FOUND: 'Frecuencia encontrada exitosamente.',
    FREQUENCY_UPDATED: 'Frecuencia actualizada exitosamente.',
    FREQUENCY_DELETED: 'Frecuencia eliminada exitosamente.',
    FREQUENCY_RESTORED: 'Frecuencia restaurada exitosamente.',
    FREQUENCIES_FETCHED: 'Frecuencias obtenidas exitosamente.',
  },

  HOLIDAY: {
    HOLIDAY_CREATED: 'Feriado creado correctamente.',
    HOLIDAYS_FETCHED: 'Feriados obtenidos exitosamente.',
    HOLIDAYS_SYNCED: 'Feriados sincronizados exitosamente.',
    WORKING_DAY_CHECKED: 'Verificación de día laboral completada.',
  },
  AUXILIARY: {
    CONFIRMATION_STATUSES_FETCHED:
      'Estados de confirmación obtenidos exitosamente.',
    REJECTION_REASONS_FETCHED: 'Motivos de rechazo obtenidos exitosamente.',
    NOT_COMPLETED_REASONS_FETCHED:
      'Motivos de no completada obtenidos exitosamente.',
  },

  ZONE: {
    CREATED: 'Zona creada correctamente.',
    UPDATED: 'Zona actualizada exitosamente.',
    DELETED: 'Zona eliminada exitosamente.',
    RESTORED: 'Zona restaurada exitosamente.',
    FETCHED: 'Zona(s) obtenida(s) exitosamente.',
    ACTIVATED: 'Zona activada exitosamente.',
    DEACTIVATED: 'Zona desactivada exitosamente.',
    POLYGON_UPDATED: 'Polígono de zona actualizado exitosamente.',
    POLYGON_REMOVED: 'Polígono de zona removido exitosamente.',
    STATUS_UPDATED: 'Estado de zona actualizado exitosamente.',
    COORDINATES_UPDATED: 'Coordenadas de la zona actualizadas exitosamente.',
  },

  PATIENT: {
    PATIENT_CREATED: 'Paciente creado correctamente.',
    PATIENTS_FETCHED: 'Pacientes obtenidos exitosamente.',
    PATIENT_FOUND: 'Paciente encontrado exitosamente.',
    PATIENT_UPDATED: 'Paciente actualizado exitosamente.',
    PATIENT_DELETED: 'Paciente eliminado exitosamente.',
    PATIENT_RESTORED: 'Paciente restaurado exitosamente.',
    PATIENTS_BY_ZONE_FETCHED: 'Pacientes de la zona obtenidos exitosamente.',
    PATIENTS_BY_FREQUENCY_FETCHED:
      'Pacientes por frecuencia obtenidos exitosamente.',
    VISIT_HISTORY_FETCHED: 'Historial de visitas obtenido exitosamente.',
    AUTHORIZATION_UPDATED:
      'Autorización del paciente actualizada exitosamente.',
    NEXT_VISIT_CALCULATED: 'Próxima visita calculada exitosamente.',
  },

  JOURNEY: {
    JOURNEY_CREATED: 'Recorrido creado correctamente.',
    JOURNEYS_FETCHED: 'Recorridos obtenidos exitosamente.',
    JOURNEY_FOUND: 'Recorrido encontrado exitosamente.',
    JOURNEY_UPDATED: 'Recorrido actualizado exitosamente.',
    JOURNEY_DELETED: 'Recorrido eliminado exitosamente.',
    JOURNEY_STARTED: 'Recorrido iniciado exitosamente.',
    JOURNEY_ENDED: 'Recorrido finalizado exitosamente.',
    JOURNEYS_BY_DATE_FETCHED: 'Recorridos por fecha obtenidos exitosamente.',
    JOURNEYS_BY_PROFESSIONAL_FETCHED:
      'Recorridos del profesional obtenidos exitosamente.',
    ROUTE_GENERATED: 'Ruta óptima generada exitosamente.',
  },

  VISIT: {
    VISIT_CREATED: 'Visita creada correctamente.',
    VISITS_FETCHED: 'Visitas obtenidas exitosamente.',
    VISIT_FOUND: 'Visita encontrada exitosamente.',
    VISIT_UPDATED: 'Visita actualizada exitosamente.',
    VISIT_DELETED: 'Visita eliminada exitosamente.',
    VISIT_CONFIRMED: 'Visita confirmada exitosamente.',
    VISIT_COMPLETED: 'Visita completada exitosamente.',
    VISIT_RESCHEDULED: 'Visita reprogramada exitosamente.',
    VISIT_CANCELLED: 'Visita cancelada exitosamente.',
    VISITS_BY_JOURNEY_FETCHED: 'Visitas del recorrido obtenidas exitosamente.',
    VISITS_BY_PATIENT_FETCHED: 'Visitas del paciente obtenidas exitosamente.',
    VISITS_BY_STATUS_FETCHED: 'Visitas por estado obtenidas exitosamente.',
    PATIENT_MARKED_NOT_PRESENT:
      'Paciente marcado como no presente exitosamente.',
  },

  AUDIT: {
    AUDIT_TRAIL_FETCHED: 'Registro de auditoría obtenido exitosamente.',
    ENTITY_HISTORY_FETCHED: 'Historial de entidad obtenido exitosamente.',
    USER_ACTIVITY_FETCHED: 'Actividad del usuario obtenida exitosamente.',
    COMPLIANCE_REPORT_FETCHED: 'Reporte de cumplimiento obtenido exitosamente.',
  },

  REPORTS: {
    PRODUCTIVITY_REPORT_FETCHED:
      'Reporte de productividad obtenido exitosamente.',
    VISIT_COMPLETION_REPORT_FETCHED:
      'Reporte de finalización de visitas obtenido exitosamente.',
    PROFESSIONAL_PERFORMANCE_FETCHED:
      'Rendimiento del profesional obtenido exitosamente.',
    PATIENT_STATS_FETCHED: 'Estadísticas del paciente obtenidas exitosamente.',
    OPERATIONAL_KPIS_FETCHED: 'KPIs operacionales obtenidos exitosamente.',
  },
};

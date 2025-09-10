export const ERROR_MESSAGES = {
  AUTH: {
    INVALID_USER_STATE: 'Estado de usuario inválido.',
    INVALID_USERNAME_FORMAT:
      'El nombre de usuario solo puede contener letras, números y guiones bajos.',
    INVALID_FIRSTNAME_FORMAT:
      'El nombre solo puede contener letras y espacios.',
    INVALID_LASTNAME_FORMAT:
      'El apellido solo puede contener letras y espacios.',
    INVALID_ROLE_ID: 'ID de rol inválido.',
    IDENTIFIER_REQUIRED: 'Nombre de usuario o email requeridos.',
    INVALID_CREDENTIALS: 'Usuario y/o contraseña inválidos.',
    INVALID_USERNAME: 'Username debe tener 3-50 caracteres alfanuméricos.',
    INVALID_EMAIL: 'Formato de email inválido.',
    INVALID_PASSWORD: 'Longitud de la contraseña inválida.',
    EMPTY_USERNAME: 'Username no puede estar vacío.',
    EMPTY_EMAIL: 'Email no puede estar vacío.',
    INVALID_FIRSTNAME: 'Nombre debe tener 2-100 caracteres.',
    INVALID_LASTNAME: 'Apellido debe tener 2-100 caracteres.',
    EMPTY_FIRSTNAME: 'Nombre no puede estar vacío.',
    EMPTY_LASTNAME: 'Apellido no puede estar vacío.',
    WEAK_PASSWORD:
      'Password debe tener mínimo 8 caracteres, 1 mayúscula y 1 número.',
    EMPTY_PASSWORD: 'Contraseña no puede estar vacía.',
    SAME_PASSWORD: 'La nueva contraseña debe ser diferente a la actual.',
    INVALID_CURRENT_PASSWORD: 'Contraseña actual incorrecta.',
    CURRENT_PASSWORD_REQUIRED: 'Contraseña actual es requerida.',
    CONFIRM_PASSWORD_REQUIRED: 'Confirmación de contraseña es requerida.',
    PASSWORD_DOESNT_MATCH: 'Las contraseñas no coinciden.',
    USERNAME_IN_USE: 'Username ya está en uso.',
    EMAIL_IN_USE: 'Email ya está registrado.',
    ROLE_NOT_FOUND: 'Rol no encontrado.',
    ROLE_INACTIVE: 'Rol inactivo.',
    EMPTY_ROLE: 'Rol no puede estar vacío, seleccione un rol.',
    USER_NOT_AUTHENTICATED:
      'Usuario no autenticado. Debe pasar por autenticación primero.',
    USER_NO_ROLE: 'Usuario sin rol asignado. Contacta al administrador.',
    USER_INACTIVE: 'Usuario inactivo. Contacta al administrador.',
    USER_BANNED: 'Usuario bloqueado. Contacta al administrador.',
    REFRESH_TOKEN_REQUIRED: 'Refresh token es requerido.',
    INVALID_TOKEN_TYPE: 'Tipo de token inválido. Se esperaba refresh token.',
    REFRESH_TOKEN_EXPIRED: 'Refresh token expirado. Inicia sesión nuevamente.',
    INVALID_REFRESH_TOKEN: 'Refresh token inválido. Inténtalo nuevamente.',
    MISSING_RESET_FIELDS: 'Token y nueva contraseña son requeridos.',
    INVALID_RESET_TOKEN: 'Token de recuperación inválido o expirado.',
    TOKEN_REVOKED: 'Token revocado. Inicia sesión nuevamente.',
    TOKEN_REQUIRED: 'Token de acceso requerido.',
    TOKEN_NOT_ACTIVE: 'El token no está activo.',
    TOKEN_EXPIRED: 'Token expirado.',
    INVALID_TOKEN: 'Token inválido.',
    INVALID_TOKEN_STRUCTURE: 'La estructura del token es inválida.',
  },
  DB: {
    CONNECTION: 'Error al conectar con la base de datos.',
    SYNC: 'Error al sincronizar la base de datos.',
  },
  SERVER: {
    STARTUP: 'Error al iniciar el servidor.',
    INTERNAL_ERROR: 'Error interno del servidor.',
    JWT_SECRET_MISSING: 'Error de configuración del servidor.',
    INVALID_PAGINATION_PARAMETERS: 'Parámetros de paginación inválidos.',
    EMPTY_BODY: 'El body no puede estar vacío.',
    INVALID_BODY: 'Error de formato JSON.',
  },
  ROUTING: {
    NOT_FOUND: 'Ruta no encontrada.',
  },
  ROLE: {
    NAME_IN_USE: 'El nombre ya está en uso.',
    INVALID_ID: 'ID debe ser un UUID válido.',
    INVALID_STATUS: 'isActive debe ser "true" o "false".',
    ID_REQUIRED: 'El ID es requerido para esta búsqueda.',
    CREATION: 'Error al crear el rol.',
    NOT_FOUND: 'Rol no encontrado.',
    INVALID_NAME_FORMAT: 'El nombre solo puede contener letras y espacios.',
    INVALID_NAME: 'El nombre debe tener 2-100 caracteres.',
    INVALID_DESCRIPTION: 'La descripción no puede exceder los 500 caracteres.',
    ALREADY_ACTIVE: 'El rol ya está activo.',
  },
  USER: {
    INVALID_STATE: 'Estado de usuario inválido.',
    ID_REQUIRED: 'El ID es requerido para esta acción.',
    INVALID_ID: 'ID debe ser un UUID válido.',
    CREATION: 'Error al crear el usuario.',
    NOT_FOUND: 'Usuario no encontrado.',
    NO_FIELDS_TO_UPDATE: 'Debe proporcionar al menos un campo para actualizar.',
    UPDATE_FAILED: 'Error al actualizar el perfil.',
    INSUFFICIENT_PERMISSIONS:
      'No tienes los permisos para acceder a este contenido.',
    CANNOT_DELETE_SELF: 'No puedes eliminar tu propio usuario.',
    CANNOT_DELETE_LAST_ADMIN:
      'No se puede eliminar el único administrador activo.',
    ALREADY_DELETED: 'El usuario ya está eliminado.',
    ALREADY_ACTIVE: 'El usuario ya está activo.',
  },
  FREQUENCY: {
    ID_REQUIRED: 'El ID es requerido para esta acción.',
    INVALID_ID: 'ID debe ser un UUID válido.',
    INVALID_NAME:
      'El nombre de la frecuencia debe tener entre 2 y 50 caracteres.',
    INVALID_NAME_FORMAT:
      'El nombre de la frecuencia contiene caracteres no válidos.',
    INVALID_DESCRIPTION: 'La descripción no puede exceder 500 caracteres.',
    INVALID_TYPE: 'Tipo de frecuencia no válido.',
    INVALID_CALCULATION_RULE: 'Regla de cálculo de fecha no válida.',
    INVALID_INTERVAL_UNIT: 'Unidad de intervalo no válida.',
    INVALID_DAYS_BETWEEN: 'Los días entre visitas deben estar entre 1 y 365.',
    INVALID_VISITS_PER_MONTH: 'Las visitas por mes deben estar entre 1 y 31.',
    INVALID_INTERVAL_VALUE: 'El valor del intervalo debe ser mayor a 0.',
    INVALID_VISITS_PER_DAY: 'Las visitas por día deben estar entre 1 y 24.',
    NOT_FOUND: 'Frecuencia no encontrada.',
    NAME_IN_USE: 'El nombre de la frecuencia ya está en uso.',
    ALREADY_ACTIVE: 'La frecuencia ya está activa.',
    HAS_ACTIVE_RELATIONS:
      'No se puede eliminar la frecuencia porque está siendo utilizada por pacientes activos.',
  },

  PATIENT: {
    INVALID_ID: 'ID debe ser un UUID válido.',
    INVALID_FULLNAME: 'El nombre completo debe tener entre 2 y 200 caracteres.',
    INVALID_FULLNAME_FORMAT: 'El nombre contiene caracteres no válidos.',
    INVALID_HEALTHCARE_ID:
      'El ID de obra social debe tener entre 2 y 50 caracteres.',
    INVALID_HEALTHCARE_ID_FORMAT:
      'El ID de obra social contiene caracteres no válidos.',
    INVALID_HEALTHCARE_PROVIDER_ID: 'ID de obra social/prepaga no válido.',
    INVALID_ADDRESS: 'La dirección debe tener entre 5 y 200 caracteres.',
    INVALID_LOCALITY: 'La localidad debe tener entre 2 y 100 caracteres.',
    INVALID_LOCALITY_FORMAT: 'La localidad contiene caracteres no válidos.',
    INVALID_ZONE_ID: 'ID de zona no válido.',
    INVALID_PHONE: 'El teléfono debe tener entre 8 y 20 caracteres.',
    INVALID_PHONE_FORMAT: 'Formato de teléfono no válido.',
    INVALID_EMERGENCY_PHONE:
      'El teléfono de emergencia debe tener entre 8 y 20 caracteres.',
    INVALID_EMERGENCY_PHONE_FORMAT:
      'Formato de teléfono de emergencia no válido.',
    INVALID_STATE: 'Estado del paciente no válido.',
    INVALID_DATE_FORMAT: 'Formato de fecha no válido (YYYY-MM-DD).',
    INVALID_AUTHORIZED_VISITS:
      'Las visitas autorizadas deben estar entre 0 y 31.',
    INVALID_FREQUENCY_ID: 'ID de frecuencia no válido.',
    INVALID_PROFESSIONAL_ID: 'ID de profesional no válido.',
    INVALID_DIAGNOSIS: 'El diagnóstico no puede exceder 1000 caracteres.',
    INVALID_MEDICAL_OBSERVATIONS:
      'Las observaciones médicas no pueden exceder 2000 caracteres.',
    INVALID_CONTACT_METHOD: 'Método de contacto no válido.',
    NOT_FOUND: 'Paciente no encontrado.',
    HEALTHCARE_ID_IN_USE:
      'El ID de obra social ya está en uso para esta prepaga/obra social.',
    ALREADY_ACTIVE: 'El paciente ya está activo.',
    ALREADY_DELETED: 'El paciente ya está eliminado.',
    HAS_ACTIVE_VISITS:
      'No se puede eliminar el paciente porque tiene visitas activas.',
    NO_FIELDS_TO_UPDATE: 'Debe proporcionar al menos un campo para actualizar.',
  },

  JOURNEY: {
    INVALID_ID: 'ID debe ser un UUID válido.',
    INVALID_PROFESSIONAL_ID: 'ID de profesional no válido.',
    INVALID_DATE_FORMAT: 'Formato de fecha no válido (YYYY-MM-DD).',
    INVALID_ZONE_ID: 'ID de zona no válido.',
    INVALID_STATUS: 'Estado del recorrido no válido.',
    INVALID_TIME_FORMAT: 'Formato de hora no válido (HH:MM).',
    INVALID_ESTIMATED_VISITS: 'Las visitas estimadas deben estar entre 0 y 50.',
    INVALID_TRAVEL_DISTANCE:
      'La distancia de viaje debe ser un número positivo.',
    INVALID_OBSERVATIONS:
      'Las observaciones no pueden exceder 1000 caracteres.',
    END_TIME_BEFORE_START:
      'La hora de fin planificada debe ser posterior a la de inicio.',
    ACTUAL_END_TIME_BEFORE_START:
      'La hora de fin real debe ser posterior a la de inicio real.',
    NOT_FOUND: 'Recorrido no encontrado.',
    DUPLICATE_JOURNEY:
      'Ya existe un recorrido para este profesional, fecha y zona.',
    ALREADY_STARTED: 'El recorrido ya fue iniciado.',
    ALREADY_ENDED: 'El recorrido ya fue finalizado.',
    NOT_STARTED: 'El recorrido debe ser iniciado antes de poder finalizarlo.',
    HAS_ACTIVE_VISITS:
      'No se puede eliminar el recorrido porque tiene visitas activas.',
  },

  VISIT: {
    INVALID_PATIENT_ID: 'ID de paciente no válido.',
    INVALID_JOURNEY_ID: 'ID de recorrido no válido.',
    INVALID_STATUS: 'Estado de la visita no válido.',
    INVALID_DATETIME: 'Formato de fecha y hora no válido.',
    INVALID_ORDER: 'El orden en el recorrido debe estar entre 1 y 100.',
    INVALID_CONFIRMATION_STATUS_ID: 'ID de estado de confirmación no válido.',
    INVALID_CONFIRMATION_METHOD: 'Método de confirmación no válido.',
    INVALID_USER_ID: 'ID de usuario no válido.',
    INVALID_DURATION: 'La duración debe estar entre 1 y 480 minutos.',
    INVALID_REJECTION_REASON_ID: 'ID de motivo de rechazo no válido.',
    INVALID_NOT_COMPLETED_REASON_ID: 'ID de motivo de no completada no válido.',
    INVALID_VISIT_ID: 'ID de visita no válido.',
    INVALID_LATITUDE: 'La latitud debe estar entre -90 y 90.',
    INVALID_LONGITUDE: 'La longitud debe estar entre -180 y 180.',
    INVALID_PROFESSIONAL_NOTES:
      'Las notas del profesional no pueden exceder 2000 caracteres.',
    INVALID_COORDINATOR_NOTES:
      'Las notas del coordinador no pueden exceder 1000 caracteres.',
    NOT_FOUND: 'Visita no encontrada.',
    ALREADY_COMPLETED: 'La visita ya está completada.',
    ALREADY_CANCELLED: 'La visita ya está cancelada.',
    ALREADY_MARKED_NOT_PRESENT: 'La visita ya está marcada como no presente.',
    CANNOT_COMPLETE_CANCELLED: 'No se puede completar una visita cancelada.',
    CANNOT_CANCEL_COMPLETED: 'No se puede cancelar una visita completada.',
    CANNOT_CONFIRM_COMPLETED: 'No se puede confirmar una visita completada.',
    CANNOT_CONFIRM_CANCELLED: 'No se puede confirmar una visita cancelada.',
    CANNOT_RESCHEDULE_COMPLETED:
      'No se puede reprogramar una visita completada.',
    CANNOT_RESCHEDULE_CANCELLED:
      'No se puede reprogramar una visita cancelada.',
    CANNOT_MARK_NOT_PRESENT_COMPLETED:
      'No se puede marcar como no presente una visita completada.',
    CANNOT_MARK_NOT_PRESENT_CANCELLED:
      'No se puede marcar como no presente una visita cancelada.',
    NO_CHANGES_DETECTED: 'No se detectaron cambios para actualizar.',
    VISIT_DUPLICATE:
      'Ya existe una visita programada para este paciente en la fecha y hora especificada.',
    RESCHEDULE_CONFLICT:
      'Ya existe una visita programada para este paciente en la nueva fecha y hora.',
    ORDER_CONFLICT:
      'Ya existe una visita en esa posición en el recorrido especificado.',
  },

  HOLIDAY: {
    INVALID_NAME: 'El nombre del feriado debe tener entre 2 y 100 caracteres.',
    INVALID_NAME_FORMAT:
      'El nombre del feriado contiene caracteres no válidos.',
    INVALID_DATE_FORMAT: 'Formato de fecha no válido (YYYY-MM-DD).',
    INVALID_DESCRIPTION: 'La descripción no puede exceder 500 caracteres.',
  },

  CONFIRMATION_STATUS: {
    INVALID_NAME: 'El nombre debe tener entre 2 y 50 caracteres.',
    INVALID_NAME_FORMAT: 'El nombre contiene caracteres no válidos.',
    INVALID_DESCRIPTION: 'La descripción no puede exceder 200 caracteres.',
  },

  REJECTION_REASON: {
    INVALID_NAME: 'El nombre debe tener entre 2 y 100 caracteres.',
    INVALID_NAME_FORMAT: 'El nombre contiene caracteres no válidos.',
    INVALID_DESCRIPTION: 'La descripción no puede exceder 300 caracteres.',
    INVALID_CATEGORY: 'La categoría debe tener entre 2 y 50 caracteres.',
  },

  NOT_COMPLETED_REASON: {
    INVALID_NAME: 'El nombre debe tener entre 2 y 100 caracteres.',
    INVALID_NAME_FORMAT: 'El nombre contiene caracteres no válidos.',
    INVALID_DESCRIPTION: 'La descripción no puede exceder 300 caracteres.',
    INVALID_CATEGORY: 'La categoría debe tener entre 2 y 50 caracteres.',
    INVALID_SUGGESTED_ACTION:
      'La acción sugerida no puede exceder 100 caracteres.',
  },

  AUDIT: {
    INVALID_ENTITY: 'Tipo de entidad no válido.',
    INVALID_ENTITY_ID: 'ID de entidad no válido.',
    INVALID_ACTION: 'Acción de auditoría no válida.',
    INVALID_FIELD_NAME: 'Nombre del campo no válido.',
    INVALID_OLD_VALUE: 'El valor anterior no puede exceder 1000 caracteres.',
    INVALID_NEW_VALUE: 'El valor nuevo no puede exceder 1000 caracteres.',
    INVALID_CHANGE_REASON: 'Motivo del cambio no válido.',
    INVALID_CHANGE_DESCRIPTION:
      'La descripción del cambio no puede exceder 1000 caracteres.',
    INVALID_USER_ID: 'ID de usuario no válido.',
    INVALID_USER_AGENT: 'El user agent no puede exceder 500 caracteres.',
    INVALID_IP_ADDRESS: 'Dirección IP no válida.',
    INVALID_IP_FORMAT: 'Formato de dirección IP no válido.',
    INVALID_RELATED_ENTITY_ID: 'ID de entidad relacionada no válido.',
    INVALID_DATETIME: 'Formato de fecha y hora no válido.',
  },

  PAGINATION: {
    INVALID_PAGE: 'El número de página debe ser un entero positivo.',
    PAGE_TOO_SMALL: 'El número de página debe ser mayor o igual a 1.',
    INVALID_LIMIT: 'El límite debe ser un entero positivo.',
    LIMIT_OUT_OF_RANGE: 'El límite debe estar entre 1 y 100.',
    INVALID_SORT_BY: 'El campo de ordenamiento no es válido.',
    INVALID_SORT_ORDER: 'El orden debe ser "asc" o "desc".',
  },

  SPECIALTY: {
    NAME_IN_USE: 'El nombre ya está en uso.',
    INVALID_ID: 'ID debe ser un UUID válido.',
    INVALID_STATUS: 'isActive debe ser "true" o "false".',
    ID_REQUIRED: 'El ID es requerido para esta acción.',
    CREATION: 'Error al crear la especialidad.',
    NOT_FOUND: 'Especialidad no encontrada.',
    INVALID_NAME_FORMAT:
      'El nombre solo puede contener letras, espacios, guiones y paréntesis.',
    INVALID_NAME: 'El nombre debe tener entre 2 y 100 caracteres.',
    INVALID_DESCRIPTION: 'La descripción no puede exceder los 500 caracteres.',
    ALREADY_ACTIVE: 'La especialidad ya está activa.',
  },
  HEALTHCARE_PROVIDER: {
    INVALID_NAME: 'El nombre debe tener entre 2 y 150 caracteres.',
    NAME_IN_USE: 'El nombre ya está en uso.',
    ALREADY_ACTIVE: 'La obra social/prepaga ya está activa.',
    ID_REQUIRED: 'El ID es requerido para esta acción.',
    INVALID_ID: 'ID debe ser un UUID válido.',
    CREATION: 'Error al crear la obra social/prepaga.',
    NOT_FOUND: 'Obra social/prepaga no encontrada.',
    INVALID_NAME_FORMAT: 'El nombre contiene caracteres no válidos.',
    INVALID_CODE: 'El código debe tener entre 2 y 20 caracteres.',
    CODE_IN_USE: 'El código ya está en uso.',
    INVALID_CODE_FORMAT:
      'El código solo puede contener letras, números, guiones y guiones bajos.',
  },
  PROFESSIONAL: {
    ID_REQUIRED: 'El ID es requerido para esta acción.',
    INVALID_ID: 'ID debe ser un UUID válido.',
    NOT_FOUND: 'Profesional no encontrado.',
    ALREADY_ACTIVE: 'El profesional ya está activo.',
    CREATION: 'Error al crear el profesional.',
    EMAIL_IN_USE: 'El email ya está en uso.',
    USERNAME_IN_USE: 'El username ya está en uso.',
    INVALID_FIRSTNAME: 'El nombre debe tener entre 2 y 100 caracteres.',
    INVALID_LASTNAME: 'El apellido debe tener entre 2 y 100 caracteres.',
    INVALID_FIRSTNAME_FORMAT:
      'El nombre solo puede contener letras y espacios.',
    INVALID_LASTNAME_FORMAT:
      'El apellido solo puede contener letras y espacios.',
    INVALID_USERNAME_FORMAT:
      'El username solo puede contener letras, números y guiones bajos.',
    INVALID_USERNAME: 'El username debe tener entre 3 y 50 caracteres.',
    INVALID_PHONE: 'El teléfono debe tener entre 8 y 20 caracteres.',
    INVALID_PHONE_FORMAT: 'Formato de teléfono inválido.',
    INVALID_EMAIL: 'Formato de email inválido.',
    INVALID_SPECIALTY_ID: 'ID de especialidad inválido.',
    SPECIALTY_NOT_FOUND: 'La especialidad no existe.',
    SPECIALTY_INACTIVE: 'La especialidad está inactiva.',
    INVALID_SCHEDULE_FORMAT:
      'El horario debe ser en formato HHMM (ej: 0830, 1730).',
    INVALID_SCHEDULE_RANGE: 'El horario debe estar entre 0000 y 2359.',
    SCHEDULE_END_BEFORE_START:
      'La hora de fin debe ser posterior a la hora de inicio.',
    INVALID_STATE: 'Estado de profesional inválido.',
  },
  ZONE: {
    INVALID_COORDINATE: 'Coordenada no válida.',
    POLYGON_NOT_CLOSED:
      'El polígono debe estar cerrado (primer punto = último punto).',
    ID_REQUIRED: 'ID requerido para esta acción.',
    INVALID_ID: 'ID debe ser un UUID válido.',
    INVALID_NAME:
      'Nombre de zona no válido, debe tener entre 2 y 100 caracteres.',
    INVALID_COORDINATES: 'Coordenadas del polígono no válidas.',
    INVALID_NAME_FORMAT:
      'El nombre solo puede contener letras, números, espacios, guiones y paréntesis.',
    DESCRIPTION_TOO_LONG: 'La descripción no puede exceder los 500 caracteres.',
    POLYGON_INVALID_FORMAT: 'El formato del polígono no es válido.',
    POLYGON_MIN_POINTS: 'El polígono debe tener al menos 3 puntos.',
    POLYGON_MAX_POINTS: 'Un polígono no puede tener más de 100 coordenadas.',
    LAT_RANGE: 'La latitud debe estar entre -90 y 90.',
    LONG_RANGE: 'La longitud debe estar entre -180 y 180.',
    NOT_FOUND: 'Zona no encontrada.',
    ZALREADY_EXISTS: 'La zona ya existe.',
    NAME_ALREADY_IN_USE: 'El nombre ya está en uso.',
    ALREADY_ACTIVE: 'La zona ya está activa.',
    ALREADY_INACTIVE: 'La zona ya está inactiva.',
    HAS_ACTIVE_RELATIONS:
      'No se puede eliminar la zona porque tiene relaciones activas.',
    CANNOT_DELETE_ACTIVE_ZONE: 'No se puede eliminar una zona activa.',
    COORDINATES_REQUIRED: 'Las coordenadas del polígono son requeridas.',
    COORDINATES_INVALID_TYPE: 'Las coordenadas deben ser un array válido.',
    COORDINATES_EMPTY: 'Las coordenadas no pueden estar vacías.',
    COORDINATES_NOT_CLOSED:
      'El polígono debe estar cerrado (primero y último punto iguales).',
    COORDINATES_OUT_OF_ARGENTINA:
      'Algunas coordenadas están fuera de los límites de Argentina.',
    COORDINATES_NOT_FOUND: 'La zona no tiene coordenadas definidas.',
    CREATE_FAILED: 'Error al crear la zona.',
    UPDATE_FAILED: 'Error al actualizar la zona.',
    DELETE_FAILED: 'Error al eliminar la zona.',
    RESTORE_FAILED: 'Error al restaurar la zona.',
    FETCH_FAILED: 'Error al obtener las zonas.',
  },
};

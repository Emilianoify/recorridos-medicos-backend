export const ERROR_MESSAGES = {
  AUTH: {
    INVALID_USERNAME: 'Username debe contener solo letras y números',
    INVALID_EMAIL: 'Debe ser un email válido',
    EMPTY_USERNAME: 'Username no puede estar vacío.',
    EMPTY_EMAIL: 'Email no puede estar vacío.',
    INVALID_FIRSTNAME: 'Nombre debe tener al menos 2 caracteres.',
    INVALID_LASTNAME: 'Apellido debe tener al menos 2 caracteres.',
  },
  DB: {
    DB_CONNECTION: 'Error al conectar con la base de datos.',
    DB_SYNC: 'Error al sincronizar la base de datos.',
  },
  SERVER: {
    STARTUP: 'Error al iniciar el servidor.',
    INTERNAL_ERROR: 'Error interno del servidor',
    JWT_SECRET_MISSING: 'Error de configuración del servidor',
    INVALID_PAGINATION_PARAMETERS: 'Parámetros de paginación inválidos',
  },
  ROUTING: {
    NOT_FOUND: 'Ruta no encontrada.',
  },
  ROLE: {
    ROLE_CREATION: 'Error al crear el rol.',
  },
  USER: {
    USER_CREATION: 'Error al crear el usuario.',
    USER_NOT_FOUND: 'Usuario no encontrado',
    NO_FIELDS_TO_UPDATE: 'Debe proporcionar al menos un campo para actualizar.',
    UPDATE_FAILED: 'Error al actualizar el perfil.',
  },
  PATIENT: {
    EMPTY_PHONE: 'Se debe proporcionar al menos un número de teléfono',
    MISSING_AUTHORIZATION:
      'Pacientes activos deben tener fecha de autorización',
    EXCEDEED_VISIT_LIMIT:
      'Las visitas realizadas no pueden superar las autorizadas',
  },
};

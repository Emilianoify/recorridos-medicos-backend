export const ERROR_MESSAGES = {
  AUTH: {
    INVALID_USERNAME: 'Username debe tener 3-50 caracteres alfanuméricos.',
    INVALID_EMAIL: 'Formato de email inválido.',
    INVALID_PASSWORD: 'Longitud de la contraseña invalida.',
    EMPTY_USERNAME: 'Username no puede estar vacío.',
    EMPTY_EMAIL: 'Email no puede estar vacío.',
    INVALID_FIRSTNAME: 'Nombre debe tener 2-100 caracteres.',
    INVALID_LASTNAME: 'Apellido debe tener 2-100 caracteres.',
    EMPTY_FIRSTNAME: 'Nombre no puede estar vacío.',
    EMPTY_LASTNAME: 'Apellido no puede estar vacío.',
    WEAK_PASSWORD:
      'Password debe tener mínimo 8 caracteres, 1 mayúscula y 1 número.',
    EMPTY_PASSWORD: 'Contraseña no puede estar vacío.',
    SAME_PASSWORD: 'La nueva contraseña debe ser diferente a la actual.',
    INVALID_CURRENT_PASSWORD: 'Contraseña actual incorrecta.',
    CURRENT_PASSWORD_REQUIRED: 'Contraseña actual es requerida',
    CONFIRM_PASSWORD_REQUIRED: 'Confirmación de contraseña es requerida',
    PASSWORD_DOESNT_MATCH: 'Las contraseñas no coinciden',
    USERNAME_IN_USE: 'Username ya está en uso.',
    EMAIL_IN_USE: 'Email ya está registrado.',
    ROLE_NOT_FOUND: 'Rol no encontrado.',
    ROLE_INACTIVE: 'Rol inactivo.',
    EMPTY_ROLE: 'Rol no puede estar vacío, seleccione un rol.',
    USER_NOT_AUTHENTICATED:
      'Usuario no autenticado. Debe pasar por autenticación primero.',
    USER_NO_ROLE: 'Usuario sin rol asignado. Contacta al administrador.',
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
    EMPTY_BODY: 'El body no puede estar vacio.',
  },
  ROUTING: {
    NOT_FOUND: 'Ruta no encontrada.',
  },
  ROLE: {
    ROLE_CREATION: 'Error al crear el rol.',
    ROLE_NOT_FOUND: 'Rol no encontrado.',
  },
  USER: {
    USER_CREATION: 'Error al crear el usuario.',
    USER_NOT_FOUND: 'Usuario no encontrado',
    NO_FIELDS_TO_UPDATE: 'Debe proporcionar al menos un campo para actualizar.',
    UPDATE_FAILED: 'Error al actualizar el perfil.',
    INSUFFICIENT_PERMISSIONS:
      'No tienes los permsisos para acceder a este contenido.',
  },
  PATIENT: {
    EMPTY_PHONE: 'Se debe proporcionar al menos un número de teléfono',
    MISSING_AUTHORIZATION:
      'Pacientes activos deben tener fecha de autorización',
    EXCEDEED_VISIT_LIMIT:
      'Las visitas realizadas no pueden superar las autorizadas',
  },
};

import { Response, NextFunction } from 'express';
import { ERROR_MESSAGES } from '../constants/messages/error.messages';
import { AuthRequest } from '../interfaces/auth.interface';
import {
  sendForbidden,
  sendBadRequest,
  sendInternalErrorResponse,
} from '../utils/commons/responseFunctions';

// Definir permisos granulares
export enum Permission {
  // Usuario - Gestión
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_VIEW_ALL = 'user:view_all',
  USER_UPDATE_STATE = 'user:update_state',

  // Pacientes
  PATIENT_CREATE = 'patient:create',
  PATIENT_READ = 'patient:read',
  PATIENT_UPDATE = 'patient:update',
  PATIENT_DELETE = 'patient:delete',
  PATIENT_VIEW_ALL = 'patient:view_all',
  PATIENT_UPDATE_STATE = 'patient:update_state',

  // Profesionales
  PROFESSIONAL_CREATE = 'professional:create',
  PROFESSIONAL_READ = 'professional:read',
  PROFESSIONAL_UPDATE = 'professional:update',
  PROFESSIONAL_DELETE = 'professional:delete',
  PROFESSIONAL_VIEW_ALL = 'professional:view_all',
  PROFESSIONAL_VIEW_SCHEDULE = 'professional:view_schedule',

  // Visitas
  VISIT_CREATE = 'visit:create',
  VISIT_READ = 'visit:read',
  VISIT_UPDATE = 'visit:update',
  VISIT_DELETE = 'visit:delete',
  VISIT_CONFIRM = 'visit:confirm',
  VISIT_COMPLETE = 'visit:complete',
  VISIT_CANCEL = 'visit:cancel',
  VISIT_RESCHEDULE = 'visit:reschedule',
  VISIT_VIEW_ALL = 'visit:view_all',

  // Recorridos (Journeys)
  JOURNEY_CREATE = 'journey:create',
  JOURNEY_READ = 'journey:read',
  JOURNEY_UPDATE = 'journey:update',
  JOURNEY_DELETE = 'journey:delete',
  JOURNEY_START = 'journey:start',
  JOURNEY_END = 'journey:end',
  JOURNEY_GENERATE_ROUTE = 'journey:generate_route',
  JOURNEY_VIEW_ALL = 'journey:view_all',

  // Zonas
  ZONE_CREATE = 'zone:create',
  ZONE_READ = 'zone:read',
  ZONE_UPDATE = 'zone:update',
  ZONE_DELETE = 'zone:delete',
  ZONE_VIEW_ALL = 'zone:view_all',

  // Frecuencias
  FREQUENCY_CREATE = 'frequency:create',
  FREQUENCY_READ = 'frequency:read',
  FREQUENCY_UPDATE = 'frequency:update',
  FREQUENCY_DELETE = 'frequency:delete',

  // Reportes
  REPORT_PRODUCTIVITY = 'report:productivity',
  REPORT_COMPLETION = 'report:completion',
  REPORT_PERFORMANCE = 'report:performance',
  REPORT_PATIENT_STATS = 'report:patient_stats',
  REPORT_OPERATIONAL_KPIS = 'report:operational_kpis',
  REPORT_FINANCIAL = 'report:financial',

  // Auditoría
  AUDIT_VIEW = 'audit:view',
  AUDIT_COMPLIANCE = 'audit:compliance',
  AUDIT_USER_ACTIVITY = 'audit:user_activity',
  AUDIT_ENTITY_HISTORY = 'audit:entity_history',

  // Sistema
  SYSTEM_MANAGE_ROLES = 'system:manage_roles',
  SYSTEM_MANAGE_HOLIDAYS = 'system:manage_holidays',
  SYSTEM_SYNC_DATA = 'system:sync_data',
  SYSTEM_BACKUP = 'system:backup',

  // Especialidades y Obras Sociales
  SPECIALTY_MANAGE = 'specialty:manage',
  HEALTHCARE_PROVIDER_MANAGE = 'healthcare_provider:manage',
}

// Mapeo de roles a permisos
const ROLE_PERMISSIONS: { [roleName: string]: Permission[] } = {
  // ===== ADMINISTRADOR - Acceso total =====
  'Administrador': [
    // Usuarios
    Permission.USER_CREATE,
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.USER_DELETE,
    Permission.USER_VIEW_ALL,
    Permission.USER_UPDATE_STATE,

    // Pacientes
    Permission.PATIENT_CREATE,
    Permission.PATIENT_READ,
    Permission.PATIENT_UPDATE,
    Permission.PATIENT_DELETE,
    Permission.PATIENT_VIEW_ALL,
    Permission.PATIENT_UPDATE_STATE,

    // Profesionales
    Permission.PROFESSIONAL_CREATE,
    Permission.PROFESSIONAL_READ,
    Permission.PROFESSIONAL_UPDATE,
    Permission.PROFESSIONAL_DELETE,
    Permission.PROFESSIONAL_VIEW_ALL,
    Permission.PROFESSIONAL_VIEW_SCHEDULE,

    // Visitas
    Permission.VISIT_CREATE,
    Permission.VISIT_READ,
    Permission.VISIT_UPDATE,
    Permission.VISIT_DELETE,
    Permission.VISIT_CONFIRM,
    Permission.VISIT_COMPLETE,
    Permission.VISIT_CANCEL,
    Permission.VISIT_RESCHEDULE,
    Permission.VISIT_VIEW_ALL,

    // Recorridos
    Permission.JOURNEY_CREATE,
    Permission.JOURNEY_READ,
    Permission.JOURNEY_UPDATE,
    Permission.JOURNEY_DELETE,
    Permission.JOURNEY_START,
    Permission.JOURNEY_END,
    Permission.JOURNEY_GENERATE_ROUTE,
    Permission.JOURNEY_VIEW_ALL,

    // Zonas
    Permission.ZONE_CREATE,
    Permission.ZONE_READ,
    Permission.ZONE_UPDATE,
    Permission.ZONE_DELETE,
    Permission.ZONE_VIEW_ALL,

    // Frecuencias
    Permission.FREQUENCY_CREATE,
    Permission.FREQUENCY_READ,
    Permission.FREQUENCY_UPDATE,
    Permission.FREQUENCY_DELETE,

    // Reportes
    Permission.REPORT_PRODUCTIVITY,
    Permission.REPORT_COMPLETION,
    Permission.REPORT_PERFORMANCE,
    Permission.REPORT_PATIENT_STATS,
    Permission.REPORT_OPERATIONAL_KPIS,
    Permission.REPORT_FINANCIAL,

    // Auditoría
    Permission.AUDIT_VIEW,
    Permission.AUDIT_COMPLIANCE,
    Permission.AUDIT_USER_ACTIVITY,
    Permission.AUDIT_ENTITY_HISTORY,

    // Sistema
    Permission.SYSTEM_MANAGE_ROLES,
    Permission.SYSTEM_MANAGE_HOLIDAYS,
    Permission.SYSTEM_SYNC_DATA,
    Permission.SYSTEM_BACKUP,

    // Especialidades y Obras Sociales
    Permission.SPECIALTY_MANAGE,
    Permission.HEALTHCARE_PROVIDER_MANAGE,
  ],

  // ===== COORDINACIÓN - Gestión operativa =====
  'Coordinacion': [
    // Usuarios (solo lectura)
    Permission.USER_READ,
    Permission.USER_VIEW_ALL,

    // Pacientes
    Permission.PATIENT_CREATE,
    Permission.PATIENT_READ,
    Permission.PATIENT_UPDATE,
    Permission.PATIENT_VIEW_ALL,
    Permission.PATIENT_UPDATE_STATE,

    // Profesionales (lectura y gestión de horarios)
    Permission.PROFESSIONAL_READ,
    Permission.PROFESSIONAL_UPDATE,
    Permission.PROFESSIONAL_VIEW_ALL,
    Permission.PROFESSIONAL_VIEW_SCHEDULE,

    // Visitas - Gestión completa
    Permission.VISIT_CREATE,
    Permission.VISIT_READ,
    Permission.VISIT_UPDATE,
    Permission.VISIT_CONFIRM,
    Permission.VISIT_CANCEL,
    Permission.VISIT_RESCHEDULE,
    Permission.VISIT_VIEW_ALL,

    // Recorridos
    Permission.JOURNEY_CREATE,
    Permission.JOURNEY_READ,
    Permission.JOURNEY_UPDATE,
    Permission.JOURNEY_DELETE,
    Permission.JOURNEY_GENERATE_ROUTE,
    Permission.JOURNEY_VIEW_ALL,

    // Zonas
    Permission.ZONE_READ,
    Permission.ZONE_VIEW_ALL,

    // Frecuencias (lectura)
    Permission.FREQUENCY_READ,

    // Reportes operativos
    Permission.REPORT_PRODUCTIVITY,
    Permission.REPORT_COMPLETION,
    Permission.REPORT_OPERATIONAL_KPIS,

    // Auditoría limitada
    Permission.AUDIT_VIEW,
    Permission.AUDIT_ENTITY_HISTORY,

    // Especialidades (lectura)
    Permission.SPECIALTY_MANAGE,
    Permission.HEALTHCARE_PROVIDER_MANAGE,
  ],

  // ===== PROFESIONALES - Trabajo de campo =====
  'Profesionales': [
    // Solo su propia información
    Permission.USER_READ,

    // Pacientes (lectura de sus pacientes asignados)
    Permission.PATIENT_READ,

    // Profesionales (su propia información)
    Permission.PROFESSIONAL_READ,
    Permission.PROFESSIONAL_VIEW_SCHEDULE,

    // Visitas (completar, actualizar sus visitas)
    Permission.VISIT_READ,
    Permission.VISIT_UPDATE,
    Permission.VISIT_COMPLETE,

    // Recorridos (sus propios recorridos)
    Permission.JOURNEY_READ,
    Permission.JOURNEY_START,
    Permission.JOURNEY_END,

    // Zonas (lectura)
    Permission.ZONE_READ,

    // Frecuencias (lectura)
    Permission.FREQUENCY_READ,
  ],

  // ===== COORDINADOR DE SECTOR =====
  'Coordinador de Sector': [
    // Usuarios (lectura)
    Permission.USER_READ,

    // Pacientes (gestión en su sector)
    Permission.PATIENT_READ,
    Permission.PATIENT_UPDATE,
    Permission.PATIENT_VIEW_ALL,

    // Profesionales (gestión en su sector)
    Permission.PROFESSIONAL_READ,
    Permission.PROFESSIONAL_UPDATE,
    Permission.PROFESSIONAL_VIEW_ALL,
    Permission.PROFESSIONAL_VIEW_SCHEDULE,

    // Visitas (gestión en su sector)
    Permission.VISIT_READ,
    Permission.VISIT_UPDATE,
    Permission.VISIT_CONFIRM,
    Permission.VISIT_CANCEL,
    Permission.VISIT_RESCHEDULE,
    Permission.VISIT_VIEW_ALL,

    // Recorridos (gestión en su sector)
    Permission.JOURNEY_READ,
    Permission.JOURNEY_UPDATE,
    Permission.JOURNEY_GENERATE_ROUTE,
    Permission.JOURNEY_VIEW_ALL,

    // Zonas (lectura)
    Permission.ZONE_READ,
    Permission.ZONE_VIEW_ALL,

    // Reportes de su sector
    Permission.REPORT_PRODUCTIVITY,
    Permission.REPORT_COMPLETION,
    Permission.REPORT_PERFORMANCE,
  ],

  // ===== CONTADURÍA - Reportes financieros =====
  'Contaduria': [
    // Usuarios (lectura)
    Permission.USER_READ,

    // Pacientes (lectura para reportes)
    Permission.PATIENT_READ,
    Permission.PATIENT_VIEW_ALL,

    // Profesionales (lectura para reportes)
    Permission.PROFESSIONAL_READ,
    Permission.PROFESSIONAL_VIEW_ALL,

    // Visitas (lectura para reportes)
    Permission.VISIT_READ,
    Permission.VISIT_VIEW_ALL,

    // Recorridos (lectura para reportes)
    Permission.JOURNEY_READ,
    Permission.JOURNEY_VIEW_ALL,

    // Reportes financieros y operativos
    Permission.REPORT_PRODUCTIVITY,
    Permission.REPORT_COMPLETION,
    Permission.REPORT_PERFORMANCE,
    Permission.REPORT_PATIENT_STATS,
    Permission.REPORT_OPERATIONAL_KPIS,
    Permission.REPORT_FINANCIAL,

    // Auditoría para compliance financiero
    Permission.AUDIT_VIEW,
    Permission.AUDIT_COMPLIANCE,
  ],

  // ===== RECURSOS HUMANOS =====
  'Recursos Humanos': [
    // Usuarios (gestión completa)
    Permission.USER_CREATE,
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.USER_VIEW_ALL,
    Permission.USER_UPDATE_STATE,

    // Profesionales (gestión completa)
    Permission.PROFESSIONAL_CREATE,
    Permission.PROFESSIONAL_READ,
    Permission.PROFESSIONAL_UPDATE,
    Permission.PROFESSIONAL_DELETE,
    Permission.PROFESSIONAL_VIEW_ALL,
    Permission.PROFESSIONAL_VIEW_SCHEDULE,

    // Reportes de performance
    Permission.REPORT_PRODUCTIVITY,
    Permission.REPORT_PERFORMANCE,

    // Auditoría de usuarios
    Permission.AUDIT_VIEW,
    Permission.AUDIT_USER_ACTIVITY,

    // Sistema (gestión de roles)
    Permission.SYSTEM_MANAGE_ROLES,

    // Especialidades
    Permission.SPECIALTY_MANAGE,
  ],

  // ===== FACTURACIÓN =====
  'Facturacion': [
    // Lectura para facturación
    Permission.PATIENT_READ,
    Permission.PATIENT_VIEW_ALL,
    Permission.PROFESSIONAL_READ,
    Permission.PROFESSIONAL_VIEW_ALL,
    Permission.VISIT_READ,
    Permission.VISIT_VIEW_ALL,
    Permission.JOURNEY_READ,
    Permission.JOURNEY_VIEW_ALL,

    // Reportes financieros
    Permission.REPORT_COMPLETION,
    Permission.REPORT_PATIENT_STATS,
    Permission.REPORT_OPERATIONAL_KPIS,
    Permission.REPORT_FINANCIAL,

    // Obras sociales
    Permission.HEALTHCARE_PROVIDER_MANAGE,
  ],

  // ===== RECEPCIÓN - Gestión de confirmaciones =====
  'Recepcion': [
    // Pacientes (lectura y actualización de contactos)
    Permission.PATIENT_READ,
    Permission.PATIENT_UPDATE,
    Permission.PATIENT_VIEW_ALL,

    // Visitas (confirmación y gestión)
    Permission.VISIT_READ,
    Permission.VISIT_CONFIRM,
    Permission.VISIT_RESCHEDULE,
    Permission.VISIT_VIEW_ALL,

    // Profesionales (lectura de horarios)
    Permission.PROFESSIONAL_READ,
    Permission.PROFESSIONAL_VIEW_SCHEDULE,

    // Recorridos (lectura)
    Permission.JOURNEY_READ,
    Permission.JOURNEY_VIEW_ALL,

    // Zonas (lectura)
    Permission.ZONE_READ,
  ],

  // ===== OTROS ROLES CON ACCESO LIMITADO =====
  'Compras': [
    Permission.USER_READ,
    Permission.PROFESSIONAL_READ,
    Permission.REPORT_OPERATIONAL_KPIS,
  ],

  'Liquidaciones': [
    Permission.PROFESSIONAL_READ,
    Permission.PROFESSIONAL_VIEW_ALL,
    Permission.VISIT_READ,
    Permission.VISIT_VIEW_ALL,
    Permission.JOURNEY_READ,
    Permission.JOURNEY_VIEW_ALL,
    Permission.REPORT_PRODUCTIVITY,
    Permission.REPORT_PERFORMANCE,
    Permission.REPORT_FINANCIAL,
  ],

  'Reclamos': [
    Permission.PATIENT_READ,
    Permission.PATIENT_UPDATE,
    Permission.VISIT_READ,
    Permission.VISIT_UPDATE,
    Permission.VISIT_VIEW_ALL,
    Permission.AUDIT_VIEW,
  ],
};

/**
 * Middleware para verificar permisos específicos
 * @param requiredPermissions Lista de permisos requeridos (OR logic)
 * @param requireAll Si es true, requiere TODOS los permisos (AND logic)
 */
export const checkPermissions = (
  requiredPermissions: Permission | Permission[],
  requireAll: boolean = false
) => {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        return sendBadRequest(res, ERROR_MESSAGES.AUTH.USER_NOT_AUTHENTICATED);
      }

      if (!req.user.role) {
        return sendBadRequest(res, ERROR_MESSAGES.AUTH.USER_NO_ROLE);
      }

      const userRoleName = req.user.role.name;
      const userPermissions = ROLE_PERMISSIONS[userRoleName] || [];

      // Convertir a array si es un solo permiso
      const permissions = Array.isArray(requiredPermissions)
        ? requiredPermissions
        : [requiredPermissions];

      // Verificar permisos
      let hasPermission = false;

      if (requireAll) {
        // AND logic - necesita TODOS los permisos
        hasPermission = permissions.every(permission =>
          userPermissions.includes(permission)
        );
      } else {
        // OR logic - necesita AL MENOS UN permiso
        hasPermission = permissions.some(permission =>
          userPermissions.includes(permission)
        );
      }

      if (!hasPermission) {
        return sendForbidden(res, ERROR_MESSAGES.USER.INSUFFICIENT_PERMISSIONS);
      }

      // Agregar permisos al request para uso posterior
      req.userPermissions = userPermissions;

      next();
    } catch (error) {
      console.error('Error en checkPermissions:', error);
      return sendInternalErrorResponse(res);
    }
  };
};

/**
 * Helper para verificar si un usuario tiene un permiso específico
 */
export const hasPermission = (userRole: string, permission: Permission): boolean => {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return rolePermissions.includes(permission);
};

/**
 * Helper para obtener todos los permisos de un rol
 */
export const getRolePermissions = (roleName: string): Permission[] => {
  return ROLE_PERMISSIONS[roleName] || [];
};

/**
 * Middleware para verificar si el usuario puede acceder a recursos de otros usuarios
 */
export const checkResourceOwnership = (
  allowedRoles: string[] = ['Administrador', 'Coordinacion', 'Recursos Humanos']
) => {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user || !req.user.role) {
        return sendBadRequest(res, ERROR_MESSAGES.AUTH.USER_NOT_AUTHENTICATED);
      }

      const userRoleName = req.user.role.name;
      const requestedUserId = req.params.userId || req.body.userId || req.query.userId;
      const currentUserId = req.user.id;

      // Si es su propio recurso, siempre permitir
      if (requestedUserId === currentUserId) {
        return next();
      }

      // Verificar si el rol puede acceder a recursos de otros
      if (allowedRoles.includes(userRoleName)) {
        return next();
      }

      return sendForbidden(res, ERROR_MESSAGES.USER.INSUFFICIENT_PERMISSIONS);
    } catch (error) {
      console.error('Error en checkResourceOwnership:', error);
      return sendInternalErrorResponse(res);
    }
  };
};

// ===== MIDDLEWARES ESPECÍFICOS PRE-CONFIGURADOS =====

// Gestión de usuarios
export const requireUserManagement = checkPermissions([
  Permission.USER_CREATE,
  Permission.USER_UPDATE,
  Permission.USER_DELETE,
]);

export const requireUserView = checkPermissions(Permission.USER_READ);

// Gestión de pacientes
export const requirePatientManagement = checkPermissions([
  Permission.PATIENT_CREATE,
  Permission.PATIENT_UPDATE,
  Permission.PATIENT_DELETE,
]);

export const requirePatientView = checkPermissions(Permission.PATIENT_READ);

// Gestión de visitas
export const requireVisitManagement = checkPermissions([
  Permission.VISIT_CREATE,
  Permission.VISIT_UPDATE,
  Permission.VISIT_DELETE,
]);

export const requireVisitConfirmation = checkPermissions(Permission.VISIT_CONFIRM);

export const requireVisitCompletion = checkPermissions(Permission.VISIT_COMPLETE);

// Gestión de recorridos
export const requireJourneyManagement = checkPermissions([
  Permission.JOURNEY_CREATE,
  Permission.JOURNEY_UPDATE,
  Permission.JOURNEY_DELETE,
]);

export const requireJourneyControl = checkPermissions([
  Permission.JOURNEY_START,
  Permission.JOURNEY_END,
]);

// Reportes
export const requireFinancialReports = checkPermissions(Permission.REPORT_FINANCIAL);

export const requireProductivityReports = checkPermissions(Permission.REPORT_PRODUCTIVITY);

// Auditoría
export const requireAuditAccess = checkPermissions(Permission.AUDIT_VIEW);

// Sistema
export const requireSystemAdmin = checkPermissions([
  Permission.SYSTEM_MANAGE_ROLES,
  Permission.SYSTEM_MANAGE_HOLIDAYS,
  Permission.SYSTEM_SYNC_DATA,
], true); // Requiere TODOS los permisos

export const requireZoneManagement = checkPermissions([
  Permission.ZONE_CREATE,
  Permission.ZONE_UPDATE,
  Permission.ZONE_DELETE,
]);

export default checkPermissions;
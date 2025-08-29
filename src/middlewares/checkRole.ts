import { Response, NextFunction } from 'express';
import { ERROR_MESSAGES } from '../constants/messages/error.messages';
import { AuthRequest } from '../interfaces/auth.interface';
import {
  sendForbidden,
  sendBadRequest,
  sendInternalErrorResponse,
} from '../utils/commons/responseFunctions';

export const checkRole = (allowedRoles: string | string[]) => {
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

      const rolesArray = Array.isArray(allowedRoles)
        ? allowedRoles
        : [allowedRoles];

      const userRoleName = req.user.role.name;
      const hasPermission = rolesArray.includes(userRoleName);

      if (!hasPermission) {
        return sendForbidden(res, ERROR_MESSAGES.USER.INSUFFICIENT_PERMISSIONS);
      }

      next();
    } catch (error) {
      console.error('Error en checkRole:', error);
      return sendInternalErrorResponse(res);
    }
  };
};

export const requireAdmin = checkRole('Administrador');
export const requireCoordination = checkRole('Coordinacion');
export const requireProfessional = checkRole('Profesionales');
export const requireAccounting = checkRole('Contaduria');
export const requirePurchasing = checkRole('Compras');
export const requirePayroll = checkRole('Liquidaciones');

// ===== ROLES HOME OFFICE =====
export const requireSectorCoordinator = checkRole('Coordinador de Sector');
export const requireBilling = checkRole('Facturacion');
export const requireHR = checkRole('Recursos Humanos');
export const requireComplaints = checkRole('Reclamos');
export const requireReception = checkRole('Recepcion');

// ===== COMBINACIONES ÚTILES =====
export const requireAdminRoles = checkRole([
  'Administrador',
  'Coordinacion',
  'Contaduria',
  'Recursos Humanos',
]);

export const requireAnyCoordinator = checkRole([
  'Coordinacion',
  'Coordinador de Sector',
  'Administrador',
]);

export const requireFinancialAccess = checkRole([
  'Contaduria',
  'Facturacion',
  'Liquidaciones',
  'Administrador',
]);

export const requireProductivityViewer = checkRole([
  'Recursos Humanos',
  'Coordinador de Sector',
  'Coordinacion',
  'Administrador',
]);

export default checkRole;

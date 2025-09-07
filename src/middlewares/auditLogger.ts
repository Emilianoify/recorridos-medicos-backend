import { Request, Response, NextFunction } from 'express';
import { VisitChangeAuditModel } from '../models';
import { AuditAction } from '../enums/Audit';

interface AuditRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
  };
  auditData?: {
    entityType: string;
    entityId: string;
    action: AuditAction;
    oldValues?: any;
    newValues?: any;
    changeReason?: string;
  };
}

// Middleware para capturar datos de auditor�a
export const captureAuditData = (
  entityType: string,
  action: AuditAction,
  changeReason?: string
) => {
  return (req: AuditRequest, _res: Response, next: NextFunction) => {
    req.auditData = {
      entityType,
      action,
      entityId: req.params.id,
      changeReason: changeReason || `${action} ${entityType}`,
    };
    next();
  };
};

// Middleware para capturar valores anteriores (para updates)
export const captureOldValues = (model: any) => {
  return async (req: AuditRequest, _res: Response, next: NextFunction) => {
    try {
      if (req.params.id && req.auditData) {
        const oldEntity = await model.findByPk(req.params.id);
        if (oldEntity) {
          req.auditData.oldValues = oldEntity.toJSON();
        }
      }
      next();
    } catch (error) {
      console.error('Error capturando valores antiguos para auditor�a:', error);
      next(); // Continuar aunque falle la auditor�a
    }
  };
};

// Middleware para registrar cambios despu�s de la respuesta
export const logAuditChanges = async (
  req: AuditRequest,
  res: Response,
  next: NextFunction
) => {
  // Interceptar el m�todo json para capturar la respuesta
  const originalJson = res.json;

  res.json = function (data: any) {
    // Si la operaci�n fue exitosa y tenemos datos de auditor�a
    if (
      res.statusCode >= 200 &&
      res.statusCode < 300 &&
      req.auditData &&
      req.user
    ) {
      // Ejecutar auditor�a de forma as�ncrona para no bloquear la respuesta
      setImmediate(async () => {
        try {
          const auditRecord = {
            entityType: req.auditData!.entityType,
            entityId: req.auditData!.entityId || data.data?.id,
            action: req.auditData!.action,
            userId: req.user!.id,
            oldValues: req.auditData!.oldValues
              ? JSON.stringify(req.auditData!.oldValues)
              : null,
            newValues: data.data ? JSON.stringify(data.data) : null,
            changeReason: req.auditData!.changeReason,
            userAgent: req.get('User-Agent'),
            ipAddress: req.ip || req.connection.remoteAddress,
            endpoint: `${req.method} ${req.originalUrl}`,
            timestamp: new Date(),
          };

          await VisitChangeAuditModel.create(auditRecord);
        } catch (auditError) {
          console.error('Error registrando auditor�a:', auditError);
        }
      });
    }

    return originalJson.call(this, data);
  };

  next();
};

// Middleware combinado para auditor�a completa
export const auditLogger = (
  entityType: string,
  action: AuditAction,
  model?: any,
  changeReason?: string
) => {
  return [
    captureAuditData(entityType, action, changeReason),
    model
      ? captureOldValues(model)
      : (_req: Request, _res: Response, next: NextFunction) => next(),
    logAuditChanges,
  ];
};

// Middleware espec�fico para cambios de visitas
export const visitAuditLogger = (
  action: AuditAction,
  changeReason?: string
) => {
  return auditLogger('visit', action, null, changeReason);
};

// Funci�n para registro manual de auditor�a
export const manualAuditLog = async (
  entityType: string,
  entityId: string,
  action: AuditAction,
  userId: string,
  changeReason: string,
  oldValues?: any,
  newValues?: any,
  req?: Request
) => {
  try {
    const auditRecord = {
      entityType,
      entityId,
      action,
      userId,
      oldValues: oldValues ? JSON.stringify(oldValues) : null,
      newValues: newValues ? JSON.stringify(newValues) : null,
      changeReason,
      userAgent: req?.get('User-Agent') || 'System',
      ipAddress: req?.ip || req?.connection.remoteAddress || 'System',
      endpoint: req ? `${req.method} ${req.originalUrl}` : 'Manual',
      timestamp: new Date(),
    };

    await VisitChangeAuditModel.create(auditRecord);
  } catch (error) {
    console.error('Error en registro manual de auditor�a:', error);
  }
};

export default {
  captureAuditData,
  captureOldValues,
  logAuditChanges,
  auditLogger,
  visitAuditLogger,
  manualAuditLog,
};

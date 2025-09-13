import { Response } from 'express';
import { AuthRequest } from '../../interfaces/auth.interface';
import { ZodError } from 'zod';
import {
  sendBadRequest,
  sendInternalErrorResponse,
  sendSuccessResponse,
  sendNotFound,
} from '../../utils/commons/responseFunctions';
import { VisitChangeAuditModel, UserModel } from '../../models';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { Op, WhereOptions } from 'sequelize';
import {
  entityHistoryQuerySchema,
  getEntityHistoryParamsSchema,
} from '../../utils/validators/schemas/paginationSchemas';
import {
  IEntityAuditTrail,
  IEntitySummary,
  IVisitChangeAudit,
} from '../../interfaces/audit.interface';
import { AuditAction, AuditEntity } from '../../enums/Audit';
import { AUDIT_MESSAGES } from '../../constants/messages/audit.messages';
import { isValidUUID } from '../../utils/validators/schemas/uuidSchema';

export const getEntityHistory = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const validatedParams = getEntityHistoryParamsSchema.parse(req.params);
    const validatedQuery = entityHistoryQuerySchema.parse(req.query);

    const { entityType, entityId } = validatedParams;
    const { page, limit, fromDate, toDate, action } = validatedQuery;

    // Manual ID validation
    if (!entityId) {
      return sendBadRequest(res, ERROR_MESSAGES.GENERAL.MISSING_REQUIRED_FIELD);
    }
    if (!isValidUUID(entityId)) {
      return sendBadRequest(res, ERROR_MESSAGES.GENERAL.INVALID_UUID);
    }

    // Build where conditions
    const whereClause: WhereOptions = {
      entityType: entityType,
      entityId: entityId,
    };

    if (fromDate || toDate) {
      whereClause.changeDateTime = {};
      if (fromDate) {
        whereClause.changeDateTime[Op.gte] = new Date(fromDate);
      }
      if (toDate) {
        whereClause.changeDateTime[Op.lte] = new Date(`${toDate}T23:59:59.999Z`);
      }
    }

    if (action) {
      whereClause.action = action;
    }

    // Get audit trail for the entity
    const auditData = await VisitChangeAuditModel.findAndCountAll({
      where: whereClause,
      limit: limit,
      offset: (page - 1) * limit,
      order: [['changeDateTime', 'DESC']],
      include: [
        {
          model: UserModel,
          as: 'user',
          attributes: ['id', 'firstname', 'lastname', 'username'],
          required: false,
        },
      ],
    });

    if (auditData.count === 0) {
      return sendNotFound(res, ERROR_MESSAGES.AUDIT.NO_HISTORY_FOUND);
    }

    // Convert to proper interface
    const changes: IVisitChangeAudit[] = auditData.rows.map(
      audit => audit.toJSON() as IVisitChangeAudit
    );

    // Get entity creation and last modification info
    const firstChange = await VisitChangeAuditModel.findOne({
      where: {
        entityType: entityType,
        entityId: entityId,
        action: AuditAction.CREATE,
      },
      order: [['changeDateTime', 'ASC']],
      include: [
        {
          model: UserModel,
          as: 'user',
          attributes: ['firstname', 'lastname'],
          required: false,
        },
      ],
    });

    const lastChange = await VisitChangeAuditModel.findOne({
      where: {
        entityType: entityType,
        entityId: entityId,
      },
      order: [['changeDateTime', 'DESC']],
      include: [
        {
          model: UserModel,
          as: 'user',
          attributes: ['firstname', 'lastname'],
          required: false,
        },
      ],
    });

    // Calculate major vs minor changes
    const majorActions = [
      AuditAction.CREATE,
      AuditAction.DELETE,
      AuditAction.CANCEL,
      AuditAction.COMPLETE,
      AuditAction.CONFIRM,
    ];

    const majorChanges = await VisitChangeAuditModel.count({
      where: {
        entityType: entityType,
        entityId: entityId,
        action: { [Op.in]: majorActions },
      },
    });

    const totalChanges = await VisitChangeAuditModel.count({
      where: {
        entityType: entityType,
        entityId: entityId,
      },
    });

    const minorChanges = totalChanges - majorChanges;

    // Build summary
    if (!firstChange || !lastChange) {
      return sendNotFound(res, ERROR_MESSAGES.AUDIT.NO_HISTORY_FOUND);
    }
    const firstChangeData: IVisitChangeAudit =
      firstChange.toJSON() as IVisitChangeAudit;
    const lastChangeData: IVisitChangeAudit =
      lastChange.toJSON() as IVisitChangeAudit;

    const summary: IEntitySummary = {
      createdBy: firstChangeData?.user
        ? `${firstChangeData.user.firstname} ${firstChangeData.user.lastname}`
        : AUDIT_MESSAGES.COMPLIANCE.UNKNOWN_USER,
      lastModifiedBy: lastChangeData?.user
        ? `${lastChangeData.user.firstname} ${lastChangeData.user.lastname}`
        : AUDIT_MESSAGES.COMPLIANCE.UNKNOWN_USER,
      majorChanges,
      minorChanges,
    };

    // Get entity name based on entity type
    const entityTypeName = AUDIT_MESSAGES.ENTITY_NAMES[entityType as keyof typeof AUDIT_MESSAGES.ENTITY_NAMES] || entityType;
    const entityName = `${entityTypeName} ${entityId}`;

    const entityAuditTrail: IEntityAuditTrail = {
      entityType: entityType as AuditEntity,
      entityId: entityId,
      entityName: entityName,
      totalChanges: totalChanges,
      createdAt: firstChangeData
        ? new Date(firstChangeData.changeDateTime)
        : new Date(),
      lastModified: lastChangeData
        ? new Date(lastChangeData.changeDateTime)
        : new Date(),
      changes: changes,
      summary: summary,
    };

    const totalPages = Math.ceil(auditData.count / limit);

    const response = {
      entityHistory: entityAuditTrail,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: auditData.count,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      filters: {
        entityType: entityType,
        entityId: entityId,
        fromDate: fromDate || '',
        toDate: toDate || '',
        action: action || '',
      },
      statistics: {
        totalChanges: totalChanges,
        majorChanges: majorChanges,
        minorChanges: minorChanges,
        changesByAction: {}, // Could be populated with additional query
        averageChangesPerDay: 0, // Could be calculated based on date range
      },
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.AUDIT.ENTITY_HISTORY_FETCHED,
      response
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0].message;
      return sendBadRequest(res, firstError);
    }
    console.error('Error getting entity history:', error);
    return sendInternalErrorResponse(res);
  }
};

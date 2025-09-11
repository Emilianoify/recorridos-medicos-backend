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
import { Op } from 'sequelize';
import { 
  entityHistoryQuerySchema, 
  getEntityHistoryParamsSchema 
} from '../../utils/validators/schemas/paginationSchemas';
import { IEntityAuditTrail, IVisitChangeAudit } from '../../interfaces/audit.interface';
import { AuditAction, AuditEntity } from '../../enums/Audit';

interface IEntityHistoryWhereClause {
  entityType: AuditEntity;
  entityId: string;
  changeDateTime?: {
    [Op.gte]?: Date;
    [Op.lte]?: Date;
  };
  action?: AuditAction;
  [key: string]: unknown;
}

interface IEntitySummary {
  createdBy?: string;
  lastModifiedBy?: string;
  majorChanges: number;
  minorChanges: number;
}

export const getEntityHistory = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const validatedParams = getEntityHistoryParamsSchema.parse(req.params);
    const validatedQuery = entityHistoryQuerySchema.parse(req.query);
    
    const { entityType, entityId } = validatedParams;
    const { page, limit, fromDate, toDate, action } = validatedQuery;

    // Build where conditions using proper typing
    const whereClause: IEntityHistoryWhereClause = {
      entityType: entityType as AuditEntity,
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
      whereClause.action = action as AuditAction;
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
    const changes: IVisitChangeAudit[] = auditData.rows.map(audit => 
      audit.toJSON() as IVisitChangeAudit
    );

    // Get entity creation and last modification info
    const firstChange = await VisitChangeAuditModel.findOne({
      where: {
        entityType: entityType as AuditEntity,
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
        entityType: entityType as AuditEntity,
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
        entityType: entityType as AuditEntity,
        entityId: entityId,
        action: { [Op.in]: majorActions },
      },
    });

    const totalChanges = await VisitChangeAuditModel.count({
      where: {
        entityType: entityType as AuditEntity,
        entityId: entityId,
      },
    });

    const minorChanges = totalChanges - majorChanges;

    // Build summary
    const firstChangeData = firstChange ? firstChange.toJSON() as IVisitChangeAudit : null;
    const lastChangeData = lastChange ? lastChange.toJSON() as IVisitChangeAudit : null;

    const summary: IEntitySummary = {
      createdBy: firstChangeData?.user 
        ? `${firstChangeData.user.firstname} ${firstChangeData.user.lastname}` 
        : undefined,
      lastModifiedBy: lastChangeData?.user 
        ? `${lastChangeData.user.firstname} ${lastChangeData.user.lastname}` 
        : undefined,
      majorChanges,
      minorChanges,
    };

    // Get entity name (simplified - could be enhanced based on entity type)
    let entityName: string | undefined;
    // In a real implementation, you would query the appropriate model based on entityType
    // For now, we'll use a generic approach
    entityName = `${entityType} ${entityId}`;

    const entityAuditTrail: IEntityAuditTrail = {
      entityType: entityType as AuditEntity,
      entityId: entityId,
      entityName: entityName,
      totalChanges: totalChanges,
      createdAt: firstChangeData ? new Date(firstChangeData.changeDateTime) : new Date(),
      lastModified: lastChangeData ? new Date(lastChangeData.changeDateTime) : new Date(),
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
        fromDate: fromDate || null,
        toDate: toDate || null,
        action: action || null,
      },
      statistics: {
        totalChanges: totalChanges,
        majorChanges: majorChanges,
        minorChanges: minorChanges,
        changesByAction: {},  // Could be populated with additional query
        averageChangesPerDay: 0,  // Could be calculated based on date range
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
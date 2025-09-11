import { Response } from 'express';
import { AuthRequest } from '../../interfaces/auth.interface';
import { ZodError } from 'zod';
import {
  sendBadRequest,
  sendInternalErrorResponse,
  sendSuccessResponse,
} from '../../utils/commons/responseFunctions';
import { VisitChangeAuditModel, UserModel } from '../../models';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';

import { Model, Op, WhereOptions } from 'sequelize';
import { auditQuerySchema } from '../../utils/validators/schemas/paginationSchemas';
import { IVisitChangeAudit } from '../../interfaces/audit.interface';

export const getAuditTrail = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const validatedQuery = auditQuerySchema.parse(req.query);
    const {
      page,
      limit,
      entityType,
      entityId,
      userId,
      action,
      fromDate,
      toDate,
    } = validatedQuery;

    const whereClause: WhereOptions = {};

    if (entityType) {
      whereClause.entityType = entityType;
    }

    if (entityId) {
      whereClause.entityId = entityId;
    }

    if (userId) {
      whereClause.userId = userId;
    }

    if (action) {
      whereClause.action = action;
    }

    if (fromDate || toDate) {
      whereClause.createdAt = {};
      if (fromDate) {
        whereClause.createdAt[Op.gte] = new Date(fromDate);
      }
      if (toDate) {
        whereClause.createdAt[Op.lte] = new Date(`${toDate}T23:59:59.999Z`);
      }
    }

    const auditData = await VisitChangeAuditModel.findAndCountAll({
      where: whereClause,
      limit: limit,
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: UserModel,
          as: 'user',
          attributes: ['id', 'firstname', 'lastname', 'username'],
        },
      ],
    });

    const totalPages = Math.ceil(auditData.count / limit);

    const response = {
      auditTrail: auditData.rows.map((audit: Model<any, any>) => {
        const auditJson = audit.toJSON() as IVisitChangeAudit;
        return {
          id: auditJson.id,
          entityType: auditJson.entityType,
          entityId: auditJson.entityId,
          action: auditJson.action,
          fieldName: auditJson.fieldName,
          oldValue: auditJson.oldValue,
          newValue: auditJson.newValue,
          changeReason: auditJson.changeReason,
          changeDescription: auditJson.changeDescription,
          user: auditJson.user,
          userAgent: auditJson.userAgent,
          ipAddress: auditJson.ipAddress,
          relatedEntityId: auditJson.relatedEntityId,
        };
      }),
      pagination: {
        total: auditData.count,
        page: page,
        limit: limit,
        totalPages: totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      filters: {
        entityType: entityType || null,
        entityId: entityId || null,
        userId: userId || null,
        action: action || null,
        fromDate: fromDate || null,
        toDate: toDate || null,
      },
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.AUDIT.AUDIT_TRAIL_FETCHED,
      response
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0].message;
      return sendBadRequest(res, firstError);
    }
    console.error('Error fetching audit trail:', error);
    return sendInternalErrorResponse(res);
  }
};

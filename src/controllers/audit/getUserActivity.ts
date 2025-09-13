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
  userActivityQuerySchema,
  getUserActivityParamsSchema,
} from '../../utils/validators/schemas/paginationSchemas';
import {
  IActivityStatistics,
  IMostChangedEntity,
  IUserActivityReport,
  IVisitChangeAudit,
} from '../../interfaces/audit.interface';
import { AUDIT_MESSAGES } from '../../constants/messages/audit.messages';
import { CONFIG } from '../../constants/config';
import { isValidUUID } from '../../utils/validators/schemas/uuidSchema';

export const getUserActivity = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const validatedParams = getUserActivityParamsSchema.parse(req.params);
    const validatedQuery = userActivityQuerySchema.parse(req.query);

    const { userId } = validatedParams;
    const { page, limit, fromDate, toDate, entityType, action } =
      validatedQuery;

    // Manual ID validation
    if (!userId) {
      return sendBadRequest(res, ERROR_MESSAGES.USER.ID_REQUIRED);
    }
    if (!isValidUUID(userId)) {
      return sendBadRequest(res, ERROR_MESSAGES.USER.INVALID_ID);
    }

    // Verify user exists
    const userInstance = await UserModel.findByPk(userId);
    if (!userInstance) {
      return sendNotFound(res, ERROR_MESSAGES.USER.NOT_FOUND);
    }

    const user = userInstance.toJSON() as {
      id: string;
      firstname: string;
      lastname: string;
      username: string;
    };

    // Set default date range if not provided
    const defaultFromDate = new Date();
    defaultFromDate.setDate(defaultFromDate.getDate() - CONFIG.AUDIT.DEFAULT_DAYS_RANGE);

    const startDate = fromDate ? new Date(fromDate) : defaultFromDate;
    const endDate = toDate ? new Date(`${toDate}T23:59:59.999Z`) : new Date();

    // Build where conditions
    const whereClause: WhereOptions = {
      userId: userId,
    };

    if (fromDate || toDate) {
      whereClause.changeDateTime = {
        [Op.gte]: startDate,
        [Op.lte]: endDate,
      };
    }

    if (entityType) {
      whereClause.entityType = entityType;
    }

    if (action) {
      whereClause.action = action;
    }

    // Get paginated activity for the user
    const activityData = await VisitChangeAuditModel.findAndCountAll({
      where: whereClause,
      limit: limit,
      offset: (page - 1) * limit,
      order: [['changeDateTime', 'DESC']],
      attributes: [
        'id',
        'entityType',
        'entityId',
        'action',
        'fieldName',
        'oldValue',
        'newValue',
        'changeReason',
        'changeDescription',
        'changeDateTime',
        'ipAddress',
        'userAgent',
      ],
    });

    if (activityData.count === 0) {
      return sendNotFound(res, ERROR_MESSAGES.AUDIT.NO_ACTIVITY_FOUND);
    }

    // Convert to proper interface
    const recentActivity: IVisitChangeAudit[] = activityData.rows.map(
      audit => audit.toJSON() as IVisitChangeAudit
    );

    // Get comprehensive statistics for the user
    const totalChanges = await VisitChangeAuditModel.count({
      where: whereClause,
    });

    // Get unique entities count
    const uniqueEntitiesResult = await VisitChangeAuditModel.count({
      where: whereClause,
      distinct: true,
      col: 'entityId',
    });
    const uniqueEntities = Array.isArray(uniqueEntitiesResult)
      ? uniqueEntitiesResult.length
      : uniqueEntitiesResult;

    // Get action breakdown
    const actionBreakdownData = await VisitChangeAuditModel.findAll({
      where: whereClause,
      attributes: [
        'action',
        [VisitChangeAuditModel.sequelize!.fn('COUNT', '*'), 'count'],
      ],
      group: ['action'],
      order: [[VisitChangeAuditModel.sequelize!.literal('count'), 'DESC']],
    });

    const actionBreakdown: { [action: string]: number } = {};
    actionBreakdownData.forEach(item => {
      const itemData = item.toJSON() as { action: string; count: string };
      actionBreakdown[itemData.action] = parseInt(itemData.count);
    });

    // Get reason breakdown
    const reasonBreakdownData = await VisitChangeAuditModel.findAll({
      where: {
        ...whereClause,
        changeReason: { [Op.not]: null },
      },
      attributes: [
        'changeReason',
        [VisitChangeAuditModel.sequelize!.fn('COUNT', '*'), 'count'],
      ],
      group: ['changeReason'],
      order: [[VisitChangeAuditModel.sequelize!.literal('count'), 'DESC']],
    });

    const reasonBreakdown: { [reason: string]: number } = {};
    reasonBreakdownData.forEach(item => {
      const itemData = item.toJSON() as { changeReason: string; count: string };
      reasonBreakdown[itemData.changeReason] = parseInt(itemData.count);
    });

    // Get entity breakdown
    const entityBreakdownData = await VisitChangeAuditModel.findAll({
      where: whereClause,
      attributes: [
        'entityType',
        [VisitChangeAuditModel.sequelize!.fn('COUNT', '*'), 'count'],
      ],
      group: ['entityType'],
      order: [[VisitChangeAuditModel.sequelize!.literal('count'), 'DESC']],
    });

    const entityBreakdown: { [entityType: string]: number } = {};
    entityBreakdownData.forEach(item => {
      const itemData = item.toJSON() as { entityType: string; count: string };
      entityBreakdown[itemData.entityType] = parseInt(itemData.count);
    });

    // Get last activity
    const lastActivity = await VisitChangeAuditModel.findOne({
      where: { userId: userId },
      order: [['changeDateTime', 'DESC']],
      attributes: ['changeDateTime'],
    });

    // Calculate average changes per day
    const daysDiff = Math.max(
      1,
      Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      )
    );
    const averageChangesPerDay = Math.round(totalChanges / daysDiff);

    // Get most changed entity
    const mostChangedEntityData = await VisitChangeAuditModel.findOne({
      where: whereClause,
      attributes: [
        'entityType',
        'entityId',
        [VisitChangeAuditModel.sequelize!.fn('COUNT', '*'), 'changeCount'],
      ],
      group: ['entityType', 'entityId'],
      order: [
        [VisitChangeAuditModel.sequelize!.literal('changeCount'), 'DESC'],
      ],
    });

    let mostChangedEntity: IMostChangedEntity = {
      entityType: '',
      entityId: '',
      changeCount: 0,
    };

    if (mostChangedEntityData) {
      const entityData = mostChangedEntityData.toJSON() as {
        entityType: string;
        entityId: string;
        changeCount: string;
      };

      mostChangedEntity = {
        entityType: entityData.entityType,
        entityId: entityData.entityId,
        changeCount: parseInt(entityData.changeCount),
      };
    }

    // Get activity days count
    const activityDaysData = await VisitChangeAuditModel.findAll({
      where: whereClause,
      attributes: [
        [
          VisitChangeAuditModel.sequelize!.fn('DATE', 'changeDateTime'),
          'activityDate',
        ],
      ],
      group: [VisitChangeAuditModel.sequelize!.fn('DATE', 'changeDateTime')],
    });

    const activityDays = activityDaysData.length;

    // Build user activity report
    const userActivityReport: IUserActivityReport = {
      userId: userId,
      userName: `${user.firstname} ${user.lastname}`,
      totalChanges: totalChanges,
      actionBreakdown: actionBreakdown,
      reasonBreakdown: reasonBreakdown,
      entityBreakdown: entityBreakdown,
      lastActivity: lastActivity
        ? new Date(lastActivity.toJSON().changeDateTime)
        : new Date(),
      mostActiveDay: AUDIT_MESSAGES.ACTIVITY.NO_PEAK_DETECTED,
      averageChangesPerDay: averageChangesPerDay,
    };

    const statistics: IActivityStatistics = {
      totalChanges: totalChanges,
      uniqueEntities: uniqueEntities,
      activityDays: activityDays,
      peakActivityDay: AUDIT_MESSAGES.ACTIVITY.NO_PEAK_DETECTED,
      mostChangedEntity: mostChangedEntity,
    };

    const totalPages = Math.ceil(activityData.count / limit);

    const response = {
      userActivity: userActivityReport,
      recentActivity: recentActivity,
      statistics: statistics,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: activityData.count,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      filters: {
        userId: userId,
        fromDate: fromDate || '',
        toDate: toDate || '',
        entityType: entityType || '',
        action: action || '',
      },
      user: {
        id: user.id,
        name: `${user.firstname} ${user.lastname}`,
        username: user.username,
      },
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.AUDIT.USER_ACTIVITY_FETCHED,
      response
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0].message;
      return sendBadRequest(res, firstError);
    }
    console.error('Error getting user activity:', error);
    return sendInternalErrorResponse(res);
  }
};

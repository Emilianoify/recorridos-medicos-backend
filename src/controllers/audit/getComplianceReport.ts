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
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { Op, WhereOptions } from 'sequelize';
import { complianceReportQuerySchema } from '../../utils/validators/schemas/paginationSchemas';
import {
  IComplianceAuditReport,
  IComplianceSummary,
  IUserActivityReport,
  IVisitChangeAudit,
} from '../../interfaces/audit.interface';
import { AuditAction } from '../../enums/Audit';
import { ComplianceLevel } from '../../enums/ComplianceLevel';
import { CONFIG } from '../../constants/config';
import { AUDIT_MESSAGES } from '../../constants/messages/audit.messages';

export const getComplianceReport = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const query = req.query;
    if (!query || typeof query !== 'object') {
      return sendBadRequest(res, ERROR_MESSAGES.SERVER.INVALID_BODY);
    }

    const validatedQuery = complianceReportQuerySchema.parse(query);
    const { fromDate, toDate, entityType, criticalActionsOnly } =
      validatedQuery;

    // Set default date range if not provided
    const defaultFromDate = new Date();
    defaultFromDate.setDate(defaultFromDate.getDate() - CONFIG.AUDIT.DEFAULT_DAYS_RANGE);

    const startDate = fromDate ? new Date(fromDate) : defaultFromDate;
    const endDate = toDate ? new Date(`${toDate}T23:59:59.999Z`) : new Date();

    if (startDate >= endDate) {
      return sendBadRequest(res, ERROR_MESSAGES.GENERAL.INVALID_DATE_RANGE);
    }

    // Build base where conditions
    const whereClause: WhereOptions = {
      changeDateTime: {
        [Op.gte]: startDate,
        [Op.lte]: endDate,
      },
    };

    if (entityType) {
      whereClause.entityType = entityType;
    }

    // Critical actions using enum values
    const criticalActions = [AuditAction.DELETE, AuditAction.CANCEL];

    if (criticalActionsOnly) {
      whereClause.action = { [Op.in]: criticalActions };
    }

    // Get total statistics
    const totalChanges = await VisitChangeAuditModel.count({
      where: whereClause,
    });

    const totalEntities = await VisitChangeAuditModel.count({
      where: whereClause,
      distinct: true,
      col: 'entityId',
    });

    const entitiesWithChanges = await VisitChangeAuditModel.findAll({
      where: whereClause,
      attributes: ['entityId', 'entityType'],
      group: ['entityId', 'entityType'],
    });

    // Critical changes using enum values
    const criticalChanges = await VisitChangeAuditModel.count({
      where: {
        ...whereClause,
        action: { [Op.in]: criticalActions },
      },
    });

    // Unauthorized changes (no userId)
    const unauthorizedChanges = await VisitChangeAuditModel.count({
      where: {
        ...whereClause,
        userId: { [Op.is]: null },
      },
    });

    // Changes by compliance status
    const flaggedChanges = await VisitChangeAuditModel.count({
      where: {
        ...whereClause,
        [Op.or]: [
          { userId: { [Op.is]: null } },
          { action: { [Op.in]: criticalActions } },
          { changeReason: { [Op.is]: null } },
        ],
      },
    });

    const compliantChanges = totalChanges - flaggedChanges;
    const requiresReview = await VisitChangeAuditModel.count({
      where: {
        ...whereClause,
        action: { [Op.in]: criticalActions },
        changeDescription: { [Op.is]: null },
      },
    });

    // Top changers (users with most activity)
    const topChangersData = await VisitChangeAuditModel.findAll({
      where: whereClause,
      attributes: [
        'userId',
        [VisitChangeAuditModel.sequelize!.fn('COUNT', '*'), 'changeCount'],
      ],
      include: [
        {
          model: UserModel,
          as: 'user',
          attributes: ['id', 'firstname', 'lastname', 'username'],
          required: false,
        },
      ],
      group: ['userId', 'user.id'],
      order: [
        [VisitChangeAuditModel.sequelize!.literal('changeCount'), 'DESC'],
      ],
      limit: CONFIG.AUDIT.MAX_TOP_CHANGERS,
    });

    const topChangers: IUserActivityReport[] = await Promise.all(
      topChangersData.map(async item => {
        const itemData = item.toJSON() as IVisitChangeAudit & {
          changeCount: string;
        };
        const userId = itemData.userId;
        const userName = itemData.user
          ? `${itemData.user.firstname} ${itemData.user.lastname}`
          : AUDIT_MESSAGES.COMPLIANCE.UNKNOWN_USER;

        // Get detailed breakdown for this user
        const userChanges = await VisitChangeAuditModel.findAll({
          where: {
            ...whereClause,
            userId: userId,
          },
          attributes: ['action', 'changeReason', 'entityType'],
        });

        const actionBreakdown: { [action: string]: number } = {};
        const reasonBreakdown: { [reason: string]: number } = {};
        const entityBreakdown: { [entityType: string]: number } = {};

        userChanges.forEach(change => {
          const changeData = change.toJSON() as IVisitChangeAudit;

          actionBreakdown[changeData.action] =
            (actionBreakdown[changeData.action] || 0) + 1;

          if (changeData.changeReason) {
            reasonBreakdown[changeData.changeReason] =
              (reasonBreakdown[changeData.changeReason] || 0) + 1;
          }

          entityBreakdown[changeData.entityType] =
            (entityBreakdown[changeData.entityType] || 0) + 1;
        });

        const lastActivity = await VisitChangeAuditModel.findOne({
          where: { ...whereClause, userId: userId },
          order: [['changeDateTime', 'DESC']],
          attributes: ['changeDateTime'],
        });

        const daysDiff = Math.max(
          1,
          Math.ceil(
            (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
          )
        );

        return {
          userId: userId || AUDIT_MESSAGES.COMPLIANCE.SYSTEM_USER,
          userName: userName,
          totalChanges: parseInt(itemData.changeCount),
          actionBreakdown,
          reasonBreakdown,
          entityBreakdown,
          lastActivity: lastActivity
            ? new Date(lastActivity.toJSON().changeDateTime)
            : new Date(),
          mostActiveDay: AUDIT_MESSAGES.ACTIVITY.NO_PEAK_DETECTED,
          averageChangesPerDay: Math.round(
            parseInt(itemData.changeCount) / daysDiff
          ),
        };
      })
    );

    // Flagged activities (recent critical or unauthorized changes)
    const flaggedActivitiesData = await VisitChangeAuditModel.findAll({
      where: {
        ...whereClause,
        [Op.or]: [
          { userId: { [Op.is]: null } },
          { action: { [Op.in]: criticalActions } },
          { changeReason: { [Op.is]: null } },
        ],
      },
      include: [
        {
          model: UserModel,
          as: 'user',
          attributes: ['id', 'firstname', 'lastname', 'username'],
          required: false,
        },
      ],
      order: [['changeDateTime', 'DESC']],
      limit: CONFIG.AUDIT.MAX_FLAGGED_ACTIVITIES,
    });

    const flaggedActivities: IVisitChangeAudit[] = flaggedActivitiesData.map(
      activity => activity.toJSON() as IVisitChangeAudit
    );

    // Calculate compliance score and risk level
    const complianceScore =
      totalChanges > 0
        ? Math.round((compliantChanges / totalChanges) * 100)
        : 100;
    let riskLevel: ComplianceLevel;

    if (flaggedChanges > totalChanges * CONFIG.AUDIT.HIGH_RISK_THRESHOLD) {
      riskLevel = ComplianceLevel.HIGH;
    } else if (flaggedChanges > totalChanges * CONFIG.AUDIT.MEDIUM_RISK_THRESHOLD) {
      riskLevel = ComplianceLevel.MEDIUM;
    } else {
      riskLevel = ComplianceLevel.LOW;
    }

    const recommendations: string[] = [];
    if (unauthorizedChanges > 0) {
      recommendations.push(AUDIT_MESSAGES.RECOMMENDATIONS.IMPLEMENT_MANDATORY_AUTH);
    }
    if (criticalChanges > totalChanges * CONFIG.AUDIT.CRITICAL_CHANGES_THRESHOLD) {
      recommendations.push(AUDIT_MESSAGES.RECOMMENDATIONS.REVIEW_AUTHORIZATION_PROCESSES);
    }
    if (requiresReview > 0) {
      recommendations.push(AUDIT_MESSAGES.RECOMMENDATIONS.COMPLETE_CRITICAL_DOCUMENTATION);
    }

    const complianceReport: IComplianceAuditReport = {
      reportPeriod: {
        from: startDate,
        to: endDate,
      },
      totalEntities: entitiesWithChanges.length | totalEntities,
      entitiesWithChanges: entitiesWithChanges.length,
      totalChanges,
      criticalChanges,
      unauthorizedChanges,
      changesByCompliance: {
        compliant: compliantChanges,
        flagged: flaggedChanges,
        requiresReview,
      },
      topChangers,
      flaggedActivities,
    };

    const summary: IComplianceSummary = {
      complianceScore,
      riskLevel,
      recommendations,
    };

    const response = {
      complianceReport,
      summary,
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.AUDIT.COMPLIANCE_REPORT_FETCHED,
      response
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0].message;
      return sendBadRequest(res, firstError);
    }
    console.error('Error generating compliance report:', error);
    return sendInternalErrorResponse(res);
  }
};

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
import { AuditAction, AuditEntity } from '../../enums/Audit';
import { ComplianceLevel } from '../../enums/ComplianceLevel';

export const getComplianceReport = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const validatedQuery = complianceReportQuerySchema.parse(req.query);
    const { fromDate, toDate, entityType, criticalActionsOnly } =
      validatedQuery;

    // Set default date range if not provided (last 30 days)
    const defaultFromDate = new Date();
    defaultFromDate.setDate(defaultFromDate.getDate() - 30);

    const startDate = fromDate ? new Date(fromDate) : defaultFromDate;
    const endDate = toDate ? new Date(`${toDate}T23:59:59.999Z`) : new Date();

    if (startDate >= endDate) {
      return sendBadRequest(res, ERROR_MESSAGES.GENERAL.INVALID_DATE_RANGE);
    }

    // Build base where conditions using proper typing
    const whereClause: WhereOptions = {
      changeDateTime: {
        [Op.gte]: startDate,
        [Op.lte]: endDate,
      },
    };

    if (entityType) {
      whereClause.entityType = entityType as AuditEntity;
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
      limit: 10,
    });

    const topChangers: IUserActivityReport[] = await Promise.all(
      topChangersData.map(async item => {
        const itemData = item.toJSON() as IVisitChangeAudit & {
          changeCount: string;
        };
        const userId = itemData.userId;
        const userName = itemData.user
          ? `${itemData.user.firstname} ${itemData.user.lastname}`
          : 'Usuario desconocido';

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
          userId: userId || 'unknown',
          userName: userName,
          totalChanges: parseInt(itemData.changeCount),
          actionBreakdown,
          reasonBreakdown,
          entityBreakdown,
          lastActivity: lastActivity
            ? new Date(lastActivity.toJSON().changeDateTime)
            : new Date(),
          mostActiveDay: '',
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
      limit: 50,
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

    if (flaggedChanges > totalChanges * 0.1) {
      riskLevel = ComplianceLevel.HIGH;
    } else if (flaggedChanges > totalChanges * 0.05) {
      riskLevel = ComplianceLevel.MEDIUM;
    } else {
      riskLevel = ComplianceLevel.LOW;
    }

    const recommendations: string[] = [];
    if (unauthorizedChanges > 0) {
      recommendations.push(
        'Implementar autenticaci�n obligatoria para todos los cambios'
      );
    }
    if (criticalChanges > totalChanges * 0.05) {
      recommendations.push(
        'Revisar procesos de autorizaci�n para cambios cr�ticos'
      );
    }
    if (requiresReview > 0) {
      recommendations.push('Completar documentaci�n de cambios cr�ticos');
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

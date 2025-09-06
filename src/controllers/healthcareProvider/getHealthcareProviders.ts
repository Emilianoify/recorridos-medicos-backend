import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { AuthRequest } from '../../interfaces/auth.interface';
import {
  sendSuccessResponse,
  sendInternalErrorResponse,
  sendBadRequest,
} from '../../utils/commons/responseFunctions';
import { Response } from 'express';
import { Op } from 'sequelize';
import { HealthcareProviderModel } from '../../models';
import { IHealthcareProvider } from '../../interfaces/healthcareProvider.interface';

export const getHealthcareProviders = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      page: pageQuery = '1',
      limit: limitQuery = '10',
      isActive: isActiveQuery,
      search,
      hasCode,
    } = req.query;

    const page = Math.max(1, parseInt(pageQuery as string, 10) || 1);

    const limit = Math.min(
      50,
      Math.max(1, parseInt(limitQuery as string, 10) || 10)
    );

    let isActive: boolean | undefined;

    if (isActiveQuery !== undefined) {
      if (isActiveQuery === 'true') {
        isActive = true;
      } else if (isActiveQuery === 'false') {
        isActive = false;
      } else {
        return sendBadRequest(
          res,
          ERROR_MESSAGES.HEALTHCARE_PROVIDER.NOT_FOUND
        );
      }
    }

    const whereClause: any = {};

    if (isActive !== undefined) {
      whereClause.isActive = isActive;
    }

    if (search && typeof search === 'string' && search.trim().length > 0) {
      whereClause.name = {
        [Op.iLike]: `%${search.trim()}%`,
      };
    }

    if (hasCode !== undefined) {
      if (hasCode === 'true') {
        whereClause.code = {
          [Op.ne]: null,
        };
      } else {
        whereClause.code = null;
      }
    }

    const healthcareProvidersData =
      await HealthcareProviderModel.findAndCountAll({
        where: whereClause,
        limit: limit,
        offset: (page - 1) * limit,
        order: [['createdAt', 'DESC']],
        attributes: { exclude: ['deletedAt'] },
      });

    const totalPages = Math.ceil(healthcareProvidersData.count / limit);

    const response = {
      healthcareProviders: healthcareProvidersData.rows.map(
        (healthcareProviders: IHealthcareProvider | any) => ({
          id: healthcareProviders.id,
          name: healthcareProviders.name,
          code: healthcareProviders.code,
          isActive: healthcareProviders.isActive,
          createdAt: healthcareProviders.createdAt,
          updatedAt: healthcareProviders.updatedAt,
        })
      ),
      pagination: {
        total: healthcareProvidersData.count,
        page: Number(page),
        limit: Number(limit),
        totalPages: totalPages,
      },
    };

    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.HEALTHCARE_PROVIDER.HEALTHCARE_FETCHED,
      response
    );
  } catch (error) {
    console.error('Error fetching roles:', error);
    return sendInternalErrorResponse(res);
  }
};

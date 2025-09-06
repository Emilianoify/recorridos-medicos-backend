import { AuthRequest } from '../../interfaces/auth.interface';
import {
  sendBadRequest,
  sendInternalErrorResponse,
  sendSuccessResponse,
} from '../../utils/commons/responseFunctions';
import { Response } from 'express';
import { USER_STATE_VALUES } from '../../utils/validators/enumValidators';
import { UserState } from '../../enums/UserState';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { isValidUUID } from '../../utils/validators/schemas/uuidSchema';
import { Op } from 'sequelize';
import { ProfessionalModel, SpecialtyModel } from '../../models';
import { IProfessional } from '../../interfaces/professional.interface';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';

export const getProfessionals = async (req: AuthRequest, res: Response) => {
  try {
    const {
      page: pageQuery = '1',
      limit: limitQuery = '10',
      state: stateQuery,
      search,
      specialtyId,
      firstname,
      lastname,
      email,
    } = req.query;

    const page = Math.max(1, parseInt(pageQuery as string, 10) || 1);

    const limit = Math.min(
      100,
      Math.max(1, parseInt(limitQuery as string, 10) || 10)
    );

    const whereClause: any = {};

    if (stateQuery !== undefined) {
      if (USER_STATE_VALUES.includes(stateQuery as UserState)) {
        whereClause.state = stateQuery;
      } else {
        return sendBadRequest(res, ERROR_MESSAGES.PROFESSIONAL.INVALID_STATE);
      }
    }

    if (firstname) {
      whereClause.firstname = { [Op.iLike]: `%${firstname}%` };
    }

    if (lastname) {
      whereClause.lastname = { [Op.iLike]: `%${lastname}%` };
    }

    if (email) {
      whereClause.email = { [Op.iLike]: `%${email}%` };
    }

    if (specialtyId) {
      if (!isValidUUID(specialtyId as string)) {
        return sendBadRequest(res, ERROR_MESSAGES.SPECIALTY.INVALID_ID);
      }
      whereClause.specialtyId = specialtyId;
    }

    if (search && typeof search === 'string' && search.trim().length > 0) {
      const searchTerm = search.trim();
      whereClause[Op.or] = [
        { firstname: { [Op.iLike]: `%${searchTerm}%` } },
        { lastname: { [Op.iLike]: `%${searchTerm}%` } },
        { email: { [Op.iLike]: `%${searchTerm}%` } },

        {
          username: {
            [Op.and]: [{ [Op.ne]: null }, { [Op.iLike]: `%${searchTerm}%` }],
          },
        },
      ];
    }

    const professionalData = await ProfessionalModel.findAndCountAll({
      where: whereClause,
      limit: limit,
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['deletedAt', 'password'] },
      include: [
        {
          model: SpecialtyModel,
          as: 'specialty',
          attributes: ['id', 'name', 'description', 'isActive'],
        },
      ],
    });

    const totalPages = Math.ceil(professionalData.count / limit);

    const response = {
      professionals: professionalData.rows.map(
        (professional: IProfessional | any) => ({
          id: professional.id,
          firstname: professional.firstname,
          lastname: professional.lastname,
          username: professional.username,
          email: professional.email,
          phone: professional.phone,
          state: professional.state,
          specialty: professional.specialty,
          start_at: professional.start_at,
          finish_at: professional.finish_at,
          updatedAt: professional.updatedAt,
          createdAt: professional.createdAt,
        })
      ),
      pagination: {
        total: professionalData.count,
        page: page,
        limit: limit,
        totalPages: totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      filters: {
        state: stateQuery || null,
        specialtyId: specialtyId || null,
        search: search || null,
      },
    };
    return sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.PROFESSIONAL.PROFESSIONAL_FETCHED,
      response
    );
  } catch (error) {
    return sendInternalErrorResponse(res);
  }
};

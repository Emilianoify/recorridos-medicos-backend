import { Response } from 'express';
import { AuthRequest } from '../../interfaces/auth.interface';
import {
  sendBadRequest,
  sendInternalErrorResponse,
  sendNotFound,
  sendSuccessResponse,
} from '../../utils/commons/responseFunctions';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { isValidUUID } from '../../utils/validators/schemas/uuidSchema';
import { ZoneModel } from '../../models';
import { IZone } from '../../interfaces/zone.interface';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';

export const getZoneById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      return sendBadRequest(res, ERROR_MESSAGES.ZONE.ID_REQUIRED);
    }

    if (!isValidUUID(id)) {
      return sendBadRequest(res, ERROR_MESSAGES.ZONE.INVALID_ID);
    }

    const zoneInstance = await ZoneModel.findByPk(id);

    if (!zoneInstance) {
      return sendNotFound(res, ERROR_MESSAGES.ZONE.NOT_FOUND);
    }

    const zone: IZone = zoneInstance.toJSON() as IZone;

    const response = {
      zone: {
        id: zone.id,
        name: zone.name,
        description: zone.description,
        polygonCoordinates: zone.polygonCoordinates,
        isActive: zone.isActive,
        createdAt: zone.createdAt,
        updatedAt: zone.updatedAt,
      },
    };

    return sendSuccessResponse(res, SUCCESS_MESSAGES.ZONE.FETCHED, response);
  } catch (error) {
    return sendInternalErrorResponse(res);
  }
};

import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { AuthRequest } from '../../interfaces/auth.interface';
import {
  sendBadRequest,
  sendNotFound,
  sendSuccessResponse,
  sendInternalErrorResponse,
} from '../../utils/commons/responseFunctions';
import { Response } from 'express';
import { isValidUUID } from '../../utils/validators/schemas/uuidSchema';
import { ZoneModel } from '../../models';
import { IZone } from '../../interfaces/zone.interface';

export const restoreZone = async (
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
    const deletedZoneInstance = await ZoneModel.findOne({
      where: { id },
      paranoid: false,
    });
    
    const deletedZone: IZone | null = deletedZoneInstance ? (deletedZoneInstance.toJSON() as IZone) : null;

    if (!deletedZone) {
      return sendNotFound(res, ERROR_MESSAGES.ZONE.NOT_FOUND);
    }

    if (deletedZone.deletedAt === null) {
      return sendBadRequest(res, ERROR_MESSAGES.ZONE.ALREADY_ACTIVE);
    }

    await ZoneModel.restore({
      where: { id },
    });

    const restoredZoneInstance = await ZoneModel.findByPk(id);
    const restoredZone: IZone = restoredZoneInstance?.toJSON() as IZone;

    if (!restoredZone) {
      return sendNotFound(res, ERROR_MESSAGES.ZONE.NOT_FOUND);
    }

    const response = {
      zone: {
        id: restoredZone!.id,
        name: restoredZone!.name,
        description: restoredZone!.description,
        polygonCoordinates: restoredZone!.polygonCoordinates,
        isActive: restoredZone!.isActive,
        createdAt: restoredZone!.createdAt,
        updatedAt: restoredZone!.updatedAt,
      },
    };

    return sendSuccessResponse(res, SUCCESS_MESSAGES.ZONE.RESTORED, response);
  } catch (error) {
    return sendInternalErrorResponse(res);
  }
};

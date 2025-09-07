import { Response } from 'express';
import { AuthRequest } from '../../interfaces/auth.interface';
import { ZodError } from 'zod';
import {
  sendBadRequest,
  sendConflict,
  sendInternalErrorResponse,
  sendNotFound,
  sendSuccessResponse,
} from '../../utils/commons/responseFunctions';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { isValidUUID } from '../../utils/validators/schemas/uuidSchema';
import { updateZoneSchema } from '../../utils/validators/schemas/zoneSchemas';
import {
  existingZone,
  existingZoneName,
} from '../../utils/validators/dbValidators';
import { ZoneModel } from '../../models';
import { IZone } from '../../interfaces/zone.interface';

export const updateZone = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const body = req.body;

    if (!id) {
      return sendBadRequest(res, ERROR_MESSAGES.ZONE.ID_REQUIRED);
    }

    if (!isValidUUID(id)) {
      return sendBadRequest(res, ERROR_MESSAGES.ZONE.INVALID_ID);
    }

    if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
      return sendBadRequest(res, ERROR_MESSAGES.SERVER.EMPTY_BODY);
    }

    const zoneExists = await existingZone(id);
    if (!zoneExists) {
      return sendNotFound(res, ERROR_MESSAGES.ZONE.NOT_FOUND);
    }

    const validData = updateZoneSchema.parse(body);
    const { name, description, polygonCoordinates, isActive } = validData;

    if (name) {
      const currentZoneInstance = await ZoneModel.findByPk(id);
      const currentZone: IZone = currentZoneInstance?.toJSON() as IZone;

      if (currentZone && currentZone.name !== name) {
        const nameExists = await existingZoneName(name);
        if (nameExists) {
          return sendConflict(res, ERROR_MESSAGES.ZONE.NAME_ALREADY_IN_USE);
        }
      }
    }

    const [affectedCount, updatedZones] = await ZoneModel.update(
      {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(polygonCoordinates !== undefined && { polygonCoordinates }),
        ...(isActive !== undefined && { isActive }),
      },
      {
        where: { id },
        returning: true,
      }
    );

    if (affectedCount === 0) {
      return sendNotFound(res, ERROR_MESSAGES.ZONE.NOT_FOUND);
    }

    const updatedZone: IZone = updatedZones[0].toJSON() as IZone;

    const response = {
      zone: {
        id: updatedZone.id,
        name: updatedZone.name,
        description: updatedZone.description,
        polygonCoordinates: updatedZone.polygonCoordinates,
        isActive: updatedZone.isActive,
        createdAt: updatedZone.createdAt,
        updatedAt: updatedZone.updatedAt,
      },
    };

    return sendSuccessResponse(res, SUCCESS_MESSAGES.ZONE.UPDATED, response);
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0].message;
      return sendBadRequest(res, firstError);
    }

    console.error('Error updating zone:', error);
    return sendInternalErrorResponse(res);
  }
};

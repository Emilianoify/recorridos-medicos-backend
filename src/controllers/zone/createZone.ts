import { ZodError } from 'zod';
import { AuthRequest } from '../../interfaces/auth.interface';
import {
  sendBadRequest,
  sendConflict,
  sendInternalErrorResponse,
  sendSuccessResponse,
} from '../../utils/commons/responseFunctions';
import { Response } from 'express';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';
import { createZoneSchema } from '../../utils/validators/schemas/zoneSchemas';
import { existingZoneName } from '../../utils/validators/dbValidators';
import { validateZoneCoordinates } from '../../utils/validators/zoneValidators'; // 🆕 Import del util
import { ZoneModel } from '../../models';
import { IZone } from '../../interfaces/zone.interface';

export const createZone = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const body = req.body;

    if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
      return sendBadRequest(res, ERROR_MESSAGES.SERVER.EMPTY_BODY);
    }

    const validZone = createZoneSchema.parse(body);
    const { name, description, polygonCoordinates, isActive } = validZone;

    const zoneExists = await existingZoneName(name);
    if (zoneExists) {
      return sendConflict(res, ERROR_MESSAGES.ZONE.NAME_ALREADY_IN_USE);
    }

    const coordinatesValidation = validateZoneCoordinates(polygonCoordinates);
    if (!coordinatesValidation.isValid) {
      return sendBadRequest(res, coordinatesValidation.errorMessage!);
    }

    const createdZone = (await ZoneModel.create({
      name,
      description: description,
      polygonCoordinates: polygonCoordinates,
      isActive: isActive !== undefined ? isActive : true,
    })) as unknown as IZone;

    const response = {
      zone: {
        id: createdZone.id,
        name: createdZone.name,
        description: createdZone.description,
        polygonCoordinates: createdZone.polygonCoordinates,
        isActive: createdZone.isActive,
        createdAt: createdZone.createdAt,
        updatedAt: createdZone.updatedAt,
      },
    };

    return sendSuccessResponse(res, SUCCESS_MESSAGES.ZONE.CREATED, response);
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0].message;
      return sendBadRequest(res, firstError);
    }

    console.error('Error creating zone:', error);
    return sendInternalErrorResponse(res);
  }
};

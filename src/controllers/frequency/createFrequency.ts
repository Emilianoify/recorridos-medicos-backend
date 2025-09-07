import { Request, Response } from 'express';
import { FrequencyModel } from '../../models';
import { createFrequencySchema } from '../../utils/validators/schemas/frequencySchemas';
import { ERROR_MESSAGES } from '../../constants/messages/error.messages';
import { SUCCESS_MESSAGES } from '../../constants/messages/success.messages';

export const createFrequency = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = createFrequencySchema.parse(req.body);

    // Verificar si ya existe una frecuencia con el mismo nombre
    const existingFrequency = await FrequencyModel.findOne({
      where: { name: validatedData.name },
      paranoid: false,
    });

    if (existingFrequency) {
      res.status(400).json({
        success: false,
        message: 'El nombre de la frecuencia ya está en uso',
        error: ERROR_MESSAGES.FREQUENCY.INVALID_NAME,
      });
      return;
    }

    const newFrequency = await FrequencyModel.create(validatedData);

    res.status(201).json({
      success: true,
      message: SUCCESS_MESSAGES.FREQUENCY.FREQUENCY_CREATED,
      data: newFrequency,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        error: error.errors,
      });
      return;
    }

    console.error('Error al crear frecuencia:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: ERROR_MESSAGES.SERVER.INTERNAL_ERROR,
    });
  }
};
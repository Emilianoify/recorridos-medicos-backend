import { ERROR_MESSAGES } from '../constants/messages/error.messages';
import { Response, Request, NextFunction } from 'express';

export const handleJsonError = (
  error: any,
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  if (error instanceof SyntaxError) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON format',
      details: 'The request body contains malformed JSON',
    });
  }
  return next(error);
};

export const handle404 = (_req: Request, res: Response) => {
  res.status(404).json({ message: ERROR_MESSAGES.ROUTING.NOT_FOUND });
};

export const handleServerError = (
  _error: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
};

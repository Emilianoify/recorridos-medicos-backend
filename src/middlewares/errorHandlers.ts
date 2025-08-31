import { ERROR_MESSAGES } from '../constants/messages/error.messages';
import { Response, Request, NextFunction } from 'express';
import { sendBadRequest, sendNotFound, sendInternalErrorResponse } from '../utils/commons/responseFunctions';

export const handleJsonError = (
  error: any,
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (error instanceof SyntaxError) {
    return sendBadRequest(res, ERROR_MESSAGES.SERVER.INVALID_BODY);
  }
  return next(error);
};

export const handle404 = (_req: Request, res: Response) => {
  return sendNotFound(res, ERROR_MESSAGES.ROUTING.NOT_FOUND);
};

export const handleServerError = (
  _error: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  return sendInternalErrorResponse(res);
};

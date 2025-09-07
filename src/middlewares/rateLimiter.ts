import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { ERROR_MESSAGES } from '../constants/messages/error.messages';

// Rate limiter para autenticaci�n (m�s restrictivo)
const authRateLimiter = new RateLimiterMemory({
  keyPrefix: 'auth_limit',
  points: 5, // 5 intentos
  duration: 300, // por 5 minutos
  blockDuration: 900, // bloquear por 15 minutos
  execEvenly: true, // distribuir los puntos uniformemente
});

// Rate limiter general para API (menos restrictivo)
const generalRateLimiter = new RateLimiterMemory({
  keyPrefix: 'api_limit',
  points: 100, // 100 requests
  duration: 60, // por 1 minuto
  blockDuration: 60, // bloquear por 1 minuto
  execEvenly: true,
});

// Rate limiter estricto para operaciones cr�ticas
const strictRateLimiter = new RateLimiterMemory({
  keyPrefix: 'strict_limit',
  points: 10, // 10 requests
  duration: 60, // por 1 minuto
  blockDuration: 300, // bloquear por 5 minutos
});

// Rate limiter para creaci�n de entidades
const createRateLimiter = new RateLimiterMemory({
  keyPrefix: 'create_limit',
  points: 20, // 20 creaciones
  duration: 300, // por 5 minutos
  blockDuration: 300, // bloquear por 5 minutos
});

// Middleware factory para rate limiting
const createRateLimitMiddleware = (limiter: RateLimiterMemory) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = req.ip || req.connection.remoteAddress || 'unknown';

      await limiter.consume(key);
      next();
    } catch (rejRes: any) {
      const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;

      res.set('Retry-After', String(secs));
      res.status(429).json({
        success: false,
        message: 'Demasiadas solicitudes. Intenta nuevamente m�s tarde.',
        error: ERROR_MESSAGES.SERVER.INTERNAL_ERROR,
        retryAfter: secs,
      });
    }
  };
};

// Middleware espec�ficos exportados
export const authRateLimit = createRateLimitMiddleware(authRateLimiter);
export const generalRateLimit = createRateLimitMiddleware(generalRateLimiter);
export const strictRateLimit = createRateLimitMiddleware(strictRateLimiter);
export const createRateLimit = createRateLimitMiddleware(createRateLimiter);

// Rate limiter por usuario autenticado
export const userBasedRateLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = (req as any).user;
    const key = user ? `user_${user.id}` : req.ip;

    await generalRateLimiter.consume(key!!);
    next();
  } catch (rejRes: any) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;

    res.set('Retry-After', String(secs));
    res.status(429).json({
      success: false,
      message: 'L�mite de solicitudes por usuario excedido.',
      error: ERROR_MESSAGES.SERVER.INTERNAL_ERROR,
      retryAfter: secs,
    });
  }
};

// Rate limiter para endpoints de b�squeda
const searchRateLimiter = new RateLimiterMemory({
  keyPrefix: 'search_limit',
  points: 50, // 50 b�squedas
  duration: 60, // por 1 minuto
  blockDuration: 120, // bloquear por 2 minutos
});

export const searchRateLimit = createRateLimitMiddleware(searchRateLimiter);

// Rate limiter para reportes (m�s restrictivo por ser operaciones costosas)
const reportRateLimiter = new RateLimiterMemory({
  keyPrefix: 'report_limit',
  points: 5, // 5 reportes
  duration: 300, // por 5 minutos
  blockDuration: 600, // bloquear por 10 minutos
});

export const reportRateLimit = createRateLimitMiddleware(reportRateLimiter);

export default {
  authRateLimit,
  generalRateLimit,
  strictRateLimit,
  createRateLimit,
  userBasedRateLimit,
  searchRateLimit,
  reportRateLimit,
};

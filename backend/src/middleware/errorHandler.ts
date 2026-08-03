import type { NextFunction, Request, Response } from 'express';

import { config } from '../config';
import { AppError } from '../errors/AppError';
import { logger } from '../lib/logger';

const GENERIC_MESSAGE = 'Internal server error';

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new AppError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction): void {
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;
  const exposeMessage = isAppError && err.isOperational;

  logger.error(
    {
      err,
      statusCode,
      method: req.method,
      url: req.originalUrl,
    },
    err instanceof Error ? err.message : 'Unknown error thrown',
  );

  // express's default handler closes a half-written response
  if (res.headersSent) {
    return next(err);
  }

  res.status(statusCode).json({
    error: {
      message: exposeMessage ? err.message : GENERIC_MESSAGE,
      ...(config.isProduction ? {} : { stack: err instanceof Error ? err.stack : undefined }),
    },
  });
}

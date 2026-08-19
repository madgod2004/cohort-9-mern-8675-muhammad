import type { NextFunction, Request, Response } from 'express';

import { AUTH_COOKIE } from '../controllers/auth.controller';
import { AppError } from '../errors/AppError';
import { verifyToken } from '../lib/jwt';

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const token: unknown = req.cookies?.[AUTH_COOKIE];

  if (typeof token !== 'string' || token.length === 0) {
    next(new AppError(401, 'Authentication required'));
    return;
  }

  try {
    const payload = verifyToken(token);
    req.user = { id: payload.userId };
    next();
  } catch {
    next(new AppError(401, 'Invalid or expired session'));
  }
}

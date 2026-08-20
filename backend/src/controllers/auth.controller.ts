import type { CookieOptions, Request, Response } from 'express';

import { config } from '../config';
import type { LoginInput, SignupInput } from '../schemas/auth.schema';
import * as authService from '../services/auth.service';

export const AUTH_COOKIE = 'token';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: config.isProduction,
  sameSite: 'strict',
  maxAge: SEVEN_DAYS_MS,
  path: '/',
};

// validateBody has already parsed req.body against the matching schema
export async function signup(req: Request, res: Response): Promise<void> {
  const result = await authService.signup(req.body as SignupInput);

  res.cookie(AUTH_COOKIE, result.token, cookieOptions);
  res.status(201).json({ user: result.user });
}

export async function login(req: Request, res: Response): Promise<void> {
  const result = await authService.login(req.body as LoginInput);

  res.cookie(AUTH_COOKIE, result.token, cookieOptions);
  res.status(200).json({ user: result.user });
}

export function logout(_req: Request, res: Response): void {
  res.clearCookie(AUTH_COOKIE, cookieOptions);
  res.status(200).json({ message: 'Logged out' });
}

// authenticate runs first, so req.user is guaranteed present here
export async function me(req: Request, res: Response): Promise<void> {
  const user = await authService.getCurrentUser(req.user!.id);
  res.status(200).json({ user });
}

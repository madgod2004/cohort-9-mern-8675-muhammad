import { Router } from 'express';

import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/authenticate';
import { validateBody } from '../middleware/validate';
import { loginSchema, signupSchema } from '../schemas/auth.schema';

export const authRouter = Router();

authRouter.post('/signup', validateBody(signupSchema), authController.signup);
authRouter.post('/login', validateBody(loginSchema), authController.login);
authRouter.post('/logout', authController.logout);
authRouter.get('/me', authenticate, authController.me);

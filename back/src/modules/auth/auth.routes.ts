import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { requireAuth } from '../../middlewares/auth.js';
import { googleAuthSchema } from './auth.schemas.js';
import { loginWithGoogle } from './auth.service.js';

export const authRouter = Router();

authRouter.post(
  '/google',
  asyncHandler(async (req, res) => {
    const body = googleAuthSchema.parse(req.body);
    const session = await loginWithGoogle(body.credential);
    res.status(200).json(session);
  })
);

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ user: req.user });
  })
);

import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getCatalogs } from './catalogs.repository.js';

export const catalogsRouter = Router();

catalogsRouter.use(requireAuth);

catalogsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const program = typeof req.query.program === 'string' ? req.query.program : undefined;
    const semester = typeof req.query.semester === 'string' ? req.query.semester : undefined;
    const catalogs = await getCatalogs({ program, semester });
    res.json({ catalogs });
  })
);

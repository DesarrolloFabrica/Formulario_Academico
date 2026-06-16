import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { requireAuth } from './middlewares/auth.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { catalogsRouter } from './modules/catalogs/catalogs.routes.js';
import { evaluationsRouter } from './modules/evaluations/evaluations.routes.js';

export const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 150,
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'formulario-academico-api' });
});

app.use('/auth', authRouter);
app.use('/catalogos', catalogsRouter);
app.use('/evaluaciones', evaluationsRouter);
app.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

app.use(errorHandler);

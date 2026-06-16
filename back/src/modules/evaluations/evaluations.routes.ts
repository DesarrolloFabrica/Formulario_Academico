import { Router } from 'express';
import { requireAdmin, requireAuth } from '../../middlewares/auth.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { HttpError } from '../../utils/httpError.js';
import {
  createEvaluation,
  findEvaluationById,
  getEvaluationSummary,
  getProfessorRankings,
  getSubjectStats,
  hasEvaluationForSubjectProfessorDay,
  listAllEvaluations,
  listEvaluations
} from './evaluations.repository.js';
import { evaluationSchema } from './evaluations.schemas.js';

export const evaluationsRouter = Router();

evaluationsRouter.use(requireAuth);

evaluationsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = evaluationSchema.parse(req.body);
    const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString();
    const userAgent = req.headers['user-agent'] ?? null;

    const evaluation = await createEvaluation({
      ...body,
      userId: req.user!.id,
      ipAddress,
      userAgent
    });

    res.status(201).json({ evaluation });
  })
);

evaluationsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const evaluations = await listEvaluations(req.user!.id);
    res.json({ evaluations });
  })
);

evaluationsRouter.get(
  '/admin/dashboard',
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const [summary, professorRankings, subjectStats, evaluations] = await Promise.all([
      getEvaluationSummary(),
      getProfessorRankings(),
      getSubjectStats(),
      listAllEvaluations()
    ]);

    res.json({ summary, professorRankings, subjectStats, evaluations });
  })
);

evaluationsRouter.get(
  '/availability',
  asyncHandler(async (req, res) => {
    const subject = typeof req.query.subject === 'string' ? req.query.subject : '';
    const professorName = typeof req.query.professorName === 'string' ? req.query.professorName : '';
    const classDate = typeof req.query.classDate === 'string' ? req.query.classDate : '';

    if (!subject || !professorName || !classDate) {
      res.status(400).json({ message: 'Materia, profesor y fecha son requeridos' });
      return;
    }

    const exists = await hasEvaluationForSubjectProfessorDay({
      userId: req.user!.id,
      subject,
      professorName,
      classDate
    });

    res.json({
      available: !exists,
      message: exists ? 'Ya calificaste esta materia con este profesor en esta fecha' : null
    });
  })
);

evaluationsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw new HttpError(400, 'Id de evaluacion invalido');

    const evaluation = await findEvaluationById(id, req.user!.id);
    if (!evaluation) throw new HttpError(404, 'Evaluacion no encontrada');
    res.json({ evaluation });
  })
);

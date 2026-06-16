import { z } from 'zod';

const rating = z.coerce.number().int().min(1).max(5);
const requiredText = z.string().trim().min(2).max(250);
const longText = z.string().trim().min(5).max(1500);
const timeText = z.string().regex(/^\d{2}:\d{2}$/, 'Hora invalida');

export const evaluationSchema = z.object({
  fullName: requiredText,
  email: z.string().trim().email(),
  documentNumber: z.string().trim().min(5).max(40),
  academicProgram: requiredText,
  semester: z.string().trim().min(1).max(20),
  shift: z.string().trim().max(80).optional().nullable(),
  classProgram: requiredText,
  classSemester: z.string().trim().min(1).max(20),
  subject: requiredText,
  classSchedule: z.string().trim().min(3).max(120).optional(),
  classStartTime: timeText,
  classEndTime: timeText,
  classDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha invalida'),
  professorName: requiredText,
  modality: z.enum(['Presencial', 'Virtual', 'Hibrida']),
  campusOrRoom: z.string().trim().max(150).optional().nullable(),
  virtualClassLink: z.string().trim().url().optional().or(z.literal('')).nullable(),
  clarityRating: rating,
  topicMasteryRating: rating,
  punctualityRating: rating,
  classDynamicsRating: rating,
  resourcesRating: rating,
  interactionRating: rating,
  overallRating: rating,
  bestPartComment: longText,
  improvementComment: longText,
  generalComment: longText,
  wouldRecommend: z.boolean(),
  recommendationReason: longText
}).superRefine((data, ctx) => {
  if (data.classStartTime >= data.classEndTime) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['classEndTime'],
      message: 'La hora fin debe ser mayor a la hora inicio'
    });
  }
});

export type EvaluationInput = z.infer<typeof evaluationSchema>;

import { pool } from '../../db/pool.js';
import { HttpError } from '../../utils/httpError.js';
import type { EvaluationInput } from './evaluations.schemas.js';

export type Evaluation = EvaluationInput & {
  id: number;
  userId: number;
  submittedAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  updatedAt: string;
  userName?: string;
  googleEmail?: string;
};

const mapEvaluation = (row: Record<string, unknown>): Evaluation => ({
  id: Number(row.id),
  userId: Number(row.user_id),
  fullName: String(row.full_name),
  email: String(row.email),
  documentNumber: String(row.document_number),
  academicProgram: String(row.academic_program),
  semester: String(row.student_semester),
  shift: row.shift ? String(row.shift) : null,
  classProgram: String(row.class_program),
  classSemester: String(row.class_semester),
  subject: String(row.subject),
  classSchedule: String(row.class_schedule),
  classStartTime: String(row.class_start_time).slice(0, 5),
  classEndTime: String(row.class_end_time).slice(0, 5),
  classDate: String(row.class_date).slice(0, 10),
  professorName: String(row.professor_name),
  modality: row.modality as EvaluationInput['modality'],
  campusOrRoom: row.campus_or_room ? String(row.campus_or_room) : null,
  virtualClassLink: row.virtual_class_link ? String(row.virtual_class_link) : null,
  clarityRating: Number(row.clarity_rating),
  topicMasteryRating: Number(row.topic_mastery_rating),
  punctualityRating: Number(row.punctuality_rating),
  classDynamicsRating: Number(row.class_dynamics_rating),
  resourcesRating: Number(row.resources_rating),
  interactionRating: Number(row.interaction_rating),
  overallRating: Number(row.overall_rating),
  bestPartComment: String(row.best_part_comment),
  improvementComment: String(row.improvement_comment),
  generalComment: String(row.general_comment),
  wouldRecommend: Boolean(row.would_recommend),
  recommendationReason: String(row.recommendation_reason),
  submittedAt: String(row.submitted_at),
  ipAddress: row.ip_address ? String(row.ip_address) : null,
  userAgent: row.user_agent ? String(row.user_agent) : null,
  createdAt: String(row.created_at),
  updatedAt: String(row.updated_at),
  userName: row.user_name ? String(row.user_name) : undefined,
  googleEmail: row.google_email ? String(row.google_email) : undefined
});

export async function createEvaluation(input: EvaluationInput & {
  userId: number;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  try {
    const result = await pool.query(
      `
        INSERT INTO evaluations (
          user_id, full_name, email, document_number, academic_program, student_semester, shift,
          class_program, class_semester, subject, class_schedule, class_start_time, class_end_time,
          class_date, professor_name,
          modality, campus_or_room, virtual_class_link, clarity_rating, topic_mastery_rating,
          punctuality_rating, class_dynamics_rating, resources_rating, interaction_rating,
          overall_rating, best_part_comment, improvement_comment, general_comment,
          would_recommend, recommendation_reason, submitted_at, ip_address, user_agent
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13,
          $14, $15, $16, $17, $18,
          $19, $20, $21, $22,
          $23, $24, $25, $26,
          $27, $28, $29, $30, NOW(), $31, $32
        )
        RETURNING *
      `,
      [
        input.userId,
        input.fullName,
        input.email,
        input.documentNumber,
        input.academicProgram,
        input.semester,
        input.shift || null,
        input.classProgram,
        input.classSemester,
        input.subject,
        `${input.classStartTime} - ${input.classEndTime}`,
        input.classStartTime,
        input.classEndTime,
        input.classDate,
        input.professorName,
        input.modality,
        input.campusOrRoom || null,
        input.virtualClassLink || null,
        input.clarityRating,
        input.topicMasteryRating,
        input.punctualityRating,
        input.classDynamicsRating,
        input.resourcesRating,
        input.interactionRating,
        input.overallRating,
        input.bestPartComment,
        input.improvementComment,
        input.generalComment,
        input.wouldRecommend,
        input.recommendationReason,
        input.ipAddress || null,
        input.userAgent || null
      ]
    );

    return mapEvaluation(result.rows[0]);
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
      throw new HttpError(409, 'Ya enviaste una evaluacion para esta clase');
    }

    throw error;
  }
}

export async function listEvaluations(userId: number) {
  const result = await pool.query(
    `
      SELECT e.*, u.name as user_name, u.email as google_email
      FROM evaluations e
      INNER JOIN users u ON u.id = e.user_id
      WHERE e.user_id = $1
      ORDER BY e.created_at DESC
      LIMIT 100
    `,
    [userId]
  );
  return result.rows.map(mapEvaluation);
}

export async function findEvaluationById(id: number, userId: number) {
  const result = await pool.query(
    `
      SELECT e.*, u.name as user_name, u.email as google_email
      FROM evaluations e
      INNER JOIN users u ON u.id = e.user_id
      WHERE e.id = $1 AND e.user_id = $2
    `,
    [id, userId]
  );
  return result.rows[0] ? mapEvaluation(result.rows[0]) : null;
}

export async function hasEvaluationForSubjectProfessorDay(input: {
  userId: number;
  subject: string;
  professorName: string;
  classDate: string;
}) {
  const result = await pool.query(
    `
      SELECT id
      FROM evaluations
      WHERE user_id = $1
        AND lower(trim(subject)) = lower(trim($2))
        AND lower(trim(professor_name)) = lower(trim($3))
        AND class_date = $4
      LIMIT 1
    `,
    [input.userId, input.subject, input.professorName, input.classDate]
  );

  return Boolean(result.rowCount);
}

export async function listAllEvaluations() {
  const result = await pool.query(
    `
      SELECT e.*, u.name as user_name, u.email as google_email
      FROM evaluations e
      INNER JOIN users u ON u.id = e.user_id
      ORDER BY e.created_at DESC
      LIMIT 500
    `
  );
  return result.rows.map(mapEvaluation);
}

export async function getEvaluationSummary() {
  const result = await pool.query(
    `
      SELECT
        COUNT(*)::int as total_evaluations,
        COUNT(DISTINCT professor_name)::int as total_professors,
        COUNT(DISTINCT subject)::int as total_subjects,
        COALESCE(ROUND(AVG(overall_rating)::numeric, 2), 0)::float as average_overall,
        COALESCE(ROUND(AVG(clarity_rating)::numeric, 2), 0)::float as average_clarity,
        COALESCE(ROUND(AVG(topic_mastery_rating)::numeric, 2), 0)::float as average_topic_mastery,
        COALESCE(ROUND(AVG(punctuality_rating)::numeric, 2), 0)::float as average_punctuality,
        COALESCE(ROUND(AVG(class_dynamics_rating)::numeric, 2), 0)::float as average_class_dynamics,
        COALESCE(ROUND(AVG(resources_rating)::numeric, 2), 0)::float as average_resources,
        COALESCE(ROUND(AVG(interaction_rating)::numeric, 2), 0)::float as average_interaction,
        COALESCE(ROUND((AVG(CASE WHEN would_recommend THEN 1 ELSE 0 END) * 100)::numeric, 2), 0)::float as recommendation_rate
      FROM evaluations
    `
  );
  const row = result.rows[0] as Record<string, unknown>;

  return {
    totalEvaluations: Number(row.total_evaluations),
    totalProfessors: Number(row.total_professors),
    totalSubjects: Number(row.total_subjects),
    averageOverall: Number(row.average_overall),
    averageClarity: Number(row.average_clarity),
    averageTopicMastery: Number(row.average_topic_mastery),
    averagePunctuality: Number(row.average_punctuality),
    averageClassDynamics: Number(row.average_class_dynamics),
    averageResources: Number(row.average_resources),
    averageInteraction: Number(row.average_interaction),
    recommendationRate: Number(row.recommendation_rate)
  };
}

export async function getProfessorRankings() {
  const result = await pool.query(
    `
      SELECT
        professor_name,
        COUNT(*)::int as total_evaluations,
        COALESCE(ROUND(AVG(overall_rating)::numeric, 2), 0)::float as average_overall,
        COALESCE(ROUND(AVG(clarity_rating)::numeric, 2), 0)::float as average_clarity,
        COALESCE(ROUND(AVG(topic_mastery_rating)::numeric, 2), 0)::float as average_topic_mastery,
        COALESCE(ROUND(AVG(punctuality_rating)::numeric, 2), 0)::float as average_punctuality,
        COALESCE(ROUND((AVG(CASE WHEN would_recommend THEN 1 ELSE 0 END) * 100)::numeric, 2), 0)::float as recommendation_rate
      FROM evaluations
      GROUP BY professor_name
      ORDER BY average_overall DESC, total_evaluations DESC, professor_name ASC
      LIMIT 100
    `
  );

  return result.rows.map((row: Record<string, unknown>) => ({
    professorName: String(row.professor_name),
    totalEvaluations: Number(row.total_evaluations),
    averageOverall: Number(row.average_overall),
    averageClarity: Number(row.average_clarity),
    averageTopicMastery: Number(row.average_topic_mastery),
    averagePunctuality: Number(row.average_punctuality),
    recommendationRate: Number(row.recommendation_rate)
  }));
}

export async function getSubjectStats() {
  const result = await pool.query(
    `
      SELECT
        subject,
        COUNT(*)::int as total_evaluations,
        COALESCE(ROUND(AVG(overall_rating)::numeric, 2), 0)::float as average_overall
      FROM evaluations
      GROUP BY subject
      ORDER BY total_evaluations DESC, average_overall DESC, subject ASC
      LIMIT 100
    `
  );

  return result.rows.map((row: Record<string, unknown>) => ({
    subject: String(row.subject),
    totalEvaluations: Number(row.total_evaluations),
    averageOverall: Number(row.average_overall)
  }));
}

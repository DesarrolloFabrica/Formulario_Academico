import { pool } from '../../db/pool.js';

export type CatalogOption = {
  id: string;
  name: string;
};

const mapOption = (row: Record<string, unknown>): CatalogOption => ({
  id: String(row.id),
  name: String(row.name)
});

async function listOptions(table: string, orderBy = 'name ASC') {
  const result = await pool.query(`
    SELECT id, name
    FROM ${table}
    WHERE active = TRUE
    ORDER BY ${orderBy}
  `);

  return result.rows.map(mapOption);
}

async function listSubjects(program?: string, semester?: string) {
  if (!program || !semester) return [];

  const result = await pool.query(
    `
      SELECT sub.id, sub.name
      FROM subjects sub
      INNER JOIN academic_programs p ON p.id = sub.program_id
      INNER JOIN academic_semesters sem ON sem.id = sub.semester_id
      WHERE sub.active = TRUE
        AND p.name = $1
        AND sem.name = $2
      ORDER BY sub.name ASC
    `,
    [program, semester]
  );

  return result.rows.map(mapOption);
}

export async function getCatalogs(filters: { program?: string; semester?: string } = {}) {
  const [programs, semesters, subjects, schedules, professors, modalities, campuses, shifts] = await Promise.all([
    listOptions('academic_programs'),
    listOptions('academic_semesters', 'name::int ASC'),
    listSubjects(filters.program, filters.semester),
    listOptions('class_schedules'),
    listOptions('professors'),
    listOptions('class_modalities'),
    listOptions('campuses'),
    listOptions('shifts')
  ]);

  return {
    programs,
    semesters,
    subjects,
    schedules,
    professors,
    modalities,
    campuses,
    shifts
  };
}

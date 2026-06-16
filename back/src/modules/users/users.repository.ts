import { pool } from '../../db/pool.js';

export type User = {
  id: number;
  googleId: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  picture: string | null;
  createdAt: string;
  updatedAt: string;
};

const mapUser = (row: Record<string, unknown>): User => ({
  id: Number(row.id),
  googleId: String(row.google_id),
  name: String(row.name),
  email: String(row.email),
  role: row.role === 'admin' ? 'admin' : 'student',
  picture: row.picture ? String(row.picture) : null,
  createdAt: String(row.created_at),
  updatedAt: String(row.updated_at)
});

export async function upsertUser(input: {
  googleId: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  picture?: string | null;
}) {
  const result = await pool.query(
    `
      INSERT INTO users (google_id, name, email, role, picture)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (google_id)
      DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        role = EXCLUDED.role,
        picture = EXCLUDED.picture,
        updated_at = NOW()
      RETURNING *
    `,
    [input.googleId, input.name, input.email, input.role, input.picture ?? null]
  );

  return mapUser(result.rows[0]);
}

export async function findUserById(id: number) {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0] ? mapUser(result.rows[0]) : null;
}

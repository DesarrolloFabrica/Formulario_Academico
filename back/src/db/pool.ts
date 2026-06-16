import pg from 'pg';
import { env } from '../config/env.js';

const ssl =
  env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : undefined;

export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  ssl,
  max: 10,
  idleTimeoutMillis: 30_000
});

import { Pool } from "pg";

let _pool: Pool | null = null;

export const getPool = async () => {
  if (!_pool) {
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    });

    // Create tables if they don't exist
    await _pool.query(`
      CREATE TABLE IF NOT EXISTS quiz (
        id SERIAL PRIMARY KEY,
        index INTEGER NOT NULL,
        question TEXT NOT NULL,
        answer_a TEXT NOT NULL,
        answer_b TEXT NOT NULL,
        answer_c TEXT NOT NULL,
        answer_d TEXT NOT NULL,
        correct_answer CHAR(1) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }
  return _pool;
};


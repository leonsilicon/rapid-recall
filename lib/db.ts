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
        group_id INTEGER NOT NULL,
        question TEXT NOT NULL,
        wrong_answer_1 TEXT NOT NULL,
        wrong_answer_2 TEXT NOT NULL,
        wrong_answer_3 TEXT NOT NULL,
        correct_answer TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }
  return _pool;
};


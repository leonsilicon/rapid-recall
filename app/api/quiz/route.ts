import { getPool } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const index = searchParams.get("index");

  const pool = await getPool();

  if (index) {
    const questions = await pool.query(
      "SELECT * FROM quiz WHERE index = $1 ORDER BY id ASC",
      [index]
    );

    if (questions.rows.length === 0) {
      return new Response("No quiz found with that index", { status: 404 });
    }

    return new Response(JSON.stringify(questions.rows), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const { rows } = await pool.query(
    "SELECT * FROM quiz ORDER BY index DESC, id ASC LIMIT 1"
  );

  if (rows.length === 0) {
    return new Response("No quizzes found", { status: 404 });
  }

  const latestIndex = rows[0].index;
  const questions = await pool.query(
    "SELECT * FROM quiz WHERE index = $1 ORDER BY id ASC",
    [latestIndex]
  );

  return new Response(JSON.stringify(questions.rows), {
    headers: { "Content-Type": "application/json" },
  });
}

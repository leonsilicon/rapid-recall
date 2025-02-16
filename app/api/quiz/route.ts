import { getPool } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get("group_id");

  const pool = await getPool();

  if (groupId) {
    const questions = await pool.query(
      "SELECT * FROM quiz WHERE group_id = $1 ORDER BY id ASC",
      [groupId]
    );

    if (questions.rows.length === 0) {
      return new Response("No quiz found with that group_id", { status: 404 });
    }

    return new Response(JSON.stringify(questions.rows), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const { rows } = await pool.query(
    "SELECT * FROM quiz ORDER BY group_id DESC, id ASC LIMIT 1"
  );

  if (rows.length === 0) {
    return new Response("No quizzes found", { status: 404 });
  }

  const latestGroupId = rows[0].group_id;
  const questions = await pool.query(
    "SELECT * FROM quiz WHERE group_id = $1 ORDER BY id ASC",
    [latestGroupId]
  );

  return new Response(JSON.stringify(questions.rows), {
    headers: { "Content-Type": "application/json" },
  });
}

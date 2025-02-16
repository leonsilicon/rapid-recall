// ./app/api/chat/route.ts
import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import { getPool } from "@/lib/db";

// Create an OpenAI API client (that's edge friendly!)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const base64 = buffer.toString("base64");

  // Ask OpenAI for a streaming chat completion given the prompt
  const response = await openai.beta.chat.completions.parse({
    model: "gpt-4o",
    max_tokens: 150,
    messages: [
      {
        role: "system",
        content:
          "You are an expert at analyzing images of handwritten or typed notes and converting them into effective multiple choice quiz questions. When given an image of notes, create 3-5 quiz questions based on the key concepts, each with 4 answer choices where only one is correct. Make the incorrect choices plausible but clearly wrong to someone who understands the material. Format the output as a numbered list of questions with lettered answer choices (A,B,C,D). Mark the correct answer at the end of each question.",
      },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64}`,
            },
          },
        ],
      },
    ],
    response_format: zodResponseFormat(
      z.object({
        questions: z.array(
          z.object({
            question: z.string(),
            answerA: z.string(),
            answerB: z.string(),
            answerC: z.string(),
            answerD: z.string(),
            correctAnswer: z.enum(["A", "B", "C", "D"]),
          })
        ),
      }),
      "QuizQuestions"
    ),
  });

  const quiz = response.choices[0].message.parsed;

  if (!quiz) {
    return new Response("No quiz found", { status: 400 });
  }

  const pool = await getPool();
  const { rows } = await pool.query('SELECT COUNT(*) FROM quiz');
  const index = parseInt(rows[0].count);

  for (const question of quiz.questions) {
    await pool.query(
      "INSERT INTO quiz (index, question, answer_a, answer_b, answer_c, answer_d, correct_answer) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [
        index,
        question.question,
        question.answerA,
        question.answerB,
        question.answerC,
        question.answerD,
        question.correctAnswer,
      ]
    );
  }

  console.log(quiz.questions);

  return new Response(JSON.stringify(quiz.questions), {
    headers: { "Content-Type": "application/json" },
  });
}

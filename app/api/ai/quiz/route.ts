
import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Sign in required." },
        { status: 401 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini AI service is not configured." },
        { status: 503 }
      );
    }

    const body = await req.json().catch(() => null);

    const subject =
      typeof body?.subject === "string"
        ? body.subject.slice(0, 120)
        : "Pharmacy";

    const questionCount = [10, 20, 30].includes(body?.questionCount)
      ? body.questionCount
      : 20;

    const source =
      typeof body?.sourceText === "string"
        ? body.sourceText.slice(0, 18000)
        : "";

    if (source.trim().length < 100) {
      return NextResponse.json(
        { error: "Paste at least 100 characters of study material." },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",

      contents: `
Generate a pharmacy education quiz using ONLY the supplied study material.

Subject: ${subject}

Required number of questions: ${questionCount}

Study material:
${source}

Return a JSON object with this exact structure:

{
  "title": "Quiz title",
  "questions": [
    {
      "question": "Question text",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "answerIndex": 0,
      "explanation": "Explanation supported by the study material.",
      "sourceExcerpt": "A short supporting excerpt from the study material."
    }
  ]
}

IMPORTANT RULES:
1. Generate exactly ${questionCount} questions.
2. Every question must have exactly four options.
3. answerIndex must be 0, 1, 2, or 3.
4. Exactly one option must be correct.
5. Explanations must be supported by the supplied material.
6. Do not invent facts or introduce outside information.
7. Avoid repeating questions.
8. Make questions suitable for university pharmacy students.
9. Return valid JSON only.
`,

      config: {
        responseMimeType: "application/json",
        temperature: 0.4,
      },
    });

    const raw = response.text;

    if (!raw) {
      throw new Error("Gemini returned an empty response.");
    }

    const quiz = JSON.parse(raw);

    if (
      !quiz ||
      typeof quiz.title !== "string" ||
      !Array.isArray(quiz.questions) ||
      quiz.questions.length !== questionCount
    ) {
      throw new Error(
        `Gemini did not return exactly ${questionCount} questions.`
      );
    }

    for (const question of quiz.questions) {
      if (
        typeof question.question !== "string" ||
        !Array.isArray(question.options) ||
        question.options.length !== 4 ||
        question.options.some(
          (option: unknown) => typeof option !== "string"
        ) ||
        !Number.isInteger(question.answerIndex) ||
        question.answerIndex < 0 ||
        question.answerIndex > 3 ||
        typeof question.explanation !== "string" ||
        typeof question.sourceExcerpt !== "string"
      ) {
        throw new Error("Gemini returned an invalid question format.");
      }
    }

    return NextResponse.json({ quiz });
  } catch (error) {
    console.error("Gemini quiz generation error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Quiz generation failed. Please try again.",
      },
      { status: 500 }
    );
  }
}

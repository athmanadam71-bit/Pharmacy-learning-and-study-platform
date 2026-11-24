
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Please sign in before saving your quiz." },
        { status: 401 }
      );
    }

    const body = await req.json();

    const { subject, quiz, answers } = body;

    if (
      typeof subject !== "string" ||
      !quiz ||
      typeof quiz.title !== "string" ||
      !Array.isArray(quiz.questions) ||
      !Array.isArray(answers)
    ) {
      return NextResponse.json(
        { error: "Invalid quiz submission." },
        { status: 400 }
      );
    }

    const questions = quiz.questions;

    if (
      questions.length === 0 ||
      answers.length !== questions.length
    ) {
      return NextResponse.json(
        { error: "The quiz answers are incomplete." },
        { status: 400 }
      );
    }

    let correctAnswers = 0;

    for (let index = 0; index < questions.length; index++) {
      const question = questions[index];
      const selectedAnswer = answers[index];

      if (
        !question ||
        typeof question.question !== "string" ||
        !Array.isArray(question.options) ||
        question.options.length !== 4 ||
        !Number.isInteger(question.answerIndex) ||
        question.answerIndex < 0 ||
        question.answerIndex > 3 ||
        typeof question.explanation !== "string" ||
        typeof question.sourceExcerpt !== "string" ||
        !Number.isInteger(selectedAnswer) ||
        selectedAnswer < 0 ||
        selectedAnswer > 3
      ) {
        return NextResponse.json(
          { error: `Invalid answer data for question ${index + 1}.` },
          { status: 400 }
        );
      }

      if (selectedAnswer === question.answerIndex) {
        correctAnswers++;
      }
    }

    const totalQuestions = questions.length;
    const percentage = Math.round(
      (correctAnswers / totalQuestions) * 100
    );

    const { data, error } = await supabase
      .from("quiz_attempts")
      .insert({
        user_id: user.id,
        subject: subject.slice(0, 120),
        quiz_title: quiz.title.slice(0, 200),
        score: percentage,
        total_questions: totalQuestions,
        quiz_data: quiz,
        answers,
      })
      .select("id, score, total_questions, created_at")
      .single();

    if (error) {
      console.error("Quiz attempt save error:", error);

      return NextResponse.json(
        { error: "Could not save your quiz result." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      attempt: data,
      correctAnswers,
      percentage,
    });
  } catch (error) {
    console.error("Quiz attempt API error:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred while saving your result." },
      { status: 500 }
    );
  }
}



"use client";

import { useState } from "react";

type Question = {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  sourceExcerpt: string;
};

type Quiz = {
  title: string;
  questions: Question[];
};

export function QuizBuilder() {
  const [subject, setSubject] = useState("Pharmacognosy");
  const [source, setSource] = useState("");
  const [questionCount, setQuestionCount] = useState(20);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [current, setCurrent] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function generate() {
    setBusy(true);
    setError("");
    setQuiz(null);
    setAnswers({});
    setCurrent(0);
    setSubmitted(false);

    try {
      const response = await fetch("/api/ai/quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject,
          sourceText: source,
          questionCount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Quiz generation failed.");
      }

      if (
        !data.quiz ||
        !Array.isArray(data.quiz.questions) ||
        data.quiz.questions.length !== questionCount
      ) {
        throw new Error(
          `The generated quiz does not contain exactly ${questionCount} questions.`
        );
      }

      setQuiz(data.quiz);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setBusy(false);
    }
  }

  function selectAnswer(optionIndex: number) {
    if (submitted) return;

    setAnswers((previous) => ({
      ...previous,
      [current]: optionIndex,
    }));
  }

   async function submitQuiz() {
  if (!quiz || saving) return;

  if (Object.keys(answers).length !== quiz.questions.length) {
    setError(
      `Please answer all ${quiz.questions.length} questions before submitting.`
    );
    return;
  }

  setError("");
  setSaving(true);

  try {
    const selectedAnswers = quiz.questions.map(
      (_, index) => answers[index]
    );

    const response = await fetch("/api/quiz-attempts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subject,
        quiz,
        answers: selectedAnswers,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Could not save your quiz result.");
    }

    setSubmitted(true);
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Your quiz result could not be saved. Please try again."
    );
  } finally {
    setSaving(false);
  }
}

  function restartQuiz() {
    setAnswers({});
    setCurrent(0);
    setSubmitted(false);
    setError("");
  }

  const question = quiz?.questions[current];
  const totalQuestions = quiz?.questions.length ?? questionCount;

  const score = quiz
    ? quiz.questions.reduce(
        (total, item, index) =>
          total + (answers[index] === item.answerIndex ? 1 : 0),
        0
      )
    : 0;

  const percentage =
    quiz && quiz.questions.length > 0
      ? Math.round((score / quiz.questions.length) * 100)
      : 0;

  return (
    <section className="card" style={{ maxWidth: 900 }}>
      {!quiz && (
        <>
          <h2>Create your practice quiz</h2>

          <label htmlFor="quiz-subject">Subject</label>
          <input
            id="quiz-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Enter subject"
          />

          <label
            htmlFor="quiz-count"
            style={{ display: "block", marginTop: 18 }}
          >
            Number of questions
          </label>

          <select
            id="quiz-count"
            value={questionCount}
            onChange={(e) => setQuestionCount(Number(e.target.value))}
            disabled={busy}
            style={{
              width: "100%",
              padding: 12,
              marginTop: 8,
              border: "1px solid #d1d5db",
              borderRadius: 8,
              background: "#ffffff",
              color: "#1f2937",
            }}
          >
            <option value={10}>10 questions</option>
            <option value={20}>20 questions</option>
            <option value={30}>30 questions</option>
          </select>

          <label
            htmlFor="quiz-source"
            style={{ display: "block", marginTop: 18 }}
          >
            Paste your study notes
          </label>

          <textarea
            id="quiz-source"
            rows={14}
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="Paste at least 100 characters of lecture notes here..."
          />

          <button
            type="button"
            style={{ marginTop: 12 }}
            disabled={busy || source.trim().length < 100}
            onClick={generate}
          >
            {busy
              ? "Generating your quiz..."
              : `Generate ${questionCount}-question quiz`}
          </button>

          <p className="muted">
            Your quiz will contain {questionCount} multiple-choice questions
            based on your supplied study notes.
          </p>
        </>
      )}

      {error && (
        <p role="alert" style={{ color: "#dc2626", marginTop: 12 }}>
          {error}
        </p>
      )}

      {quiz && question && !submitted && (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <h2>{quiz.title}</h2>
            <strong>
              Question {current + 1} of {totalQuestions}
            </strong>
          </div>

          <div
            style={{
              height: 8,
              background: "#e5e7eb",
              borderRadius: 20,
              overflow: "hidden",
              margin: "16px 0",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${((current + 1) / totalQuestions) * 100}%`,
                background: "#7654d6",
                transition: "width 0.2s",
              }}
            />
          </div>

          <h3 style={{ marginTop: 24 }}>
            {current + 1}. {question.question}
          </h3>

          <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
            {question.options.map((option, index) => {
              const selected = answers[current] === index;

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => selectAnswer(index)}
                  style={{
                    textAlign: "left",
                    padding: 16,
                    borderRadius: 10,
                    border: selected
                      ? "2px solid #7654d6"
                      : "1px solid #d1d5db",
                    background: selected ? "#f0ebff" : "#ffffff",
                    color: "#1f2937",
                    cursor: "pointer",
                  }}
                >
                  <strong>{String.fromCharCode(65 + index)}.</strong>{" "}
                  {option}
                  {selected ? " ✓" : ""}
                </button>
              );
            })}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              marginTop: 28,
            }}
          >
            <button
              type="button"
              disabled={current === 0}
              onClick={() => setCurrent((value) => value - 1)}
            >
              Previous
            </button>

            {current < totalQuestions - 1 ? (
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setCurrent((value) => value + 1);
                }}
              >
                Next question
              </button>
            ) : (
              <button
   type="button"
  onClick={submitQuiz}
  disabled={saving}
>
  {saving ? "Saving your results..." : "Submit quiz"}
</button>

            )}
          </div>

          <p className="muted" style={{ marginTop: 16 }}>
            Answered: {Object.keys(answers).length} / {totalQuestions}
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {quiz.questions.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  setError("");
                  setCurrent(index);
                }}
                style={{
                  minWidth: 34,
                  padding: 7,
                  background:
                    current === index
                      ? "#7654d6"
                      : answers[index] !== undefined
                        ? "#e9e2ff"
                        : "#f3f4f6",
                  color: current === index ? "#ffffff" : "#1f2937",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                }}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </>
      )}

      {quiz && submitted && (
        <>
          <h2>Quiz results</h2>

          <div
            style={{
              padding: 24,
              borderRadius: 12,
              background: "#f3efff",
              margin: "18px 0",
              textAlign: "center",
            }}
          >
            <h1 style={{ fontSize: 42, margin: 0 }}>
              {score} / {totalQuestions}
            </h1>
            <h3>{percentage}%</h3>
            <p>
              {percentage >= 80
                ? "Excellent performance!"
                : percentage >= 50
                  ? "Good effort. Keep revising."
                  : "Keep studying and try again."}
            </p>
          </div>

          <h3>Answer review</h3>

          <div style={{ display: "grid", gap: 18 }}>
            {quiz.questions.map((item, index) => {
              const correct = answers[index] === item.answerIndex;

              return (
                <div
                  key={index}
                  style={{
                    padding: 16,
                    border: "1px solid #d1d5db",
                    borderRadius: 10,
                  }}
                >
                  <strong>
                    {index + 1}. {item.question}
                  </strong>

                  <p
                    style={{
                      color: correct ? "#15803d" : "#dc2626",
                      fontWeight: 600,
                    }}
                  >
                    {correct ? "Correct" : "Incorrect"}
                  </p>

                  <p>
                    Your answer:{" "}
                    {answers[index] !== undefined
                      ? item.options[answers[index]]
                      : "Not answered"}
                  </p>

                  <p>
                    Correct answer:{" "}
                    <strong>{item.options[item.answerIndex]}</strong>
                  </p>

                  <p>
                    <strong>Explanation:</strong> {item.explanation}
                  </p>

                  <p className="muted">
                    <strong>From your notes:</strong> {item.sourceExcerpt}
                  </p>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={restartQuiz}
            style={{ marginTop: 24 }}
          >
            Try this quiz again
          </button>
        </>
      )}
    </section>
  );
}

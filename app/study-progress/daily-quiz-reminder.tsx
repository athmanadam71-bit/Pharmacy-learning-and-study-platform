
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type DailyQuizReminderProps = {
  quizDates: string[];
};

export default function DailyQuizReminder({
  quizDates,
}: DailyQuizReminderProps) {
  const [showReminder, setShowReminder] = useState(false);

  useEffect(() => {
    function checkDailyQuiz() {
      const now = new Date();

      // Use the student's browser-local date and time.
      const today = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0"),
      ].join("-");

      const completedToday = quizDates.some((dateString) => {
        const quizDate = new Date(dateString);

        if (Number.isNaN(quizDate.getTime())) return false;

        const quizLocalDate = [
          quizDate.getFullYear(),
          String(quizDate.getMonth() + 1).padStart(2, "0"),
          String(quizDate.getDate()).padStart(2, "0"),
        ].join("-");

        return quizLocalDate === today;
      });

      setShowReminder(now.getHours() >= 0 && !completedToday);
    }

    checkDailyQuiz();

    // Recheck periodically while the page remains open.
    const interval = window.setInterval(checkDailyQuiz, 60 * 1000);

    // Recheck when the student returns to the browser tab.
    window.addEventListener("focus", checkDailyQuiz);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", checkDailyQuiz);
    };
  }, [quizDates]);

  if (!showReminder) return null;

  return (
    <section
      className="content-card"
      style={{
        border: "1px solid #f2c46d",
        background: "#fffaf0",
        marginBottom: "24px",
      }}
      role="alert"
    >
      <div className="section-heading">
        <div>
          <div className="eyebrow" style={{ color: "#a66b12" }}>
            DAILY STUDY REMINDER
          </div>
          <h2>Don't forget today's quiz!</h2>
          <p>
            You haven't completed a quiz today. Take a few minutes to practise
            and strengthen your pharmacy knowledge.
          </p>
          <Link className="text-link" href="/quiz">
            Complete today's quiz →
          </Link>
        </div>
        <span className="section-symbol">⏰</span>
      </div>
    </section>
  );
}

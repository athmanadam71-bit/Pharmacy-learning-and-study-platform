
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Topic = {
  id: string;
  topic_name: string;
  topic_description: string | null;
  topic_order: number;
};

type TopicProgressProps = {
  studentId: string;
  topics: Topic[];
  initialCompletedIds: string[];
};

export function TopicProgress({
  studentId,
  topics,
  initialCompletedIds,
}: TopicProgressProps) {
  const [completedIds, setCompletedIds] = useState<string[]>(
    initialCompletedIds
  );
  const [savingIds, setSavingIds] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  const completedCount = completedIds.length;
  const percentage = Math.round((completedCount / topics.length) * 100);

  async function toggleTopic(topicId: string, checked: boolean) {
    if (savingIds.includes(topicId)) return;

    const previousIds = completedIds;

    setErrorMessage("");
    setSavingIds((current) => [...current, topicId]);

    setCompletedIds(
      checked
        ? [...previousIds, topicId]
        : previousIds.filter((id) => id !== topicId)
    );

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("student_topic_progress")
        .upsert(
          {
            student_id: studentId,
            topic_id: topicId,
            is_completed: checked,
            completed_at: checked ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "student_id,topic_id" }
        );

      if (error) throw error;
    } catch (error) {
      setCompletedIds(previousIds);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not save your progress. Please try again."
      );
    } finally {
      setSavingIds((current) =>
        current.filter((id) => id !== topicId)
      );
    }
  }

  return (
    <div>
      <div className="progress-summary">
        <div>
          <strong>{completedCount} / {topics.length}</strong>
          <span>Topics completed</span>
        </div>
        <div>
          <strong>{percentage}%</strong>
          <span>Overall completion</span>
        </div>
      </div>

      <div
        style={{
          height: 10,
          background: "#e9eaf2",
          borderRadius: 20,
          overflow: "hidden",
          margin: "20px 0 24px",
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: "100%",
            background: "#7655d9",
            borderRadius: 20,
            transition: "width 0.25s ease",
          }}
        />
      </div>

      {errorMessage && (
        <div className="notice" role="alert">
          Could not save progress: {errorMessage}
        </div>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {topics.map((topic, index) => {
          const completed = completedIds.includes(topic.id);
          const saving = savingIds.includes(topic.id);

          return (
            <article
              key={topic.id}
              className="subject-card"
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 14,
                opacity: completed ? 0.8 : 1,
              }}
            >
              <input
                type="checkbox"
                checked={completed}
                disabled={saving}
                onChange={(event) =>
                  toggleTopic(topic.id, event.target.checked)
                }
                aria-label={`Mark ${topic.topic_name} as completed`}
                style={{
                  width: 19,
                  height: 19,
                  marginTop: 4,
                  accentColor: "#7655d9",
                  cursor: saving ? "wait" : "pointer",
                }}
              />

              <div style={{ flex: 1 }}>
                <div className="eyebrow">
                  TOPIC {topic.topic_order || index + 1}
                </div>

                <h3
                  style={{
                    textDecoration: completed ? "line-through" : "none",
                  }}
                >
                  {topic.topic_name}
                </h3>

                {topic.topic_description && (
                  <p className="muted small">
                    {topic.topic_description}
                  </p>
                )}

                <p className="small muted">
                  {saving
                    ? "Saving..."
                    : completed
                      ? "Completed"
                      : "Not completed"}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

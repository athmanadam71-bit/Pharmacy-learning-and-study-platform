import HubSidebar from "@/components/hub-sidebar";
import DailyQuizReminder from "./daily-quiz-reminder";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function getRelationName(
  value:
    | { name?: string | null }
    | { name?: string | null }[]
    | null
    | undefined
) {
  if (Array.isArray(value)) return value[0]?.name || "Not set";
  return value?.name || "Not set";
}

function formatDate(value: string | null) {
  if (!value) return "Date unavailable";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function StudyProgressPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [
    { data: attempts, error: attemptsError },
    { data: enrolment },
    { data: tasks },
  ] = await Promise.all([
    supabase
      .from("quiz_attempts")
      .select("id, subject, quiz_title, score, total_questions, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),

    supabase
      .from("student_enrolments")
      .select(`
        semester_id,
        institutions(name),
        programmes(name),
        academic_years(name),
        semesters(name)
      `)
      .eq("user_id", user.id)
      .maybeSingle(),

    supabase
      .from("study_tasks")
      .select("id, status")
      .eq("user_id", user.id),
  ]);

  if (attemptsError) {
    console.error("Could not load quiz history:", attemptsError.message);
  }

  const quizAttempts = attempts ?? [];
  const quizDates = quizAttempts
  .map((attempt) => attempt.created_at)
  .filter((date): date is string => Boolean(date));
  const studyTasks = tasks ?? [];

  const scores = quizAttempts.map((attempt) => Number(attempt.score));
  const averageScore = scores.length
    ? Math.round(scores.reduce((total, score) => total + score, 0) / scores.length)
    : null;

  const bestScore = scores.length ? Math.max(...scores) : null;

  const completedTasks = studyTasks.filter(
    (task) => task.status === "completed"
  ).length;

  const pendingTasks = studyTasks.length - completedTasks;

  const { data: subjects } = enrolment?.semester_id
    ? await supabase
        .from("subjects")
        .select("id, subject_code, name, subject_type")
        .eq("semester_id", enrolment.semester_id)
        .order("subject_code")
    : { data: [] };

  const subjectList = subjects ?? [];
  const subjectIds = subjectList.map((subject) => subject.id);

  const { data: topics } = subjectIds.length
    ? await supabase
        .from("subject_topics")
        .select("id, subject_id")
        .in("subject_id", subjectIds)
    : { data: [] };

  const topicList = topics ?? [];
  const topicIds = topicList.map((topic) => topic.id);

  const { data: progress } = topicIds.length
    ? await supabase
        .from("student_topic_progress")
        .select("topic_id")
        .eq("student_id", user.id)
        .eq("is_completed", true)
        .in("topic_id", topicIds)
    : { data: [] };

  const completedTopicIds = new Set(
    (progress ?? []).map((item) => item.topic_id)
  );

  const totalTopics = topicList.length;
  const completedTopics = completedTopicIds.size;

  const overallProgress = totalTopics
    ? Math.round((completedTopics / totalTopics) * 100)
    : 0;

  const name =
    user.user_metadata?.full_name ||
    user.email ||
    "Student";

  const institution = getRelationName(enrolment?.institutions);
  const programme = getRelationName(enrolment?.programmes);
  const academicYear = getRelationName(enrolment?.academic_years);
  const semester = getRelationName(enrolment?.semesters);

  return (
    <div className="hub-shell">
      <HubSidebar activePage="progress" />

      <main className="hub-main">
        <DailyQuizReminder quizDates={quizDates} />
        <header className="hub-topbar">
          <div>
            <div className="eyebrow">YOUR LEARNING WORKSPACE</div>
            <h1>My Study Progress</h1>
          </div>
          <div className="topbar-user">
            <div className="avatar">
              {name.trim().charAt(0).toUpperCase()}
            </div>
            <div className="topbar-user-name">{name}</div>
          </div>
        </header>

        <section className="content-card academic-card">
          <div className="section-heading">
            <div>
              <div className="eyebrow">ACADEMIC PROFILE</div>
              <h2>My academic details</h2>
              <p>Your current programme and semester.</p>
            </div>
            <span className="section-symbol">🎓</span>
          </div>

          <div className="progress-summary">
            <div><strong>{institution}</strong><span>Institution</span></div>
            <div><strong>{programme}</strong><span>Programme</span></div>
            <div><strong>{academicYear}</strong><span>Academic year</span></div>
            <div><strong>{semester}</strong><span>Semester</span></div>
          </div>
        </section>

        <section className="metric-grid" aria-label="Personal study statistics">
          <article className="metric-card">
            <div className="metric-top"><span>Topics completed</span><span className="metric-icon green">✓</span></div>
            <div className="metric-value">{completedTopics}/{totalTopics}</div>
            <div className="metric-foot">Across your enrolled subjects</div>
          </article>

          <article className="metric-card">
            <div className="metric-top"><span>Quiz attempts</span><span className="metric-icon orange">✎</span></div>
            <div className="metric-value">{quizAttempts.length}</div>
            <div className="metric-foot">Saved practice sessions</div>
          </article>

          <article className="metric-card">
            <div className="metric-top"><span>Average score</span><span className="metric-icon blue">↗</span></div>
            <div className="metric-value">{averageScore === null ? "—" : `${averageScore}%`}</div>
            <div className="metric-foot">Across your quiz attempts</div>
          </article>

          <article className="metric-card">
            <div className="metric-top"><span>Best score</span><span className="metric-icon purple">★</span></div>
            <div className="metric-value">{bestScore === null ? "—" : `${bestScore}%`}</div>
            <div className="metric-foot">Your highest quiz score</div>
          </article>
        </section>

        <section className="content-card progress-card">
          <div className="section-heading">
            <div>
              <div className="eyebrow">YOUR ACHIEVEMENTS</div>
              <h2>Overall learning progress</h2>
              <p>Track your completed topics and study activities.</p>
            </div>
          </div>

          <div className="overall-progress-panel">
            <div className="overall-progress-heading">
              <div>
                <strong>Topic completion</strong>
                <p>{completedTopics} of {totalTopics} topics completed</p>
              </div>
              <strong className="overall-progress-percent">{overallProgress}%</strong>
            </div>

            <div className="subject-progress-track">
              <div
                className="subject-progress-fill"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>

          <div className="dashboard-subject-progress">
            <h3>Subject-by-subject progress</h3>

            {subjectList.length ? subjectList.map((subject) => {
              const subjectTopics = topicList.filter(
                (topic) => topic.subject_id === subject.id
              );

              const completedCount = subjectTopics.filter(
                (topic) => completedTopicIds.has(topic.id)
              ).length;

              const percentage = subjectTopics.length
                ? Math.round((completedCount / subjectTopics.length) * 100)
                : 0;

              return (
                <div className="dashboard-subject-item" key={subject.id}>
                  <div className="dashboard-subject-heading">
                    <div>
                      <strong>{subject.name}</strong>
                      <span>{subject.subject_code} · {subject.subject_type}</span>
                    </div>
                    <strong>{percentage}%</strong>
                  </div>

                  <div className="subject-progress-track">
                    <div
                      className="subject-progress-fill"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <small>{completedCount} of {subjectTopics.length} topics completed</small>
                </div>
              );
            }) : (
              <p>No enrolled subjects were found.</p>
            )}
          </div>
        </section>

        <section className="content-card progress-card">
          <div className="section-heading">
            <div>
              <div className="eyebrow">YOUR QUIZ RECORDS</div>
              <h2>Quiz history</h2>
              <p>Your saved quiz results, newest first.</p>
            </div>
            <Link className="text-link" href="/quiz">Take a quiz →</Link>
          </div>

          {quizAttempts.length ? (
            <div className="dashboard-subject-progress">
              {quizAttempts.map((attempt) => (
                <div className="dashboard-subject-item" key={attempt.id}>
                  <div className="dashboard-subject-heading">
                    <div>
                      <strong>{attempt.quiz_title || attempt.subject || "Practice quiz"}</strong>
                      <span>{attempt.subject || "General practice"} · {formatDate(attempt.created_at)}</span>
                    </div>
                    <strong>{Number(attempt.score)}%</strong>
                  </div>

                  <div className="subject-progress-track">
                    <div
                      className="subject-progress-fill"
                      style={{ width: `${Math.min(100, Math.max(0, Number(attempt.score)))}%` }}
                    />
                  </div>

                  <small>
                    {attempt.total_questions} questions · {Number(attempt.score)}% score
                  </small>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-planner">
              <span>✎</span>
              <strong>No quiz attempts yet</strong>
              <p>Complete your first quiz to start building your performance history.</p>
              <Link className="text-link" href="/quiz">Start a quiz →</Link>
            </div>
          )}
        </section>

        <section className="content-card progress-card">
          <div className="section-heading">
            <div>
              <div className="eyebrow">STUDY CONSISTENCY</div>
              <h2>Study planner summary</h2>
              <p>Your progress with planned study activities.</p>
            </div>
          </div>

          <div className="progress-summary">
            <div><strong>{completedTasks}</strong><span>Tasks completed</span></div>
            <div><strong>{pendingTasks}</strong><span>Tasks pending</span></div>
            <div><strong>{studyTasks.length}</strong><span>Total planned tasks</span></div>
            <div><strong>{quizAttempts.length}</strong><span>Quizzes completed</span></div>
          </div>
        </section>

        <footer className="hub-footer">
          PharmaStudy Hub <span>·</span> Your personal pharmacy learning space
        </footer>
      </main>
    </div>
  );
}

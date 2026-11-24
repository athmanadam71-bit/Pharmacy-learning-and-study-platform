import HubSidebar from "@/components/hub-sidebar";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const subjectIcons = ["💻", "💊", "🧠", "🫀", "🌿", "🧪"];

function getRelationName(
  value:
    | { name?: string | null }
    | { name?: string | null }[]
    | null
    | undefined
) {
  if (Array.isArray(value)) {
    return value[0]?.name || "Not set";
  }

  return value?.name || "Not set";
}

export default async function SubjectsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [
    { data: documents },
    { data: tasks },
    { data: enrolment },
  ] = await Promise.all([
    supabase
      .from("documents")
      .select("id, subject")
      .eq("user_id", user.id),

    supabase
      .from("study_tasks")
      .select("id, title, status")
      .eq("user_id", user.id),

    supabase
      .from("student_enrolments")
      .select(`
        institution_id,
        programme_id,
        academic_year_id,
        semester_id,
        institutions(name),
        programmes(name),
        academic_years(name),
        semesters(name)
      `)
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const { data: subjects, error: subjectsError } = enrolment
    ? await supabase
        .from("subjects")
        .select("id, subject_code, name, subject_type, short_name")
        .eq("semester_id", enrolment.semester_id)
        .order("subject_code")
    : { data: [], error: null };

  if (subjectsError) {
    console.error("Subject loading error:", subjectsError.message);
  }

  const studentSubjects = subjects ?? [];
  const documentList = documents ?? [];
  const taskList = tasks ?? [];
  const subjectIds = studentSubjects.map((subject) => subject.id);

  // Load topics belonging to the student's semester subjects.
  const { data: topics, error: topicsError } =
    subjectIds.length > 0
      ? await supabase
          .from("subject_topics")
          .select("id, subject_id")
          .in("subject_id", subjectIds)
      : { data: [], error: null };

  if (topicsError) {
    console.error("Topic loading error:", topicsError.message);
  }

  const topicList = topics ?? [];
  const topicIds = topicList.map((topic) => topic.id);

  // Load only this student's saved completion records.
  const { data: progressRecords, error: progressError } =
    topicIds.length > 0
      ? await supabase
          .from("student_topic_progress")
          .select("topic_id, is_completed")
          .eq("student_id", user.id)
          .in("topic_id", topicIds)
      : { data: [], error: null };

  if (progressError) {
    console.error("Progress loading error:", progressError.message);
  }

  const completedTopicIds = new Set(
    (progressRecords ?? [])
      .filter((record) => record.is_completed)
      .map((record) => record.topic_id)
  );

 const institutionName = getRelationName(enrolment?.institutions);
 const programmeName = getRelationName(enrolment?.programmes);
 const yearName = getRelationName(enrolment?.academic_years);
 const semesterName = getRelationName(enrolment?.semesters);

  const theorySubjects = studentSubjects.filter(
    (subject) => subject.subject_type === "Theory"
  );

  const practicalSubjects = studentSubjects.filter(
    (subject) => subject.subject_type === "Practical"
  );

  const totalCompleted = topicList.filter((topic) =>
    completedTopicIds.has(topic.id)
  ).length;

  const totalTopics = topicList.length;

  const overallPercentage =
    totalTopics > 0
      ? Math.round((totalCompleted / totalTopics) * 100)
      : 0;

  function renderSubjectCards(subjectList: typeof studentSubjects) {
    return (
      <div className="subject-grid">
        {subjectList.map((subject, index) => {
          const count = documentList.filter(
            (document) => document.subject === subject.name
          ).length;

          const subjectTopics = topicList.filter(
            (topic) => topic.subject_id === subject.id
          );

          const completed = subjectTopics.filter((topic) =>
            completedTopicIds.has(topic.id)
          ).length;

          const total = subjectTopics.length;

          const percentage =
            total > 0 ? Math.round((completed / total) * 100) : 0;

          return (
            <article className="subject-card" key={subject.id}>
              <div className={`subject-number subject-color-${(index % 6) + 1}`}>
                {subjectIcons[index % subjectIcons.length]}
              </div>

              <div className="eyebrow">{subject.subject_code}</div>

              <h3>{subject.name}</h3>

              {subject.short_name && (
                <p className="muted small">{subject.short_name}</p>
              )}

              <div className="subject-progress-info">
                <div className="subject-progress-label">
                  <strong>Topic progress</strong>
                  <span>{percentage}%</span>
                </div>

                <div
                  className="subject-progress-track"
                  role="progressbar"
                  aria-label={`${subject.name} completion`}
                  aria-valuenow={percentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="subject-progress-fill"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <p className="muted small">
                  {completed} of {total} topics completed
                </p>
              </div>

              <p className="muted small">
                {count} uploaded {count === 1 ? "document" : "documents"}
              </p>

              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <Link
                  className="text-link"
                  href={`/subjects/${subject.id}`}
                >
                  Open subject →
                </Link>

                <Link
                  className="text-link"
                  href={`/documents?subject=${encodeURIComponent(subject.name)}`}
                >
                  View materials →
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    );
  }

  return (
    <div className="hub-shell">
<HubSidebar activePage="subjects" />
      <main className="hub-main">
        <header className="hub-topbar">
          <div>
            <div className="eyebrow">YOUR COURSEWORK</div>
            <h1>My Subjects</h1>
          </div>

          <Link className="text-link" href="/documents">
            View documents →
          </Link>
        </header>

        <section className="welcome-banner">
          <div className="welcome-copy">
            <div className="welcome-tag">✦ YOUR LEARNING JOURNEY</div>
            <h2>Explore your subjects</h2>
            <p>
              Organise your lecture materials, revise topics and test your
              knowledge throughout the semester.
            </p>
            <Link className="primary-link" href="/documents">
              Open document library →
            </Link>
          </div>
        </section>

        <section className="content-card" style={{ marginTop: 24 }}>
          <div className="section-heading">
            <div>
              <div className="eyebrow">YOUR ACADEMIC PROFILE</div>
              <h2>Current enrolment</h2>
            </div>
            <span className="section-symbol">🎓</span>
          </div>

          <div className="progress-summary">
            <div><strong>{institutionName}</strong><span>Institution</span></div>
            <div><strong>{programmeName}</strong><span>Programme</span></div>
            <div><strong>{yearName}</strong><span>Academic year</span></div>
            <div><strong>{semesterName}</strong><span>Semester</span></div>
          </div>
        </section>

        <section className="metric-grid" style={{ marginTop: 24 }}>
          <article className="metric-card">
            <div className="metric-top">
              <span>Registered subjects</span>
              <span className="metric-icon purple">▤</span>
            </div>
            <div className="metric-value">{studentSubjects.length}</div>
            <div className="metric-foot">Subjects in your semester</div>
          </article>

          <article className="metric-card">
            <div className="metric-top">
              <span>Overall topic progress</span>
              <span className="metric-icon green">✓</span>
            </div>
            <div className="metric-value">{overallPercentage}%</div>
            <div className="metric-foot">
              {totalCompleted} of {totalTopics} topics completed
            </div>
          </article>

          <article className="metric-card">
            <div className="metric-top">
              <span>Uploaded documents</span>
              <span className="metric-icon blue">▱</span>
            </div>
            <div className="metric-value">{documentList.length}</div>
            <div className="metric-foot">Your learning materials</div>
          </article>

          <article className="metric-card">
            <div className="metric-top">
              <span>Study tasks</span>
              <span className="metric-icon green">✓</span>
            </div>
            <div className="metric-value">{taskList.length}</div>
            <div className="metric-foot">Tasks in your planner</div>
          </article>
        </section>

        <section className="content-card" style={{ marginTop: 24 }}>
          <div className="section-heading">
            <div>
              <div className="eyebrow">YOUR COURSEWORK</div>
              <h2>Theory subjects</h2>
              <p>Your registered theoretical subjects.</p>
            </div>
            <span className="section-symbol">📚</span>
          </div>

          {theorySubjects.length > 0 ? (
            renderSubjectCards(theorySubjects)
          ) : (
            <p className="muted">No theory subjects found for this semester.</p>
          )}
        </section>

        <section className="content-card" style={{ marginTop: 24 }}>
          <div className="section-heading">
            <div>
              <div className="eyebrow">PRACTICAL LEARNING</div>
              <h2>Practical subjects</h2>
              <p>Your registered practical subjects.</p>
            </div>
            <span className="section-symbol">🧪</span>
          </div>

          {practicalSubjects.length > 0 ? (
            renderSubjectCards(practicalSubjects)
          ) : (
            <p className="muted">No practical subjects found for this semester.</p>
          )}
        </section>

        {!enrolment && (
          <div className="notice">
            Your academic enrolment has not been found. Please contact support
            to complete your student registration.
          </div>
        )}

        <footer className="hub-footer">
          PharmaStudy Hub <span>·</span> Your personal pharmacy learning space
        </footer>
      </main>
    </div>
  );
}

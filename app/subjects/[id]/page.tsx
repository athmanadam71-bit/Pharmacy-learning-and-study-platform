
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TopicProgress } from "./topic-progress";

type SubjectPageProps = {
  params: Promise<{ id: string }>;
};

export default async function SubjectDetailPage({
  params,
}: SubjectPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Get the student's current enrolment.
  const { data: enrolment } = await supabase
    .from("student_enrolments")
    .select("semester_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!enrolment) {
    return (
      <main className="main">
        <Link href="/subjects">← Back to subjects</Link>
        <h1>Academic enrolment not found</h1>
        <p className="muted">
          Please complete your academic registration before viewing subjects.
        </p>
      </main>
    );
  }

  // Only allow access to subjects in the student's current semester.
  const { data: subject } = await supabase
    .from("subjects")
    .select("id, subject_code, name, subject_type, short_name")
    .eq("id", id)
    .eq("semester_id", enrolment.semester_id)
    .maybeSingle();

  if (!subject) notFound();

  // Load the official topic list for this subject.
  const { data: topics, error: topicsError } = await supabase
    .from("subject_topics")
    .select("id, topic_name, topic_description, topic_order")
    .eq("subject_id", subject.id)
    .order("topic_order", { ascending: true });

  if (topicsError) {
    console.error("Topic loading error:", topicsError.message);
  }

  // Load this student's completion records.
 const topicIds = (topics ?? []).map((topic) => topic.id);

const { data: progress, error: progressError } =
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

  const topicList = topics ?? [];
  const completedTopicIds = (progress ?? [])
    .filter((item) => item.is_completed)
    .map((item) => item.topic_id);

  return (
    <div className="hub-shell">
      <aside className="hub-sidebar">
        <Link href="/dashboard" className="hub-brand">
          <span className="hub-brand-mark">✚</span>
          <span>PharmaStudy <em>Hub</em></span>
        </Link>

        <div className="sidebar-caption">LEARNING SPACE</div>

        <nav className="hub-nav" aria-label="Main navigation">
          <Link className="hub-nav-link" href="/dashboard">⌂ Dashboard</Link>
          <Link className="hub-nav-link" href="/dashboard#study-planner">▦ Study planner</Link>
          <Link className="hub-nav-link active" href="/subjects">▤ My subjects</Link>
          <Link className="hub-nav-link" href="/documents">▱ Documents</Link>
          <Link className="hub-nav-link" href="/quiz">✓ Quizzes & tests</Link>
          <Link className="hub-nav-link" href="/study-progress">◷ Study progress</Link>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <div className="tip-icon">✦</div>
            <strong>Small steps, big progress.</strong>
            <p>Consistency is one of the best tools in your study kit.</p>
          </div>
        </div>
      </aside>

      <main className="hub-main">
        <header className="hub-topbar">
          <div>
            <div className="eyebrow">SUBJECT DETAILS</div>
            <h1>{subject.name}</h1>
          </div>
          <Link className="text-link" href="/subjects">
            ← All subjects
          </Link>
        </header>

        <section className="welcome-banner">
          <div className="welcome-copy">
            <div className="welcome-tag">✦ YOUR LEARNING JOURNEY</div>
            <h2>{subject.subject_code}</h2>
            <p>
              {subject.subject_type} subject
              {subject.short_name ? ` · ${subject.short_name}` : ""}
            </p>
            <p>
              Work through your topics and keep track of what you have
              completed.
            </p>
          </div>
        </section>

        <section className="content-card" style={{ marginTop: 24 }}>
          <div className="section-heading">
            <div>
              <div className="eyebrow">YOUR STUDY CHECKLIST</div>
              <h2>Subject topics</h2>
              <p>Mark each topic when you have completed studying it.</p>
            </div>
            <span className="section-symbol">📚</span>
          </div>

          {topicList.length > 0 ? (
            <TopicProgress
              studentId={user.id}
              topics={topicList}
              initialCompletedIds={completedTopicIds}
            />
          ) : (
            <div className="notice">
              No topics have been added to this subject yet. Your academic
              administrator will need to add the official topic list.
            </div>
          )}
        </section>

        <footer className="hub-footer">
          PharmaStudy Hub <span>·</span> Your personal pharmacy learning space
        </footer>
      </main>
    </div>
  );
}

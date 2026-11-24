import HubSidebar from "@/components/hub-sidebar";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addTask, finishTask } from "./actions";
import { signOut } from "@/app/auth/actions";

function displayTime(value: string | null) {
  return value ? value.slice(0, 5) : "Time not set";
}

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

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

const [
  { data: tasks },
  { data: attempts },
  { data: profile },
  { data: enrolment },
] = await Promise.all([
  supabase
    .from("study_tasks")
    .select("*")
    .eq("user_id", user.id)
    .order("study_date")
    .order("start_time")
    .limit(50),

  supabase
    .from("quiz_attempts")
    .select("score")
    .eq("user_id", user.id),

  supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle(),

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

const studentSubjects = subjects ?? [];
const subjectIds = studentSubjects.map((subject) => subject.id);

const { data: topics, error: topicsError } = subjectIds.length
  ? await supabase
      .from("subject_topics")
      .select("id, subject_id")
      .in("subject_id", subjectIds)
  : { data: [], error: null };

const topicIds = (topics ?? []).map((topic) => topic.id);

const { data: topicProgress, error: progressError } = topicIds.length
  ? await supabase
      .from("student_topic_progress")
      .select("topic_id, is_completed")
      .eq("student_id", user.id)
      .eq("is_completed", true)
      .in("topic_id", topicIds)
  : { data: [], error: null };

if (topicsError) {
  console.error("Could not load subject topics:", topicsError.message);
}

if (progressError) {
  console.error("Could not load topic progress:", progressError.message);
}

if (subjectsError) {
  console.error("Could not load enrolled subjects:", subjectsError.message);
}

  const rows = tasks || [];
  const allTopics = topics ?? [];
const completedTopicIds = new Set(
  (topicProgress ?? []).map((item) => item.topic_id)
);

const totalTopics = allTopics.length;
const completedTopics = completedTopicIds.size;

const overallProgress = totalTopics
  ? Math.round((completedTopics / totalTopics) * 100)
  : 0;

const theorySubjects = studentSubjects.filter(
  (subject) => subject.subject_type === "Theory"
);

const practicalSubjects = studentSubjects.filter(
  (subject) => subject.subject_type === "Practical"
);

function getSubjectProgress(subjectId: string) {
  const subjectTopics = allTopics.filter(
    (topic) => topic.subject_id === subjectId
  );

  const completedCount = subjectTopics.filter(
    (topic) => completedTopicIds.has(topic.id)
  ).length;

  return {
    completed: completedCount,
    total: subjectTopics.length,
    percentage: subjectTopics.length
      ? Math.round((completedCount / subjectTopics.length) * 100)
      : 0,
  };
}

function getCategoryProgress(subjectList: typeof studentSubjects) {
  const ids = new Set(subjectList.map((subject) => subject.id));

  const categoryTopics = allTopics.filter(
    (topic) => ids.has(topic.subject_id)
  );

  const completedCount = categoryTopics.filter(
    (topic) => completedTopicIds.has(topic.id)
  ).length;

  return {
    completed: completedCount,
    total: categoryTopics.length,
    percentage: categoryTopics.length
      ? Math.round((completedCount / categoryTopics.length) * 100)
      : 0,
  };
}

const theoryProgress = getCategoryProgress(theorySubjects);
const practicalProgress = getCategoryProgress(practicalSubjects);
  const completed = rows.filter((task) => task.status === "completed").length;
  const scores = (attempts || []).map((attempt) => Number(attempt.score));
  const average = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  const today = new Date().toLocaleDateString("en-CA");
  const todayTasks = rows.filter((task) => task.study_date === today);
  const pendingTasks = rows.filter((task) => task.status !== "completed");
  const name = profile?.full_name || user.user_metadata?.full_name || "Student";
  const institutionName = getRelationName(enrolment?.institutions);
const programmeName = getRelationName(enrolment?.programmes);
const academicYearName = getRelationName(enrolment?.academic_years);
const semesterName = getRelationName(enrolment?.semesters);
  return (
    <div className="hub-shell">
     <HubSidebar activePage="dashboard" /> 

      <main className="hub-main">
        <header className="hub-topbar">
          <div><div className="eyebrow">YOUR LEARNING WORKSPACE</div><h1>Dashboard</h1></div>
          <div className="topbar-user"><div className="avatar">{name.trim().charAt(0).toUpperCase()}</div><div className="topbar-user-name">{name}</div><form action={signOut}><button className="topbar-logout" type="submit">Log out</button></form></div>
        </header>

        <section className="welcome-banner">
          <div className="welcome-copy"><div className="welcome-tag">✦ WELCOME BACK</div><h2>Hello, {name.split(" ")[0]}!</h2><p>Build your pharmacy knowledge one focused study session at a time.</p><a className="primary-link" href="#study-planner">Plan your study day <span>→</span></a></div>
          <div className="welcome-art" aria-hidden="true"><div className="art-circle art-circle-one" /><div className="art-circle art-circle-two" /><div className="book-stack"><span>✚</span><b>PHARMACY</b></div><div className="art-spark">✦</div></div>
        </section>

<section className="content-card academic-card">
  <div className="section-heading">
    <div>
      <div className="eyebrow">YOUR ACADEMIC PROFILE</div>
      <h2>My academic details</h2>
      <p>Your current programme and semester.</p>
    </div>
    <span className="section-symbol">🎓</span>
  </div>

  <div className="progress-summary">
    <div>
      <strong>{institutionName}</strong>
      <span>Institution</span>
    </div>
    <div>
      <strong>{programmeName}</strong>
      <span>Programme</span>
    </div>
    <div>
      <strong>{academicYearName}</strong>
      <span>Academic year</span>
    </div>
    <div>
      <strong>{semesterName}</strong>
      <span>Semester</span>
    </div>
  </div>
</section>

        <section className="metric-grid" aria-label="Study statistics">
          <article className="metric-card"><div className="metric-top"><span>Subjects</span><span className="metric-icon purple">▤</span></div><div className="metric-value">{studentSubjects.length}</div><div className="metric-foot">In your first-semester list</div></article>
          <article className="metric-card"><div className="metric-top"><span>Tasks completed</span><span className="metric-icon green">✓</span></div><div className="metric-value">{completed}</div><div className="metric-foot">Across your study planner</div></article>
          <article className="metric-card"><div className="metric-top"><span>Quiz attempts</span><span className="metric-icon orange">✎</span></div><div className="metric-value">{scores.length}</div><div className="metric-foot">Practice sessions recorded</div></article>
          <article className="metric-card"><div className="metric-top"><span>Average score</span><span className="metric-icon blue">↗</span></div><div className="metric-value">{average === null ? "—" : `${average}%`}</div><div className="metric-foot">Based on saved quiz attempts</div></article>
        </section>

        <div className="dashboard-columns">
          <section className="content-card planner-card" id="study-planner">
            <div className="section-heading"><div><div className="eyebrow">STAY ON TRACK</div><h2>Study planner</h2><p>Organise your next learning sessions.</p></div><span className="section-symbol">▦</span></div>
            <form action={addTask} className="planner-form">
              <div className="form-field full-field"><label htmlFor="task-title">What are you going to study?</label><input id="task-title" name="title" placeholder="e.g. Revise alkaloids and their uses" required maxLength={300} /></div>
              <div className="form-field"><label htmlFor="task-date">Study date</label><input id="task-date" name="study_date" type="date" required /></div>
              <div className="form-field time-fields"><div><label htmlFor="task-start">Start</label><input id="task-start" name="start_time" type="time" /></div><div><label htmlFor="task-end">End</label><input id="task-end" name="end_time" type="time" /></div></div>
              <div className="full-field"><button className="add-task-button" type="submit">＋ Add study task</button></div>
            </form>
            <div className="task-list-heading"><h3>Upcoming tasks</h3><span>{pendingTasks.length} pending</span></div>
            {rows.length ? <div className="planner-task-list">{rows.slice(0, 8).map((task) => (
              <div className="planner-task" key={task.id}>
                <div className={`task-status-dot ${task.status === "completed" ? "is-complete" : ""}`} />
                <div className="planner-task-copy"><strong className={task.status === "completed" ? "completed-task" : ""}>{task.title}</strong><span>{task.study_date} · {displayTime(task.start_time)}{task.end_time ? `–${displayTime(task.end_time)}` : ""}</span></div>
                {task.status !== "completed" ? <form action={finishTask}><input type="hidden" name="task_id" value={task.id} /><button className="complete-button" type="submit">Complete</button></form> : <span className="completed-label">Completed</span>}
              </div>
            ))}</div> : <div className="empty-planner"><span>✎</span><strong>Your study plan starts here</strong><p>Add a task above to organise your learning time.</p></div>}
          </section>

          <div className="right-column">
            <section className="content-card today-card"><div className="section-heading compact-heading"><div><div className="eyebrow">YOUR SCHEDULE</div><h2>Today&apos;s focus</h2></div><span className="section-symbol">☀</span></div>
              <div className="today-date">{new Date().toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" })}</div>
              {todayTasks.length ? todayTasks.slice(0, 5).map((task) => <div className="today-task" key={task.id}><span className="today-task-line" /><div><strong>{task.title}</strong><span>{displayTime(task.start_time)}{task.end_time ? ` – ${displayTime(task.end_time)}` : ""}</span></div></div>) : <div className="today-empty"><span>☕</span><p>No tasks scheduled for today yet.</p><a href="#study-planner">Add a study session →</a></div>}
            </section>

            <section className="content-card subjects-card" id="subjects"><div className="section-heading compact-heading"><div><div className="eyebrow">YOUR COURSEWORK</div><h2>First-semester subjects</h2></div><span className="subject-count">{studentSubjects.length}</span></div>
              <div className="subject-list">{studentSubjects.map((subject, index) => <div className="subject-row" key={subject.id}><span className={`subject-number subject-color-${index + 1}`}>{subject.subject_code.slice(-2)}</span><div><strong>{subject.name}</strong><span>{subject.subject_code}</span></div></div>)}</div>
            </section>
          </div>
        </div>

        <section className="content-card progress-card" id="study-progress">
  <div className="section-heading">
    <div>
      <div className="eyebrow">KEEP MOVING FORWARD</div>
      <h2>Your learning progress</h2>
      <p>Track your progress across your enrolled pharmacy subjects.</p>
    </div>
    <Link className="text-link" href="/subjects">
      View subjects →
    </Link>
  </div>

  <div className="overall-progress-panel">
    <div className="overall-progress-heading">
      <div>
        <strong>Overall topic completion</strong>
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

  <div className="dashboard-category-grid">
    <div className="dashboard-category-card">
      <strong>Theory subjects</strong>
      <span>{theoryProgress.completed} / {theoryProgress.total} topics</span>
      <div className="subject-progress-track">
        <div
          className="subject-progress-fill"
          style={{ width: `${theoryProgress.percentage}%` }}
        />
      </div>
      <small>{theoryProgress.percentage}% completed</small>
    </div>

    <div className="dashboard-category-card">
      <strong>Practical subjects</strong>
      <span>{practicalProgress.completed} / {practicalProgress.total} topics</span>
      <div className="subject-progress-track">
        <div
          className="subject-progress-fill"
          style={{ width: `${practicalProgress.percentage}%` }}
        />
      </div>
      <small>{practicalProgress.percentage}% completed</small>
    </div>
  </div>

  <div className="dashboard-subject-progress">
    <h3>Subject-by-subject progress</h3>

    {studentSubjects.map((subject) => {
      const progress = getSubjectProgress(subject.id);

      return (
        <div className="dashboard-subject-item" key={subject.id}>
          <div className="dashboard-subject-heading">
            <div>
              <strong>{subject.name}</strong>
              <span>{subject.subject_code} · {subject.subject_type}</span>
            </div>
            <strong>{progress.percentage}%</strong>
          </div>

          <div className="subject-progress-track">
            <div
              className="subject-progress-fill"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>

          <small>
            {progress.completed} of {progress.total} topics completed
          </small>
        </div>
      );
    })}
  </div>

  <div className="progress-summary">
    <div><strong>{completed}</strong><span>Tasks completed</span></div>
    <div><strong>{rows.length}</strong><span>Planned tasks</span></div>
    <div><strong>{scores.length}</strong><span>Quiz attempts</span></div>
    <div>
      <strong>{average === null ? "—" : `${average}%`}</strong>
      <span>Average quiz score</span>
    </div>
  </div>
</section>
        <footer className="hub-footer">PharmaStudy Hub <span>·</span> Your personal pharmacy learning space</footer>
      </main>
    </div>
  );
}
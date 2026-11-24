import HubSidebar from "@/components/hub-sidebar";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
import { QuizBuilder } from "./quiz-builder";

export default async function QuizPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const name =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    "Student";

  return (
    <div className="hub-shell">
      <HubSidebar activePage="quiz" />

      <main className="hub-main">
        <header className="hub-topbar">
          <div>
            <div className="eyebrow">YOUR LEARNING WORKSPACE</div>
            <h1>Quizzes & tests</h1>
          </div>

          <div className="topbar-user">
            <div className="avatar">
              {name.trim().charAt(0).toUpperCase()}
            </div>

            <div className="topbar-user-name">{name}</div>

            <form action={signOut}>
              <button className="topbar-logout" type="submit">
                Log out
              </button>
            </form>
          </div>
        </header>

        <section className="content-card quiz-intro">
          <div className="eyebrow">TEST YOUR KNOWLEDGE</div>
          <h2>AI quiz generator</h2>
          <p className="muted">
            Create practice questions from your pharmacy lecture materials
            and strengthen your understanding.
          </p>
        </section>

        <QuizBuilder />

        <footer className="hub-footer">
          PharmaStudy Hub <span>·</span> Your personal pharmacy learning space
        </footer>
      </main>
    </div>
  );
}

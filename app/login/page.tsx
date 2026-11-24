
import Link from "next/link";
import { signIn } from "@/app/auth/actions";

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="auth">
      <section className="panel">
        <div className="brand">
          ✚ PharmaStudy <span>Hub</span>
        </div>

        <h1>Welcome back</h1>

        {params.error && (
          <p className="error">{params.error}</p>
        )}

        {params.message && (
          <p className="success">{params.message}</p>
        )}

        <form action={signIn}>
          <label>Email</label>
          <input
            name="email"
            type="email"
            required
          />

          <label>Password</label>
          <input
            name="password"
            type="password"
            required
          />

          <button
            type="submit"
            style={{ width: "100%", marginTop: 18 }}
          >
            Log in
          </button>
        </form>

        <p className="small">
          New student? <Link href="/signup">Create account</Link>
        </p>
      </section>
    </main>
  );
}

import Link from "next/link";
import {createClient} from "@/lib/supabase/server";
import {redirect} from "next/navigation";
export default async function Home(){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(user)redirect("/dashboard");
 return <main className="auth"><section className="panel"><div className="brand">✚ PharmaStudy <span>Hub</span></div><h1>Your pharmacy learning companion</h1><p className="muted">Organise subjects, plan study sessions, upload notes and practise with AI-generated quizzes.</p><p><Link href="/login">Log in</Link> · <Link href="/signup">Create a student account</Link></p><div className="notice">Public platform, private student workspaces. Your personal study records are protected by account-level database policies.</div></section></main>;
}
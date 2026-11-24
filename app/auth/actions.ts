
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signUp(fd: FormData) {
  const s = await createClient();

  const name = String(fd.get("full_name") || "").trim();
  const email = String(fd.get("email") || "").trim();
  const password = String(fd.get("password") || "");

  const institutionId = String(fd.get("institution_id") || "");
  const programmeId = String(fd.get("programme_id") || "");
  const academicYearId = String(fd.get("academic_year_id") || "");
  const semesterId = String(fd.get("semester_id") || "");

  if (
    !name ||
    !email ||
    password.length < 10 ||
    !institutionId ||
    !programmeId ||
    !academicYearId ||
    !semesterId
  ) {
    redirect(
      "/signup?error=Please%20complete%20all%20registration%20fields."
    );
  }

  // Verify that the selected programme belongs to the institution.
  const { data: programme } = await s
    .from("programmes")
    .select("id")
    .eq("id", programmeId)
    .eq("institution_id", institutionId)
    .maybeSingle();

  if (!programme) {
    redirect("/signup?error=Invalid%20programme%20selection.");
  }

  // Verify that the academic year belongs to the programme.
  const { data: academicYear } = await s
    .from("academic_years")
    .select("id")
    .eq("id", academicYearId)
    .eq("programme_id", programmeId)
    .maybeSingle();

  if (!academicYear) {
    redirect("/signup?error=Invalid%20academic%20year%20selection.");
  }

  // Verify that the semester belongs to the selected academic year.
  const { data: semester } = await s
    .from("semesters")
    .select("id")
    .eq("id", semesterId)
    .eq("academic_year_id", academicYearId)
    .maybeSingle();

  if (!semester) {
    redirect("/signup?error=Invalid%20semester%20selection.");
  }

  const { error } = await s.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
        institution_id: institutionId,
        programme_id: programmeId,
        academic_year_id: academicYearId,
        semester_id: semesterId,
      },
    },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  redirect(
    "/login?message=Check%20your%20email%20to%20confirm%20your%20account."
  );
}

export async function signIn(fd: FormData) {
  const s = await createClient();

  const { data, error } = await s.auth.signInWithPassword({
    email: String(fd.get("email") || ""),
    password: String(fd.get("password") || ""),
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  const user = data.user;
  const metadata = user.user_metadata ?? {};

  // Check whether this student already has an enrolment.
  const { data: existingEnrolment, error: lookupError } = await s
    .from("student_enrolments")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (lookupError) {
    await s.auth.signOut();
    redirect(
      `/login?error=${encodeURIComponent("Could not check your student enrolment. Please try again.")}`
    );
  }

  // Create the enrolment after the student has authenticated.
  if (!existingEnrolment) {
    const {
      institution_id,
      programme_id,
      academic_year_id,
      semester_id,
    } = metadata;

    if (
      institution_id &&
      programme_id &&
      academic_year_id &&
      semester_id
    ) {
      const { error: enrolmentError } = await s
        .from("student_enrolments")
        .insert({
          user_id: user.id,
          institution_id,
          programme_id,
          academic_year_id,
          semester_id,
        });

      if (enrolmentError) {
        await s.auth.signOut();
        redirect(
          `/login?error=${encodeURIComponent("Your account was created, but your academic enrolment could not be saved. Please contact support.")}`
        );
      }
    }
  }

  redirect("/dashboard");
}

export async function signOut() {
  const s = await createClient();
  await s.auth.signOut();
  redirect("/");
}

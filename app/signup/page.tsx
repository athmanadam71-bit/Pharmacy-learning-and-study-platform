
import { createClient } from "@/lib/supabase/server";
import { SignupForm } from "./signup-form";

export default async function Signup({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const [
    { data: institutions },
    { data: programmes },
    { data: academicYears },
    { data: semesters },
  ] = await Promise.all([
    supabase.from("institutions").select("id, name").order("name"),
    supabase
      .from("programmes")
      .select("id, name, institution_id")
      .order("name"),
    supabase
      .from("academic_years")
      .select("id, name, programme_id, year_number")
      .order("year_number"),
    supabase
      .from("semesters")
      .select("id, name, academic_year_id, semester_number")
      .order("semester_number"),
  ]);

  return (
    <SignupForm
      institutions={institutions ?? []}
      programmes={programmes ?? []}
      academicYears={academicYears ?? []}
      semesters={semesters ?? []}
      error={params.error}
    />
  );
}
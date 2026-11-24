
"use client";

import { useState } from "react";
import Link from "next/link";
import { signUp } from "@/app/auth/actions";

type Institution = {
  id: string;
  name: string;
};

type Programme = {
  id: string;
  name: string;
  institution_id: string;
};

type AcademicYear = {
  id: string;
  name: string;
  programme_id: string;
  year_number: number;
};

type Semester = {
  id: string;
  name: string;
  academic_year_id: string;
  semester_number: number;
};

export function SignupForm({
  institutions,
  programmes,
  academicYears,
  semesters,
  error,
}: {
  institutions: Institution[];
  programmes: Programme[];
  academicYears: AcademicYear[];
  semesters: Semester[];
  error?: string;
}) {
  const [institutionId, setInstitutionId] = useState("");
  const [programmeId, setProgrammeId] = useState("");
  const [yearId, setYearId] = useState("");

  const availableProgrammes = programmes.filter(
    (p) => p.institution_id === institutionId
  );

  const availableYears = academicYears.filter(
    (y) => y.programme_id === programmeId
  );

  const availableSemesters = semesters.filter(
    (s) => s.academic_year_id === yearId
  );

  return (
    <main className="auth">
      <section className="panel">
        <div className="brand">
          ✚ PharmaStudy <span>Hub</span>
        </div>

        <h1>Create your account</h1>

        {error && <p className="error">{error}</p>}

        <form action={signUp}>
          <label>Full name</label>
          <input name="full_name" required />

          <label>Email</label>
          <input name="email" type="email" required />

          <label>Password (minimum 10 characters)</label>
          <input name="password" type="password" minLength={10} required />

          <label>Institution</label>
          <select
            name="institution_id"
            required
            value={institutionId}
            onChange={(e) => {
              setInstitutionId(e.target.value);
              setProgrammeId("");
              setYearId("");
            }}
          >
            <option value="">Select institution</option>
            {institutions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          <label>Programme</label>
          <select
            name="programme_id"
            required
            value={programmeId}
            onChange={(e) => {
              setProgrammeId(e.target.value);
              setYearId("");
            }}
            disabled={!institutionId}
          >
            <option value="">Select programme</option>
            {availableProgrammes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          <label>Academic year</label>
          <select
            name="academic_year_id"
            required
            value={yearId}
            onChange={(e) => setYearId(e.target.value)}
            disabled={!programmeId}
          >
            <option value="">Select academic year</option>
            {availableYears.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          <label>Semester</label>
          <select
            name="semester_id"
            required
            disabled={!yearId}
          >
            <option value="">Select semester</option>
            {availableSemesters.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          <button style={{ width: "100%", marginTop: 18 }}>
            Register
          </button>
        </form>

        <p className="small">
          Already registered? <Link href="/login">Log in</Link>
        </p>
      </section>
    </main>
  );
}

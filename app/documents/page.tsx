import HubSidebar from "@/components/hub-sidebar";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UploadForm } from "./upload-form";

export default async function Documents() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: docs } = await supabase
    .from("documents")
    .select("id, file_name, subject, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const documents = docs ?? [];

  return (
    <main className="dashboard-layout">
      <HubSidebar activePage="documents" />

      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <span className="muted small">PHARMACY LEARNING</span>
            <h2>My documents</h2>
          </div>
          <span className="document-count">
            {documents.length} {documents.length === 1 ? "file" : "files"}
          </span>
        </header>

        <section className="dashboard-welcome">
          <div>
            <span className="welcome-label">YOUR STUDY LIBRARY</span>
            <h1>All your learning materials in one place.</h1>
            <p>
              Upload and organise lecture notes, practical manuals,
              reference materials and other study documents.
            </p>
          </div>
          <div className="welcome-symbol">▤</div>
        </section>

        <section className="document-upload-section">
          <div className="section-heading">
            <div>
              <h2>Upload a document</h2>
              <p className="muted">
                Add study materials to your private document library.
              </p>
            </div>
          </div>

          <div className="document-upload-card">
            <UploadForm />
          </div>
        </section>

        <section className="document-library-section">
          <div className="section-heading">
            <div>
              <h2>Uploaded documents</h2>
              <p className="muted">
                Your recently uploaded study materials.
              </p>
            </div>
            <span className="document-count">
              {documents.length} total
            </span>
          </div>

          {documents.length > 0 ? (
            <div className="document-list">
              {documents.map((doc) => (
                <article className="document-row" key={doc.id}>
                  <div className="document-file-icon">PDF</div>

                  <div className="document-file-details">
                    <strong>{doc.file_name}</strong>
                    <span>
                      {doc.subject || "General study material"}
                    </span>
                  </div>

                  <div className="document-date">
                    {new Date(doc.created_at).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="document-empty-state">
              <div className="document-empty-icon">▤</div>
              <h3>Your library is empty</h3>
              <p>
                You have not uploaded any documents yet.
                Upload your first study material to get started.
              </p>
            </div>
          )}
        </section>

        <div className="notice">
          <strong>Coming next:</strong> PDF and document text extraction,
          document-based quiz generation and study material search.
        </div>

        <footer className="hub-footer">
          PharmaStudy Hub <span>·</span> Your personal pharmacy learning space
        </footer>
      </div>
    </main>
  );
}

# PharmaStudy Hub V2 — Next.js + Supabase + OpenAI

## Included
- Next.js App Router and TypeScript
- Supabase email/password registration and login using SSR cookies
- Profile creation trigger
- Student dashboard and private study-task CRUD
- Private Supabase Storage document upload and metadata
- Row Level Security for student records and files
- Server-side OpenAI Responses API quiz-generation route
- Starter pages for documents and quizzes

## Requirements
- Node.js 20.9 or later
- npm
- Supabase project
- OpenAI API key for AI quiz generation

## Install
```bash
npm install
```
Copy `.env.example` to `.env.local` (PowerShell: `Copy-Item .env.example .env.local`) and fill in:
```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
OPENAI_MODEL=gpt-6-astra
```
Keep the OpenAI key server-side. Never put a Supabase service-role key in browser code.

## Supabase setup
1. Create a project at https://supabase.com/dashboard.
2. Copy the Project URL and publishable key into `.env.local`.
3. Open SQL Editor and run `supabase/migrations/0001_initial_schema.sql`.
4. Configure Auth site URL and redirect URLs for localhost and your production domain.
5. Configure email confirmation and SMTP before public launch.
6. Test with two separate user accounts to verify that each user can only access their own rows and files.

## Run locally
```bash
npm run dev
```
Open http://localhost:3000.

## Important boundaries
This is a development starter, not a fully audited production service. The current quiz API accepts pasted text; it does not extract text from uploaded PDFs. Quiz output is returned as JSON text and quiz attempt persistence is not yet implemented. Before public launch, add:
- PDF/DOCX/PPTX server-side extraction, chunking, search and source/page references
- Quiz rendering, answer marking and persistence
- Rate limits, bot protection, upload malware scanning, MIME verification and quotas
- Password reset, account deletion, privacy settings and admin roles
- Monitoring, backups, privacy policy, terms and security testing
- RLS tests using multiple independent accounts

## Roadmap
1. Configure Supabase and test account isolation.
2. Build full subjects, topics and recurring timetable management.
3. Add document extraction and source-grounded AI quizzes.
4. Add flashcards, spaced repetition, weak-topic tracking and mock exams.
5. Deploy to Vercel or another supported host with a domain.

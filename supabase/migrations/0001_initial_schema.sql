create extension if not exists pgcrypto;

create table if not exists public.profiles(
 id uuid primary key references auth.users(id) on delete cascade,
 full_name text, created_at timestamptz not null default now()
);
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=''
as $$ begin
 insert into public.profiles(id,full_name) values(new.id,new.raw_user_meta_data->>'full_name') on conflict(id) do nothing;
 return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create table if not exists public.study_tasks(
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 title text not null check(char_length(title) between 1 and 300), study_date date not null,
 start_time time, end_time time, status text not null default 'planned' check(status in('planned','in_progress','completed','skipped')),
 created_at timestamptz not null default now()
);
create table if not exists public.documents(
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 file_name text not null, subject text, storage_path text not null unique, mime_type text, size_bytes bigint,
 created_at timestamptz not null default now()
);
create table if not exists public.quiz_attempts(
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 subject text, score numeric(5,2) not null check(score between 0 and 100),
 total_questions integer not null check(total_questions>0), created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.study_tasks enable row level security;
alter table public.documents enable row level security;
alter table public.quiz_attempts enable row level security;

create policy "Read own profile" on public.profiles for select to authenticated using((select auth.uid())=id);
create policy "Update own profile" on public.profiles for update to authenticated using((select auth.uid())=id) with check((select auth.uid())=id);
create policy "Manage own study tasks" on public.study_tasks for all to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create policy "Manage own documents" on public.documents for all to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create policy "Manage own quiz attempts" on public.quiz_attempts for all to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('student-documents','student-documents',false,15728640,array['application/pdf','text/plain','image/png','image/jpeg','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.presentationml.presentation'])
on conflict(id) do nothing;
create policy "Upload own folder" on storage.objects for insert to authenticated with check(bucket_id='student-documents' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "Read own folder" on storage.objects for select to authenticated using(bucket_id='student-documents' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "Delete own folder" on storage.objects for delete to authenticated using(bucket_id='student-documents' and (storage.foldername(name))[1]=(select auth.uid())::text);

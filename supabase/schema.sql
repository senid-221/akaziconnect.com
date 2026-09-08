-- AkaziConnect database schema
-- Run in Supabase SQL editor after choosing/creating the dedicated project.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  role text not null default 'job_seeker' check (role in ('job_seeker','employer','admin')),
  bio text,
  location text,
  skills text[] default '{}',
  cv_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  location text,
  website text,
  logo_url text,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  description text not null,
  category text not null,
  location text not null,
  employment_type text not null default 'full_time' check (employment_type in ('full_time','part_time','contract','internship','remote')),
  salary_min numeric,
  salary_max numeric,
  currency text not null default 'RWF',
  skills text[] default '{}',
  status text not null default 'published' check (status in ('draft','published','closed')),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  applicant_id uuid not null references public.profiles(id) on delete cascade,
  cv_url text,
  cover_letter text,
  status text not null default 'submitted' check (status in ('submitted','reviewing','shortlisted','rejected','hired')),
  created_at timestamptz not null default now(),
  unique(job_id, applicant_id)
);

create table if not exists public.saved_jobs (
  user_id uuid not null references public.profiles(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id, job_id)
);

create index if not exists jobs_category_idx on public.jobs(category);
create index if not exists jobs_location_idx on public.jobs(location);
create index if not exists applications_applicant_idx on public.applications(applicant_id);
create index if not exists applications_job_idx on public.applications(job_id);

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;
alter table public.saved_jobs enable row level security;

-- Public can discover published jobs.
create policy "published jobs are public" on public.jobs
  for select to anon, authenticated
  using (status = 'published');

-- Authenticated employers manage their own company.
create policy "employers read own company" on public.companies
  for select to authenticated
  using ((select auth.uid()) = owner_id);
create policy "employers create own company" on public.companies
  for insert to authenticated
  with check ((select auth.uid()) = owner_id);
create policy "employers update own company" on public.companies
  for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

-- Employers manage jobs belonging to their company.
create policy "employers manage own jobs" on public.jobs
  for all to authenticated
  using (exists (select 1 from public.companies c where c.id = company_id and c.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.companies c where c.id = company_id and c.owner_id = (select auth.uid())));

-- Users can read/update their own profile.
create policy "users read own profile" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);
create policy "users insert own profile" on public.profiles
  for insert to authenticated
  with check ((select auth.uid()) = id);
create policy "users update own profile" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Applicants manage only their own applications.
create policy "applicants read own applications" on public.applications
  for select to authenticated
  using ((select auth.uid()) = applicant_id);
create policy "applicants create own applications" on public.applications
  for insert to authenticated
  with check ((select auth.uid()) = applicant_id);

-- Employers can review applications for their jobs.
create policy "employers read applications for own jobs" on public.applications
  for select to authenticated
  using (exists (
    select 1 from public.jobs j
    join public.companies c on c.id = j.company_id
    where j.id = job_id and c.owner_id = (select auth.uid())
  ));

create policy "users manage saved jobs" on public.saved_jobs
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

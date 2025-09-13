-- Create applications table
create extension if not exists "uuid-ossp";

create table if not exists public.applications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company text not null,
  job_title text not null,
  status text not null default 'saved' check (status in ('saved','applied','interview','offer','rejected')),
  source text,
  url text,
  notes text,
  applied_at timestamptz,
  resume_id uuid references public.resumes(id) on delete set null,
  cover_letter_id uuid references public.cover_letters(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists applications_user_id_idx on public.applications(user_id);
create index if not exists applications_status_idx on public.applications(status);

alter table public.applications enable row level security;

-- RLS: each user manages only their own applications
create policy if not exists "Users can view own applications" on public.applications
  for select using (auth.uid() = user_id);

create policy if not exists "Users can insert own applications" on public.applications
  for insert with check (auth.uid() = user_id);

create policy if not exists "Users can update own applications" on public.applications
  for update using (auth.uid() = user_id);

create policy if not exists "Users can delete own applications" on public.applications
  for delete using (auth.uid() = user_id);

-- Trigger to update updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_applications_updated_at on public.applications;
create trigger set_applications_updated_at
before update on public.applications
for each row execute procedure public.set_updated_at();
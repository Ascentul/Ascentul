-- Create resumes table
create extension if not exists "uuid-ossp";

create table if not exists public.resumes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content jsonb not null default '{}'::jsonb,
  visibility text not null default 'private' check (visibility in ('private','public')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists resumes_user_id_idx on public.resumes(user_id);

alter table public.resumes enable row level security;

-- Allow users to manage only their own resumes
create policy if not exists "Users can view own resumes" on public.resumes
  for select
  using (auth.uid() = user_id);

create policy if not exists "Users can insert own resumes" on public.resumes
  for insert
  with check (auth.uid() = user_id);

create policy if not exists "Users can update own resumes" on public.resumes
  for update
  using (auth.uid() = user_id);

create policy if not exists "Users can delete own resumes" on public.resumes
  for delete
  using (auth.uid() = user_id);

-- Trigger to update updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_resumes_updated_at on public.resumes;
create trigger set_resumes_updated_at
before update on public.resumes
for each row execute procedure public.set_updated_at();
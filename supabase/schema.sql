create extension if not exists pgcrypto;

create table if not exists public.textlingo_learners (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create table if not exists public.textlingo_courses (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.textlingo_learners(id) on delete cascade,
  topic text not null,
  current_knowledge text not null,
  goal text,
  source_file_name text,
  source_text text,
  title text not null,
  description text not null,
  difficulty text not null check (difficulty in ('beginner', 'intermediate', 'advanced')),
  estimated_minutes integer not null default 0,
  lessons jsonb not null default '[]'::jsonb,
  completed_lesson_ids text[] not null default '{}',
  current_lesson_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists textlingo_courses_learner_id_idx on public.textlingo_courses (learner_id);
create index if not exists textlingo_courses_updated_at_idx on public.textlingo_courses (updated_at desc);

create or replace function public.textlingo_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists textlingo_courses_set_updated_at on public.textlingo_courses;
create trigger textlingo_courses_set_updated_at
before update on public.textlingo_courses
for each row
execute function public.textlingo_set_updated_at();

alter table public.textlingo_learners enable row level security;
alter table public.textlingo_courses enable row level security;

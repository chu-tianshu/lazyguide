-- Run once in the Supabase SQL editor (after schema.sql).
-- Per-user guide preferences, and AI-generated guides shared by everyone who picks the same combination.

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  length text not null check (length in ('short', 'medium', 'long')),
  style text not null check (style in ('conversational', 'storytelling', 'scholarly', 'playful')),
  topics text[] not null check (cardinality(topics) > 0),
  updated_at timestamptz not null default now()
);

-- Added after the first version; null until the visitor picks one (they are asked again on next sign-in).
alter table public.user_preferences add column if not exists language text check (language in ('en', 'zh'));

alter table public.user_preferences enable row level security;

drop policy if exists "select own preferences" on public.user_preferences;
create policy "select own preferences" on public.user_preferences
  for select using (auth.uid() = user_id);

drop policy if exists "insert own preferences" on public.user_preferences;
create policy "insert own preferences" on public.user_preferences
  for insert with check (auth.uid() = user_id);

drop policy if exists "update own preferences" on public.user_preferences;
create policy "update own preferences" on public.user_preferences
  for update using (auth.uid() = user_id);

-- One row per work, language and unique combination of length, style and topics.
-- topics_key is the sorted topic list joined by commas, so selection order does not matter.
-- Written and read only by /api/generate-guide with the service-role key (no policies = no client access).
create table if not exists public.generated_guides (
  id uuid primary key default gen_random_uuid(),
  museum_id text not null,
  work_id text not null,
  language text not null,
  length text not null,
  style text not null,
  topics_key text not null,
  topics text[] not null,
  body text not null,
  model text,
  created_at timestamptz not null default now(),
  unique (museum_id, work_id, language, length, style, topics_key)
);

alter table public.generated_guides enable row level security;

grant select, insert, update on public.user_preferences to authenticated;

-- Newer Supabase projects do not grant new tables to the API roles automatically.
-- The server route reads and writes generated_guides with the service-role key.
grant select, insert, update on public.generated_guides to service_role;

-- Angles the model suggests exploring after a guide (shown as buttons under the guide).
alter table public.generated_guides add column if not exists suggestions text[] not null default '{}';

-- Languages: English, Chinese, French and Spanish. Run this once to allow fr and es.
alter table public.user_preferences drop constraint if exists user_preferences_language_check;
alter table public.user_preferences
  add constraint user_preferences_language_check check (language in ('en', 'zh', 'fr', 'es'));

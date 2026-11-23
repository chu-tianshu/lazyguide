-- Run once in the Supabase SQL editor (after schema.sql).
-- Usage telemetry. The app inserts one row per event; the /admin/analytics page reads the views below.

create table if not exists public.events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  -- Anonymous ("continue without an account") visitors have a user_id too, so they count as users.
  user_id uuid references auth.users (id) on delete set null,
  event text not null check (event in ('app_open', 'work_view', 'play', 'replay', 'complete', 'expand', 'question')),
  museum_id text,
  work_id text,
  language text
);

create index if not exists events_created_idx on public.events (created_at);
create index if not exists events_work_idx on public.events (museum_id, work_id, event);

alter table public.events enable row level security;

-- Visitors can only add events as themselves; nobody can read them through the API.
drop policy if exists "insert own events" on public.events;
create policy "insert own events" on public.events
  for insert with check (auth.uid() = user_id);

grant insert on public.events to authenticated;
grant select on public.events to service_role;

-- Views run with the caller's rights and are readable only by the service role (the dashboard page).
create or replace view public.analytics_daily with (security_invoker = true) as
select (created_at at time zone 'utc')::date as day,
       count(distinct user_id) as active_users,
       count(*) filter (where event = 'play') as plays,
       count(*) filter (where event = 'replay') as replays,
       count(*) filter (where event = 'question') as questions
from public.events
where created_at > now() - interval '30 days'
group by 1;

create or replace view public.analytics_works with (security_invoker = true) as
select museum_id, work_id,
       count(*) filter (where event = 'work_view') as views,
       count(distinct user_id) filter (where event = 'work_view') as viewers,
       count(*) filter (where event = 'play') as plays,
       count(*) filter (where event = 'replay') as replays,
       count(*) filter (where event = 'complete') as completes,
       count(*) filter (where event = 'expand') as expands,
       count(*) filter (where event = 'question') as questions
from public.events
where work_id is not null
group by 1, 2;

create or replace view public.analytics_summary with (security_invoker = true) as
select count(distinct user_id) as total_users,
       count(distinct user_id) filter (where created_at > now() - interval '1 day') as dau,
       count(distinct user_id) filter (where created_at > now() - interval '7 days') as wau,
       count(distinct user_id) filter (where created_at > now() - interval '30 days') as mau,
       count(*) filter (where event = 'work_view') as work_views,
       count(*) filter (where event = 'play') as plays,
       count(*) filter (where event = 'replay') as replays,
       count(*) filter (where event = 'complete') as completes,
       count(*) filter (where event = 'question') as questions
from public.events;

revoke all on public.analytics_daily, public.analytics_works, public.analytics_summary from anon, authenticated;
grant select on public.analytics_daily, public.analytics_works, public.analytics_summary to service_role;

-- ---------------------------------------------------------------------------------------------
-- Usage of paid services, written by the API routes with the service-role key (no client access).
-- One row per real generation: cached guides and cached audio are not logged.
create table if not exists public.usage_log (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  user_id uuid references auth.users (id) on delete set null,
  kind text not null check (kind in ('guide_generation', 'question', 'tts')),
  museum_id text,
  work_id text,
  language text,
  model text,
  input_tokens integer,   -- Claude calls
  output_tokens integer,  -- Claude calls
  chars integer,          -- tts: characters sent to the voice model
  audio_seconds real      -- tts: length of the audio produced
);

create index if not exists usage_log_created_idx on public.usage_log (created_at);

alter table public.usage_log enable row level security;
grant select, insert on public.usage_log to service_role;
grant usage, select on sequence public.usage_log_id_seq to service_role;

create or replace view public.analytics_usage_daily with (security_invoker = true) as
select (created_at at time zone 'utc')::date as day,
       count(*) filter (where kind = 'guide_generation') as guide_generations,
       count(*) filter (where kind = 'question') as questions,
       count(*) filter (where kind = 'tts') as tts_requests,
       coalesce(sum(audio_seconds) filter (where kind = 'tts'), 0) / 60.0 as audio_minutes,
       coalesce(sum(input_tokens), 0) as input_tokens,
       coalesce(sum(output_tokens), 0) as output_tokens
from public.usage_log
where created_at > now() - interval '30 days'
group by 1;

create or replace view public.analytics_usage_total with (security_invoker = true) as
select count(*) filter (where kind = 'guide_generation') as guide_generations,
       count(*) filter (where kind = 'question') as questions,
       count(*) filter (where kind = 'tts') as tts_requests,
       coalesce(sum(audio_seconds) filter (where kind = 'tts'), 0) / 60.0 as audio_minutes,
       coalesce(sum(chars) filter (where kind = 'tts'), 0) as tts_chars,
       coalesce(sum(input_tokens), 0) as input_tokens,
       coalesce(sum(output_tokens), 0) as output_tokens
from public.usage_log;

revoke all on public.analytics_usage_daily, public.analytics_usage_total from anon, authenticated;
grant select on public.analytics_usage_daily, public.analytics_usage_total to service_role;

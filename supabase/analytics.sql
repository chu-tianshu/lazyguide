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

-- ---------------------------------------------------------------------------------------------
-- Admin dashboard additions (run again safely): follow-up clicks, users, museums, preferences, favorites.

-- The app also logs 'explore_topic' (a follow-up suggestion button click).
alter table public.events drop constraint if exists events_event_check;
alter table public.events add constraint events_event_check
  check (event in ('app_open', 'work_view', 'play', 'replay', 'complete', 'expand', 'question', 'explore_topic'));

-- Unique users: everyone with an account row, split into Google/email sign-ins and anonymous guests.
-- Not security_invoker: it reads auth.users, so it is locked to the service role below.
create or replace view public.analytics_users as
select count(*) as total_users,
       count(*) filter (where not coalesce(is_anonymous, false)) as signed_in_users,
       count(*) filter (where coalesce(is_anonymous, false)) as guest_users
from auth.users;

-- One row per museum: distinct visitors and distinct works opened (visits), favorites, and event views.
create or replace view public.analytics_museums with (security_invoker = true) as
with v as (
  select museum_id, count(distinct user_id) as visitors, count(*) as works_visited from public.visits group by 1
), f as (
  select museum_id, count(*) as favorites from public.favorites group by 1
), e as (
  select museum_id, count(*) as views from public.events where event = 'work_view' and museum_id is not null group by 1
)
select coalesce(v.museum_id, f.museum_id, e.museum_id) as museum_id,
       coalesce(v.visitors, 0) as visitors, coalesce(v.works_visited, 0) as works_visited,
       coalesce(f.favorites, 0) as favorites, coalesce(e.views, 0) as views
from v full join f using (museum_id) full join e using (museum_id);

-- Preference choices: kind is length | style | topic | language.
create or replace view public.analytics_preferences with (security_invoker = true) as
select 'length' as kind, length as label, count(*) as users from public.user_preferences group by 2
union all select 'style', style, count(*) from public.user_preferences group by 2
union all select 'topic', t, count(*) from public.user_preferences, unnest(topics) as t group by 2
union all select 'language', coalesce(language, 'unset'), count(*) from public.user_preferences group by 2;

-- Follow-ups: suggestion-button clicks and typed questions, by museum.
create or replace view public.analytics_follow_ups with (security_invoker = true) as
select coalesce(museum_id, 'unknown') as museum_id,
       count(*) filter (where event = 'explore_topic') as clicks,
       count(*) filter (where event = 'question') as questions,
       count(distinct user_id) filter (where event = 'explore_topic') as click_users
from public.events where event in ('explore_topic', 'question') group by 1;

revoke all on public.analytics_users, public.analytics_museums, public.analytics_preferences, public.analytics_follow_ups from anon, authenticated;
grant select on public.analytics_users, public.analytics_museums, public.analytics_preferences, public.analytics_follow_ups to service_role;
grant select on public.visits, public.favorites, public.user_preferences to service_role;

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

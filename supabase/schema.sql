-- Run once in the Supabase SQL editor for this project.
-- Tracks which museum/work guides a signed-in visitor has viewed.

create table if not exists public.visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  museum_id text not null,
  work_id text not null,
  visited_at timestamptz not null default now(),
  unique (user_id, museum_id, work_id)
);

alter table public.visits enable row level security;

drop policy if exists "select own visits" on public.visits;
create policy "select own visits" on public.visits
  for select using (auth.uid() = user_id);

drop policy if exists "insert own visits" on public.visits;
create policy "insert own visits" on public.visits
  for insert with check (auth.uid() = user_id);

drop policy if exists "update own visits" on public.visits;
create policy "update own visits" on public.visits
  for update using (auth.uid() = user_id);

-- Documents how many anonymous ("continue without an account") sign-ins have
-- happened. No select policy: this is read from the Supabase dashboard
-- (table editor / SQL editor), not from the app.
create table if not exists public.anonymous_logins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.anonymous_logins enable row level security;

drop policy if exists "insert own anonymous login" on public.anonymous_logins;
create policy "insert own anonymous login" on public.anonymous_logins
  for insert with check (auth.uid() = user_id);

-- Newer Supabase projects do not grant new tables to the API roles automatically.
-- Row-level security above still limits every row to its own user.
grant usage on schema public to anon, authenticated;
grant select, insert, update on public.visits to authenticated;
grant insert on public.anonymous_logins to authenticated;

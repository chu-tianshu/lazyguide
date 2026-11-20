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

create policy "select own visits" on public.visits
  for select using (auth.uid() = user_id);

create policy "insert own visits" on public.visits
  for insert with check (auth.uid() = user_id);

create policy "update own visits" on public.visits
  for update using (auth.uid() = user_id);

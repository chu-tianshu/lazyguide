-- Run once in the Supabase SQL editor for this project.
-- A signed-in visitor's favorite museums (newest first on the front page).

create table if not exists public.favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  museum_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, museum_id)
);

alter table public.favorites enable row level security;

drop policy if exists "select own favorites" on public.favorites;
create policy "select own favorites" on public.favorites
  for select using (auth.uid() = user_id);

drop policy if exists "insert own favorites" on public.favorites;
create policy "insert own favorites" on public.favorites
  for insert with check (auth.uid() = user_id);

drop policy if exists "delete own favorites" on public.favorites;
create policy "delete own favorites" on public.favorites
  for delete using (auth.uid() = user_id);

grant usage on schema public to anon, authenticated;
grant select, insert, delete on public.favorites to authenticated;

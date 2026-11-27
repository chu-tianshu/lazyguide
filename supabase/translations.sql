-- Run once in the Supabase SQL editor (after catalog.sql), before loading supabase/seed/*-translations*.sql.
-- Titles, artists and materials that open sources have in a visitor's language, for works in a catalog
-- written in another one (English). Only fields a source actually has are stored: nothing is machine-translated.
-- Sources: Wikidata labels, and the Louvre's own French records. See scripts/localize/README.md.

create table if not exists public.work_translations (
  museum_id text not null,
  work_id text not null,
  language text not null,
  title text,
  artist text,
  -- Replacement values for the work's facts, keyed by the fact's English label: { "Medium": "huile sur bois" }.
  facts jsonb not null default '{}',
  primary key (museum_id, work_id, language)
);

alter table public.work_translations enable row level security;

drop policy if exists "public read work_translations" on public.work_translations;
create policy "public read work_translations" on public.work_translations for select using (true);

grant select on public.work_translations to anon, authenticated;

-- Run once in the Supabase SQL editor, before loading supabase/seed/*.sql.
-- The museum catalog: museums, one catalog per museum and language, and the works in it.
-- Public read-only (the app reads it with the anon key). There are no write policies,
-- so rows can only be changed from the dashboard / SQL editor / service role.

create table if not exists public.museums (
  id text primary key,
  name text not null,
  subtitle text not null,
  lat double precision not null,
  lng double precision not null,
  city text not null,
  country text not null,
  continent text not null,
  -- Inner markup of a 24x24 SVG drawn with strokes in currentColor. Each museum needs its own glyph.
  icon text not null,
  sort_order integer not null default 0
);

create table if not exists public.catalogs (
  museum_id text not null references public.museums (id) on delete cascade,
  language text not null,
  museum_name text not null,
  location text not null,
  text_credit text,
  -- Category names in display order.
  categories text[] not null default '{}',
  primary key (museum_id, language)
);

create table if not exists public.works (
  museum_id text not null,
  language text not null,
  id text not null,
  -- Display order within the catalog.
  position integer not null,
  title text not null,
  category text,
  subtitle text,
  artist text,
  -- [{ "label": "Date", "value": "1889" }, ...], labelled in the catalog's language.
  facts jsonb not null default '[]',
  object_url text,
  -- { "src": "/images/<museum>/<id>.jpg", "sourceUrl", "license", "author"?, "sourceLabel"? }.
  -- src is a file under public/images; null when there is no public image.
  image jsonb,
  -- { "short", "expansion", "long" } or { "text" } or { "text", "unavailable": true }.
  guide jsonb not null,
  primary key (museum_id, language, id),
  foreign key (museum_id, language) references public.catalogs (museum_id, language) on delete cascade
);

create index if not exists works_catalog_position on public.works (museum_id, language, position);

alter table public.museums enable row level security;
alter table public.catalogs enable row level security;
alter table public.works enable row level security;

drop policy if exists "public read museums" on public.museums;
create policy "public read museums" on public.museums for select using (true);

drop policy if exists "public read catalogs" on public.catalogs;
create policy "public read catalogs" on public.catalogs for select using (true);

drop policy if exists "public read works" on public.works;
create policy "public read works" on public.works for select using (true);

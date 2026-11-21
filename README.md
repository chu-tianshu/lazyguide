# LazyGuide

Prototype web audio guide for art and history museums: High Museum of Art, Henan Museum, Southern Song Deshou Palace Site Museum and Cleveland Museum of Art have guide texts (English and/or Chinese); eight more art museums (Seattle, National Gallery of Art, MoMA, Art Institute of Chicago, Louvre, Orsay, Prado, National Gallery London) have catalog metadata and images only. See [design.md](design.md) for design notes.

**Features:** world map and museum/language selection, search, pre-written guides with a speech player (progress, captions, speed), follow-up questions answered by Claude, and a sign-in gate (Google or guest) with a "My visits" history.

## Setup

```sh
npm install
cp .env.example .env.local   # fill in values
npm run dev                  # http://localhost:3000
```

| Variable | Purpose |
| --- | --- |
| `ANTHROPIC_API_KEY` | Anthropic API key (server-side only). |
| `ANTHROPIC_MODEL` | Claude model ID used by the API routes. |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key. Public; access is controlled by row-level security. |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key (server-side only, never `NEXT_PUBLIC_`). Lets `/api/search-source` store works found online. |

`GET /api/health` reports whether the API key is configured.

## Supabase

The catalog and visit history both live in Supabase Postgres, accessed from the browser under row-level security. Without the Supabase variables the sign-in gate cannot be passed.

1. Create a Supabase project.
2. In the SQL editor, run [`supabase/schema.sql`](supabase/schema.sql) (`visits`, `anonymous_logins`), [`supabase/catalog.sql`](supabase/catalog.sql) (`museums`, `catalogs`, `works`, public-read), then [`supabase/seed-all.sql`](supabase/seed-all.sql) (the whole catalog in one file), then [`supabase/sources.sql`](supabase/sources.sql) (`museum_sources`, for online search).
3. Authentication → Sign In / Providers: enable **Allow anonymous sign-ins** (needed for guest access).
4. Enable the **Google** provider with an OAuth client from Google Cloud Console; its authorized redirect URI is `https://<project-ref>.supabase.co/auth/v1/callback`.
5. Authentication → URL Configuration: allow `http://localhost:3000` and the production URL.
6. Set the two `NEXT_PUBLIC_SUPABASE_*` variables locally and in Vercel.

Guest sessions are counted in `anonymous_logins`: `select count(*) from anonymous_logins;`.

## Catalog data

Editable source is JSON in `supabase/data/` (`museums.json` plus `<museum>/<language>.json`). Regenerate the SQL with `node scripts/build-seed.mjs`, which writes `supabase/seed/*.sql` and the combined `supabase/seed-all.sql` (upserts, safe to re-run). The app reads the catalog through [`src/lib/catalogApi.ts`](src/lib/catalogApi.ts); guide texts are fetched when a work is opened.

Preview images are in `public/images/<museum>/`, Public domain or CC0 only. Credits: [CREDITS.md](CREDITS.md).

## Searching online

When a search matches nothing in the cached catalog, the collection page offers to look the phrase up by title in the museum's online sources. Sources are rows of `museum_sources` ([`supabase/sources.sql`](supabase/sources.sql)), tried in priority order: the Cleveland Museum of Art Open Access API and the Art Institute of Chicago API where they exist, and Wikidata (items in the museum's collection) with the Wikipedia article as text and a public-domain Wikimedia Commons image for the rest. `/api/search-source` (signed-in users only) stores up to three title matches in `works` (ids `x-<source>-<id>`), so they are cached for everyone afterwards. The Deshou Palace museum has no source. Adapters: [`src/lib/sourceSearch/`](src/lib/sourceSearch/).

## Deploying

Import the repo in Vercel (Next.js preset), add the environment variables above, and each push to `main` deploys to production.

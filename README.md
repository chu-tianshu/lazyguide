# LazyGuide

Prototype web audio guide for art and history museums: High Museum of Art, Henan Museum, Southern Song Deshou Palace Site Museum, Cleveland Museum of Art and The King Center & King Birth Home (Atlanta) have guide texts (English and/or Chinese); eight more art museums (Seattle, National Gallery of Art, MoMA, Art Institute of Chicago, Louvre, Orsay, Prado, National Gallery London) have catalog metadata and images only. See [design.md](design.md) for design notes.

**Features:** world map and museum selection (language is a per-user setting), search, pre-written guides with a speech player (progress, captions, speed), follow-up questions answered by Claude, and a sign-in gate (Google or guest) with a "My visits" history.

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
| `OPENAI_API_KEY` | OpenAI key (server-side). Powers the natural guide voice (`gpt-4o-mini-tts`). Optional `OPENAI_TTS_VOICE` (default `coral`). Without it the app uses the browser voice. |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key (server-side only, never `NEXT_PUBLIC_`). Lets `/api/search-source` store works found online. |

`GET /api/health` reports whether the API key is configured.

## Supabase

The catalog and visit history both live in Supabase Postgres, accessed from the browser under row-level security. Without the Supabase variables the sign-in gate cannot be passed.

1. Create a Supabase project.
2. In the SQL editor, run [`supabase/schema.sql`](supabase/schema.sql) (`visits`, `anonymous_logins`), [`supabase/personalization.sql`](supabase/personalization.sql) (`user_preferences`, `generated_guides`), [`supabase/catalog.sql`](supabase/catalog.sql) (`museums`, `catalogs`, `works`, public-read), then the files in [`supabase/seed/`](supabase/seed/) one by one (`00_museums.sql` first, then each museum; a large museum such as the Prado is split into `prado-1.sql`, `prado-2.sql`, … to run in order, because the SQL editor rejects very large queries), then [`supabase/sources.sql`](supabase/sources.sql) (`museum_sources`, for online search).
3. Authentication → Sign In / Providers: enable **Allow anonymous sign-ins** (needed for guest access).
4. Enable the **Google** provider with an OAuth client from Google Cloud Console; its authorized redirect URI is `https://<project-ref>.supabase.co/auth/v1/callback`.
5. Authentication → URL Configuration: allow `http://localhost:3000` and the production URL.
6. Set the two `NEXT_PUBLIC_SUPABASE_*` variables locally and in Vercel.

Guest sessions are counted in `anonymous_logins`: `select count(*) from anonymous_logins;`.

## Catalog data

Editable source is JSON in `supabase/data/` (`museums.json` plus `<museum>/<language>.json`). Regenerate the SQL with `node scripts/build-seed.mjs`, which writes `supabase/seed/*.sql` (upserts, safe to re-run; big catalogs are split into numbered parts). The app reads the catalog through [`src/lib/catalogApi.ts`](src/lib/catalogApi.ts); guide texts are fetched when a work is opened.

Preview images are in `public/images/<museum>/`, Public domain or CC0 only. Credits: [CREDITS.md](CREDITS.md).

## Louvre explorer

The Louvre (about 760 works) is browsed as an interactive floor plan instead of a list: choose a level, a wing or a sub-area, click a room on the plan (or in the list) and then an artwork. Typing in the search box switches to the plain result list. Rooms, locations and metadata come from the Louvre's public collection records, the plan outlines from OpenStreetMap indoor data, images from Wikimedia Commons; [`scripts/louvre/README.md`](scripts/louvre/README.md) describes the import. Component: [`LouvreExplorer`](src/components/LouvreExplorer.tsx). After regenerating, run `supabase/seed/louvre.sql` in the Supabase SQL editor.

## Prado explorer

The Prado is browsed room by room ([`PradoExplorer`](src/components/PradoExplorer.tsx)): rooms are listed collapsed, and opening one shows its artworks. About 1,800 works across 118 rooms; room numbers come from the Prado's own collection pages, collected in a browser because the site blocks bots. There is no open floor-plan data, so no floors. Import notes: [`scripts/prado/README.md`](scripts/prado/README.md). After regenerating, run `supabase/seed/prado-1.sql` … `prado-4.sql` in order in the Supabase SQL editor.

## Searching online

When a search matches nothing in the cached catalog, the collection page offers to look the phrase up by title in the museum's online sources. Sources are rows of `museum_sources` ([`supabase/sources.sql`](supabase/sources.sql)), tried in priority order: the Cleveland Museum of Art Open Access API and the Art Institute of Chicago API where they exist, and Wikidata (items in the museum's collection) with the Wikipedia article as text and a public-domain Wikimedia Commons image for the rest. `/api/search-source` (signed-in users only) stores up to three title matches in `works` (ids `x-<source>-<id>`), so they are cached for everyone afterwards. The Deshou Palace museum has no source. Adapters: [`src/lib/sourceSearch/`](src/lib/sourceSearch/).

## Deploying

Import the repo in Vercel (Next.js preset), add the environment variables above, and each push to `main` deploys to production.

## Personalised guides

On first sign-in a visitor chooses a language, a length, a style and one or more topics (saved in `user_preferences`, editable under **Settings**). On a work's page, **Rewrite to my preferences** (or **Generate a guide for my preferences** when the work has no guide) calls `/api/generate-guide`, which has Claude write a script from the catalog facts plus the existing guide as reference. Each unique work + language + length + style + topic-set is generated once and stored in `generated_guides`; later requests for the same combination reuse the stored text. Needs `supabase/personalization.sql` run once, and the Anthropic and service-role env vars.


## Guide voice

Playing a work requests audio one sentence at a time from `/api/tts` (signed-in users only), which generates it with OpenAI `gpt-4o-mini-tts` the first time and stores the MP3 in a public Supabase Storage bucket `tts` (created automatically), keyed by a hash of the text and voice. Nothing is generated until a visitor plays that work, and each sentence is generated once for everyone. If the service is unavailable the player falls back to the browser voice. Client: [`src/lib/tts.ts`](src/lib/tts.ts), [`GuidePlayer`](src/components/GuidePlayer.tsx).

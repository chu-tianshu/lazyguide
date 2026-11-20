# LazyGuide

Prototype web audio guide for a curated set of works at the High Museum of Art (Atlanta), the Henan Museum 河南博物院 (Zhengzhou), the Southern Song Deshou Palace Site Museum 南宋德寿宫遗址博物馆 (Hangzhou), and the Cleveland Museum of Art (whose guide texts and images are the museum's own, released under CC0). See [design.md](design.md) for the design, decisions, and open items.

**What works:** museum and language selection, search, pre-written guides with a speech player (progress, captions, speed), and follow-up questions answered by Claude once the environment variables below are set.

## Guide data

One cleaned JSON file per museum and language lives in `src/data/guides/<museum>/<language>.json` and is registered in `src/data/catalog.ts`. Only the languages a museum has files for are offered. The original supplied files, including research notes, are archived in `research/source/` and are not shipped. Image credits are in [CREDITS.md](CREDITS.md).

## Local setup

```sh
npm install
cp .env.example .env.local   # fill in values (server-side only)
npm run dev                  # http://localhost:3000
```

## Environment variables

| Name | Purpose |
| --- | --- |
| `ANTHROPIC_API_KEY` | Anthropic API key. Server-side only; never exposed to the browser. |
| `ANTHROPIC_MODEL` | Claude model ID used by the API routes. |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL. Public; access is controlled by row-level security, not secrecy. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key. Same as above. |

`GET /api/health` reports whether the API key is configured, without revealing it.

## Accounts and visit history

The first screen is a sign-in gate: **Sign in with Google**, or **Continue without an account** (an anonymous Supabase user, created fresh each time someone picks this on a new browser/device, persisted after that so they aren't re-counted every visit). Either way, the museums/works a visitor actually opens a guide for are tracked (`src/lib/visits.ts`) and shown on the "My visits" screen. The data lives in Supabase (Postgres), accessed directly from the browser and scoped per-user by row-level security — there's no custom backend for this. Anonymous sign-ins are additionally logged to `anonymous_logins` purely as a count of how many guest sessions have been created; there's no app-facing read of that table, it's for checking in the Supabase dashboard.

One-time setup:

1. **Create a Supabase project** at [supabase.com](https://supabase.com) (free tier is fine).
2. **Run the schema**: open the SQL editor in the Supabase dashboard and run [`supabase/schema.sql`](supabase/schema.sql). This creates the `visits` and `anonymous_logins` tables and their row-level security policies.
3. **Enable anonymous sign-ins**: in the Supabase dashboard, go to Authentication → Sign In / Providers and turn on "Allow anonymous sign-ins". Without this, "Continue without an account" fails.
4. **Create a Google OAuth client**: in [Google Cloud Console](https://console.cloud.google.com/apis/credentials), create an OAuth 2.0 Client ID (type: Web application). Set its **Authorized redirect URI** to `https://<your-project-ref>.supabase.co/auth/v1/callback` (find your project ref in the Supabase dashboard URL or Project Settings → API).
5. **Enable Google sign-in in Supabase**: in the Supabase dashboard, go to Authentication → Providers → Google, enable it, and paste in the Google client ID and client secret from step 4.
6. **Allow redirect URLs**: in Supabase, go to Authentication → URL Configuration and add both `http://localhost:3000` and your production URL (e.g. `https://lazyguide.vercel.app`) to the allowed redirect URLs.
7. **Set the two `NEXT_PUBLIC_SUPABASE_*` env vars** (from Project Settings → API in Supabase) in `.env.local` for local dev, and in Vercel → Project → Settings → Environment Variables for production.

If these env vars are unset, the gate is still shown but neither button works — the rest of the app is unreachable until they're set, since signing in (or continuing as a guest) is now required.

To see how many anonymous sessions have been created, run `select count(*) from anonymous_logins;` in the Supabase SQL editor.

## Deploying to Vercel

1. Import this GitHub repository in Vercel (framework preset: Next.js).
2. Add `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, and (if accounts are set up) the two `NEXT_PUBLIC_SUPABASE_*` variables under Project → Settings → Environment Variables.
3. Each push to `main` deploys to production.

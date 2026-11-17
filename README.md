# LazyGuide

Prototype web audio guide for a curated set of works at the High Museum of Art (Atlanta) and the Henan Museum 河南博物院 (Zhengzhou). See [design.md](design.md) for the design, decisions, and open items.

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

`GET /api/health` reports whether the API key is configured, without revealing it.

## Deploying to Vercel

1. Import this GitHub repository in Vercel (framework preset: Next.js).
2. Add `ANTHROPIC_API_KEY` and `ANTHROPIC_MODEL` under Project → Settings → Environment Variables.
3. Each push to `main` deploys to production.

# LazyGuide

Prototype web audio guide for a curated set of 30 paintings at the High Museum of Art. See [design.md](design.md) for the full brief.

**Status:** Milestone 1 scaffold. The UI shell, typed catalog with test placeholders, and client-side search are in place. Guide generation, speech playback, expansion and Q&A are still placeholders.

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

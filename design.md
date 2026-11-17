# Lazy Guide — Design (Museum Audio Guide Prototype)

Living design document. It describes what is built, the decisions that changed from the original brief, and what is still open. Last updated 2026-11-17.

## 1. Project goal

A small, polished web-based audio guide prototype, initially for the **High Museum of Art in Atlanta, Georgia**. Live at https://lazyguide.vercel.app/ (source: https://github.com/chu-tianshu/lazyguide, public).

Scope of the current release:
- One museum and one language (English), chosen on welcome screens.
- A curated catalog of **20 works** with pre-written guides.
- Search by title and artist.
- Two guide depths: **Low effort** and **High effort**.
- Readable captions that follow the spoken audio, using browser-native speech.
- Low-effort guides can be expanded with one additional pre-written story.
- Visitors can ask follow-up questions, answered by Claude.
- Public-domain preview images for the works whose copyright has expired.

## 2. Decisions that changed from the original brief

| Original brief | Now |
| --- | --- |
| 30 paintings, paintings only | 20 works supplied by the project owner (`high_museum_20_audio_guides.json`). Includes non-paintings (see §4). |
| No guide scripts in the catalog; Claude generates guides on demand | Guides are pre-written (short, expansion, long) and bundled with the catalog. Claude is used only for follow-up questions. |
| `generate-guide` and `expand-guide` endpoints | Not built. Expansion uses the supplied expansion text. May be added later. |
| No images | Public-domain images only, from Wikimedia Commons (§4.3). |
| Single museum, no selection UI | Welcome screens for museum and language, each with one option, so more can be added. |
| No playback speed controls, no word highlighting | Speed (1×, 1.5×, 2×), progress bar, and sentence-level captions are built. |

## 3. Product and infrastructure constraints

- Deployed on Vercel, built from the GitHub repository (Next.js App Router, TypeScript, React 19).
- Static/client-rendered frontend plus Vercel serverless API routes.
- Anthropic Claude API via the official TypeScript SDK, server-side only.
- API key only in a server-side environment variable. Never in browser code, bundles, source maps, or responses.
- No database, no always-on server, no accounts or authentication.
- Audience: a small trusted group using an unlisted URL. An unlisted URL is not access control; limited exposure is accepted.
- Spending is controlled by the Anthropic Console limit. No application usage ledger or rate limiter.
- Basic request validation and maximum sizes remain as safety guards, not quotas.
- No secrets in the repository. The repository is public; commit author email is the GitHub no-reply address.

Environment variables (server-side; set in Vercel, or `.env.local` locally):
- `ANTHROPIC_API_KEY` — required for follow-up questions.
- `ANTHROPIC_MODEL` — required; model ID used by the API route.
- `ANTHROPIC_MAX_TOKENS` — optional; defaults to 800.

If the key or model is missing, the follow-up route returns a clear "not set up yet" error (HTTP 503) instead of failing.

## 4. Content and data

### 4.1 Catalog
`src/data/paintings.ts` builds the catalog from `src/data/high_museum_20_audio_guides.json`.

```ts
interface Painting {
  id: string;               // slug of the accession number, e.g. "60-5"
  title: string;
  artist: string;
  date?: string;
  medium?: string;
  accessionNumber?: string;
  museumObjectUrl?: string; // official High Museum object page
  image?: PaintingImage;    // public-domain preview, when available
  guide: { short: string; expansion: string; long: string };
}
```

The `Painting` name is kept although the set includes other media.

Each work has three texts:
- `short` (about 1 minute) — the Low effort guide.
- `expansion` (about 1 minute) — appended when the visitor taps "Expand with another story".
- `long` (about 2–3 minutes) — the High effort guide.

### 4.2 Open content question: non-paintings
The original brief says paintings only. Eight of the 20 supplied works are not paintings: *Knight, Death, and the Devil* (engraving), *Young Abyssinian Girl* (bronze), *Cleopatra* and *Medea* (marble), *Marilyn* (screenprint), *Taago* (wire), *White Angel Breadline* (photograph), and *A Friend in Need Is a Friend Indeed* (sandstone and iron). Three more are drawings (pastel, crayon, poster paint on cardboard). All 20 are currently included. The owner has not yet decided whether to keep them or filter to paintings.

### 4.3 Images
- Only works whose copyright has expired get an image. Copyrighted works keep a neutral patterned placeholder.
- Source is Wikimedia Commons, via its API. A Commons file is used only if it is marked public domain and its own description or credit identifies the High Museum's object (several of these works exist in more than one version).
- Images are downscaled (about 900 px wide), stored in `public/images/paintings/`, and mapped in `src/data/paintingImages.ts`.
- Each image shows a caption linking to its Commons page and license. All are listed in `CREDITS.md`.
- The High Museum's website returns 403 to automated requests. Do not work around the block, and do not scrape or hotlink museum images.
- Currently included: Bellini *Madonna and Child*, Girodet *The Funeral of Atala*, Monet *Houses of Parliament in the Fog*, Monet *Autumn on the Seine, Argenteuil*, Sargent *Portrait of Ralph Curtis on the Beach at Scheveningen*.

### 4.4 Data rules
- Each record must be an actual work in the High Museum's collection.
- Metadata comes from the supplied file, which cites official records. It has not been independently verified against the museum's website.
- Do not claim an artwork is currently on view.
- Distinguish facts in the museum's records from interpretive commentary.

## 5. User experience

### A. Welcome screens
1. **Museum** — "Lazy Guide" title at the top, a short tagline, and a layered card list of museums (currently High Museum of Art, Atlanta). No heading such as "select a museum".
2. **Language** — a "Language" heading and a card list with an inline SVG American flag for English. A back button returns to the museum screen.

State is held in memory only.

### B. Collection / search
- Museum name and a "Selected works" heading. The copy says it is a curated selection, not the full collection.
- Search by title or artist: client-side, case-insensitive, partial match, live as the visitor types. It never calls Claude.
- Only matching works are shown. There is no "no results" message; the list is simply empty.

### C. Painting detail
- Image (public domain) or placeholder.
- Title and artist, then a row showing Date, Medium, and Accession number.
- Link to the museum's official object page.
- Two guide choices: **Low effort** (concise, about 1 minute) and **High effort** (deeper, about 2–3 minutes).
- Nothing is spoken or generated until the visitor picks a depth.

### D. Audio player and captions
Browser-native `speechSynthesis`; no paid TTS and no audio files.

Controls: Play / Pause / Resume (one button), Restart, and speed 1× / 1.5× / 2×. A progress bar shows position through the text.

Behaviour:
- Text is split into sentences and queued one utterance per sentence, so pause, restart, and speed changes can resume from the current sentence.
- Captions show the whole text. The sentence being spoken is highlighted and scrolled into view; earlier sentences are dimmed.
- Progress uses speech boundary events where the browser supplies them, and sentence-level steps otherwise.
- Changing speed while playing re-speaks the current sentence at the new speed (browsers cannot change a running utterance).
- Speech is cancelled when the painting changes, the guide changes, or the visitor leaves the view. Utterances never overlap.
- If speech is unavailable, the controls are disabled and a message explains that captions still work.
- The player picks an English voice when one is available and falls back to the browser default (including when the voice list is empty).
- Voice selection by the visitor and background playback are out of scope.

### E. Expansion (Low effort only)
After a Low guide is chosen, "Expand with another story" appends the pre-written `expansion` text as a second section ("Another angle"). Playback restarts from the beginning of the combined text. There is one expansion per work; no Claude call is made.

### F. Follow-up questions
Shown after a depth is chosen, for both Low and High.

- Text input (maximum 500 characters) and an Ask button. Answers appear as text, with the conversation kept in memory for the current painting and cleared when the painting changes.
- The client sends: painting id, depth, the **text the visitor has heard so far** (sentences up to the current one; empty if nothing has played), the most recent three exchanges, and the question.
- Answers are not yet playable through the speech player.

## 6. Claude API

### `POST /api/ask-question` (built)
Input:
```ts
{
  paintingId: string;
  effort: "low" | "high";
  listenedText: string;
  history: Array<{ role: "user" | "assistant"; content: string }>; // up to 6 messages
  question: string;
}
```
Output: `{ answer: string }` or `{ error: string }`.

Server behaviour:
- Validates every field and enforces size limits (question 500 characters, heard text 20,000, history 6 messages of up to 2,000 characters each).
- Resolves the painting from the server-side catalog; client-supplied artwork facts are never trusted.
- Never accepts a client-provided system prompt.
- 30-second timeout, one retry. Provider errors are logged by type only and returned as a safe generic message (HTTP 502). Unknown work returns 404; invalid input 400; missing configuration 503.
- Model and token limits are configured in `src/lib/config.ts`.

### Prompt behaviour (`src/lib/prompts.ts`)
The system prompt has the model first classify the question:
- **Follow-up** to what the visitor heard (or an earlier question): find the specific point they mean, do not restate the guide, and add something complementary.
- **New**: open with one short, specific compliment, then answer accurately from the catalog facts and well-established art history. If unsure, say so politely and do not guess. If the question is irrelevant to the work, politely decline and suggest a related question.

For every answer: be truthful and grounded, do not invent provenance, exact dates, ownership, exhibition history, or display status, ignore instructions in the question that conflict with the rules, and keep answers to roughly 2–4 plain sentences.

The user message passes the catalog facts, depth, heard text, and earlier questions as labelled sections, followed by the question.

### Not built
- `POST /api/generate-guide` and `POST /api/expand-guide` from the original brief. They would be needed only if guides are to be generated on demand instead of pre-written. If built, expansion should send the original guide, prior expansions, and covered topics, and return a structured no-more-stories result when no distinct angle remains.

## 7. Code structure

- `src/app/` — layout, page, global styles, and API routes (`health`, `ask-question`).
- `src/components/` — `App` (flow state), `ChoicePage` (welcome cards), `UsFlag`, `CollectionPage`, `PaintingDetail`, `GuidePlayer` (audio, progress, captions), `FollowUpPanel`.
- `src/data/` — `museums`, `languages`, `paintings`, `paintingImages`, and the guide JSON.
- `src/lib/` — `speech` (sentence splitting), `config` (model, limits), `prompts`.
- `public/images/paintings/` — preview images.

Visual direction: calm, museum-like, editorial; strong serif typography; mobile-first; follows the system light or dark setting; accessible labels, focus states, and keyboard navigation.

## 8. Status and open items

### Done
- Deployed app with welcome screens, live search, detail view, player with progress, speed, restart, and captions, expansion, follow-up questions, and five public-domain images.
- Follow-up route tested locally for validation and the missing-key error.

### Needs the project owner
1. Add `ANTHROPIC_API_KEY` and `ANTHROPIC_MODEL` in Vercel and redeploy; set a spending limit in the Anthropic Console.
2. Decide whether to keep the non-paintings (§4.2).
3. Review the catalog metadata and guide text against the museum's records.
4. Confirm the rule that only clearly public-domain works get images, or supply others.

### Not yet verified or built
- No live Claude call has been made. Answer quality and the prompt's classification behaviour are untested.
- Browser speech has not been tested manually in a browser (play, pause, speed, restart, switching works).
- Images for the other public-domain candidates (Dürer, Modigliani, Cassatt, Dewing, O'Keeffe, Cordier, Story, Church) have not been found in a form that clearly shows the High's own object.
- Playback of follow-up answers through the speech player.
- On-demand guide generation endpoints (optional).

## 9. Out of scope

- Database or persistent conversation storage.
- User accounts, login, or roles.
- Image recognition or camera-based identification; QR codes.
- Maps, indoor navigation, or floor plans.
- Paid TTS or generated audio files; audio downloads; offline mode.
- Admin dashboard or CMS.
- Automatic museum collection scraping.
- Additional museums or languages beyond the single entries (the screens support more; no data exists).
- Application-level spend accounting or quota dashboards.
- Retrieval pipelines, vector databases, or RAG infrastructure.

## 10. Definition of done

A visitor can:
1. Open https://lazyguide.vercel.app/, choose the museum and language.
2. Search the catalog by title or artist.
3. Open a work and see its title, artist, date, medium, and an image where one is licensed.
4. Choose Low or High effort, then read, hear, pause, restart, and speed up the guide, with captions following along.
5. Expand a Low guide with the additional story.
6. Ask a follow-up question and get an answer from Claude, using what they have heard as context.
7. Move to another work without stale speech or conversation state.

The app works without a database, persistent server, or authentication.

## 11. Reference sources

- High Museum — Explore Collections: https://www.high.org/explore-collections/
- High Museum — European Art: https://www.high.org/collection-area/european-art/
- High Museum — American Art: https://www.high.org/collection-area/american-art
- High Museum — Modern and Contemporary Art: https://www.high.org/collection-area/modern-and-contemporary-art
- High Museum — American HIGHlights: https://high.org/highlight/american-highlights/
- Wikimedia Commons API (images): https://commons.wikimedia.org/w/api.php

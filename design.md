# Lazy Guide — Design (Museum Audio Guide Prototype)

Living design document. It describes what is built, the decisions that changed from the original brief, and what is still open. Last updated 2026-11-17.

## 1. Project goal

A small, polished web-based audio guide prototype, initially for the **High Museum of Art in Atlanta, Georgia**. Live at https://lazyguide.vercel.app/ (source: https://github.com/chu-tianshu/lazyguide, public).

Scope of the current release:
- Three museums chosen on a world map: the High Museum of Art (Atlanta), the Henan Museum 河南博物院 (Zhengzhou), and the Cleveland Museum of Art.
- A language screen that offers only the languages each museum has guides for: English for Atlanta and Cleveland; English and Simplified Chinese for Henan.
- A curated catalog of 20 works each for Atlanta and Henan (Henan shows 19; see §4.5) with guides written for this app, and 179 works for Cleveland whose guide texts are the museum's own (§4.6).
- Search by title and artist.
- Two guide depths for the guides written for this app: **Low effort** and **High effort**. Cleveland's guides are the museum's own single text, with no depths.
- Readable captions that follow the spoken audio, using browser-native speech.
- Low-effort guides can be expanded with one additional pre-written story.
- Visitors can ask follow-up questions, answered by Claude.
- Preview images from Wikimedia Commons where a suitably licensed photo exists (§4.3).

## 2. Decisions that changed from the original brief

| Original brief | Now |
| --- | --- |
| 30 paintings, paintings only | 20 works supplied by the project owner (`high_museum_20_audio_guides.json`). Includes non-paintings (see §4). |
| No guide scripts in the catalog; Claude generates guides on demand | Guides are pre-written (short, expansion, long) and bundled with the catalog. Claude is used only for follow-up questions. |
| `generate-guide` and `expand-guide` endpoints | Not built. Expansion uses the supplied expansion text. May be added later. |
| No images | Wikimedia Commons images: public domain or CC0 for the High Museum; CC0 or credited CC BY-SA for the Henan Museum (§4.3). |
| Single museum, no selection UI | Welcome screens for museum and language, each with one option, so more can be added. |
| No playback speed controls, no word highlighting | Speed (1×, 1.5×, 2×), progress bar, and sentence-level captions are built. |
| Single museum, single language | Two museums and two languages. Choosing a language also switches the interface text, the speech voice, and the language Claude answers in. |

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
Guide data lives in one cleaned JSON file per museum and language:

```
src/data/guides/high-atlanta/en.json
src/data/guides/henan/en.json
src/data/guides/henan/zh.json
```

`src/data/catalog.ts` registers the files, serves the catalog for a museum and language, and offers only the languages a museum has files for. Adding a language or museum means adding a file and registering it there.

Each file has a `museum` block (name and location in that language) and a `works` list:

```ts
interface Work {
  id: string;              // stable slug, e.g. "60-5" (High, from the accession number) or "henan-02"
  title: string;
  subtitle?: string;       // e.g. the Chinese name shown under an English title
  artist?: string;         // absent for archaeological objects
  facts: { label: string; value: string }[]; // display rows, labelled in the file's language
  objectUrl?: string;      // official museum page
  listed?: boolean;        // false hides the work everywhere (app and API)
  unlistedReason?: string;
  guide: { short: string; expansion: string; long: string };
}
```

The shipped files contain only display data and guide text. Research flags, word counts, and the original supplied files are archived in `research/source/` and are not part of the app bundle.

The facts rows are High: Date, Medium, Accession; Henan: Period, Type, Material, and Size (Size only where the source marks the figures as coming from the museum record). Display values were written from the supplied metadata with research caveats removed; the caveats remain in the archived source files.

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
- Currently included: Bellini *Madonna and Child*, Girodet *The Funeral of Atala*, Monet *Houses of Parliament in the Fog*, Monet *Autumn on the Seine, Argenteuil*, Sargent *Portrait of Ralph Curtis on the Beach at Scheveningen*, and Church *A Friend in Need Is a Friend Indeed* (CC0 photo of an 1888 sculpture).
- Found but not yet added: Cassatt *Sketch of a Mother Looking Down at Thomas* (Commons file tagged public domain by age; the download was throttled by Commons and should be retried later).
- Henan Museum: five objects have CC0 photos on Commons whose descriptions name the Henan Museum, and are included: Jiahu bone flute (01), bronze jin (05), Four Spirits mural (08), painted pottery double vessel (10), Wangsun Gao bell set (12). Ten more use CC BY-SA 4.0 photos (the owner approved attribution licenses for Henan): Fu Hao owl zun (02), Lianhe fanghu (03), Wu Zetian gold slip (04), Duling square ding (06), Ru ware vase (09), Ziwu ding (11), jade burial suit (14), sancai horn cup (15), green-glazed dog (16), sancai lion pillow (19). The photographer is named in the on-page caption, and CREDITS.md records the license and that adapted (downscaled) copies are shared under CC BY-SA 4.0 for those image files only. The High Museum rule is unchanged: public domain or CC0 only.
- Found but deliberately excluded: O'Keeffe *Red Canna*. Its Commons file is tagged public domain only under the US pre-1923 publication rule, and O'Keeffe died in 1986, so expiry is not clear. Add it only if the owner accepts that risk.

### 4.4 Data rules
- Each record must be an actual work in that museum's collection.
- Metadata comes from the supplied file, which cites official records. It has not been independently verified against the museum's website.
- Do not claim an artwork is currently on view.
- Distinguish facts in the museum's records from interpretive commentary.

### 4.5 Henan Museum data
- 20 objects supplied in English and Simplified Chinese, with the same ids in both languages. Neither file has artists or accession numbers; links to the museum's records exist for some objects only (the two files were merged where one had a link and the other did not).
- **Object 13, 牛尊 (Ox-shaped zun), is hidden** (`listed: false`). The supplied research notes found no Henan Museum record for it; sources point to the Yinxu Museum in Anyang. It stays in the data and returns once the holding is confirmed. The 19 listed objects are shown.
- Guide texts keep their own honest hedging (for example, objects whose official record is not yet verified). Do not add or remove claims without checking the research notes.
- The shipped metadata has not been reviewed against the museum's records.

### 4.6 Cleveland Museum of Art data (museum's own text)
- **Why this museum:** the Cleveland Museum of Art releases its open-access dataset under CC0 ("has waived all copyright and related or neighboring rights to this dataset", https://github.com/ClevelandMuseumArt/openaccess), and its Terms and Conditions (https://www.clevelandart.org/terms-and-conditions) allow CC0 content to be used commercially and non-commercially without permission or attribution. Text and images were chosen from this museum because of that licence; other museums checked (High Museum, Henan Museum, Kunsthaus Zürich) do not allow reuse of their text.
- **Source and rules:** the text comes only from the museum's open-access API (`https://openaccess-api.clevelandart.org/api/artworks/` with `cc0=1&highlight=1&has_image=1`), field `description`, never from pages of clevelandart.org (website text is not CC0). Every record has `share_license_status: CC0`, no copyright field, a description, and a web image; the build script enforces this.
- **Text is used as supplied:** the only change is removing the markup (`<em>`, `<br>`) and decoding `&amp;`. A check compares each stored text with the museum's text after the same cleaning (0 differences). No text is paraphrased, shortened or added to.
- **Selection:** the API lists 249 CC0 highlights. 179 are used, spread across the museum's 18 departments in proportion to their size (largest remainder), taking the lowest accession numbers within each department. The remaining 70 were left out only to respect the 179 cap and can be added.
- **Single guide, no depths:** guide files may give a work `guide: { text }` instead of `{ short, expansion, long }`. Such a work shows its player immediately, with no Low/High choice and no expansion button, and credits the source under the player (`museum.textCredit`). Follow-up questions work as for the other museums; the question prompt tells Claude the text is the museum's own.
- **Categories** are the museum's own departments, ordered by number of works. The artist line is the museum's creator description (name, nationality, dates); where there is no creator, the facts show the culture instead.
- **Images:** the museum's own 900 px CC0 web images, re-encoded lightly (JPEG quality 82), in `public/images/cleveland/`. Each caption links to the museum's object page.
- The data file is `src/data/guides/cleveland/en.json`. English only.

## 5. User experience

### A. Welcome screens
1. **Museum (world map)** — "Lazy Guide" title and tagline at the top, then a zoomable, pannable world map filling the rest of the screen. Each museum sits at its real location. What is drawn depends on the zoom level (`src/components/MuseumMap.tsx`):
   - Zoomed far out: a numbered badge per **continent**; closer in, per **country**; closer still, per **city**. The number is how many museums that place holds. Clicking a badge flies in to it (a single museum goes straight to its icon).
   - Zoomed in close enough (zoom 8 and up): each museum's own **unique icon** (a distinct glyph per museum, defined in `src/data/museums.ts`).
   - **Clicking an icon** shows a name card (museum name and place, with an arrow); clicking the map background or pressing Escape dismisses it. **Clicking the card** selects the museum and moves on to the language screen. Clicking the icon again does not select. Icons are keyboard-focusable: Enter shows the card, and Enter again on the same icon selects (keyboard users cannot click the card).
   - Adding a museum means adding its `place` (coordinates, city, country, continent) and a new unique `icon` in `src/data/museums.ts`. Counts and grouping follow automatically.
   - The map uses Leaflet with OpenStreetMap tiles (attribution shown on the map). Tiles are loaded from OpenStreetMap's public tile server, which is intended for light use; a different tile provider would be needed for heavy traffic. The map needs a network connection.
2. **Language** — a "Language · 语言" heading and cards for only the languages the chosen museum offers, each with an inline SVG flag (United States for English, China for Simplified Chinese). A back button returns to the museum screen.

The chosen language sets the interface text (`src/lib/i18n.ts`), the page language, the speech voice (`en-US` or `zh-CN`), the sentence splitting rules, and the language Claude answers in. If the device has no Chinese voice, the captions still work and a note says so.

State is held in memory only.

### B. Collection / search
- Works are grouped under category headings (with a count), in the order the data file lists them. Each guide file has an ordered `categories` list and every work names one. High Museum: European Art, American Art, Modern & Contemporary Art, Photography, Folk & Self-Taught Art. Henan: Bronzes, Ceramics & Pottery, Jade/Gold/Weapons, Musical Instruments, Murals (and the Chinese equivalents in the Chinese file). The assignments are the project's own judgment from each work's date, medium and origin, not the museums' official classification. Search filters within the groups and hides empty ones.
- Museum name and a "Selected works" heading. The copy says it is a curated selection, not the full collection. An "All museums" link returns to the welcome screen.
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
After a Low guide is chosen, "Expand with another story" appends the pre-written `expansion` text as a second section ("Another angle") and **starts playing it immediately**, sentence by sentence, from its first sentence. The player stays mounted, so the first story's captions, speed setting, and position are kept. If the first story is still playing, it is cut off and the expansion starts at once.

The progress bar covers both stories: it measures position through the combined text (by characters), with a thin divider where the expansion begins. Before expanding it covers the first story alone, so the bar steps back (for example from 100% to about 50%) when the expansion is added.

"Heard so far" for follow-up questions contains only sentences that were actually spoken, so skipping the rest of the first story by expanding early does not count it as heard. There is one expansion per work; no Claude call is made.

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
  museumId: string;
  language: "en" | "zh";
  workId: string;
  effort: "low" | "high";
  listenedText: string;
  history: Array<{ role: "user" | "assistant"; content: string }>; // up to 6 messages
  question: string;
}
```
Output: `{ answer: string }` or `{ error: string }`.

Server behaviour:
- Validates every field and enforces size limits (question 500 characters, heard text 20,000, history 6 messages of up to 2,000 characters each).
- Resolves the work from the server-side catalog for the given museum and language; client-supplied facts are never trusted. Unknown or unlisted works return 404.
- Error messages are returned in the visitor's language. The prompt tells Claude to answer in that language.
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
- `src/components/` — `App` (flow state), `MuseumMap` (museum selection map), `ChoicePage` (language cards), `UsFlag`, `CnFlag`, `CollectionPage`, `PaintingDetail`, `GuidePlayer` (audio, progress, captions), `FollowUpPanel`.
- `src/data/` — `museums`, `languages`, `catalog` (loads and serves the guide files), `paintingImages`, and `guides/<museum>/<language>.json`.
- `src/lib/` — `i18n` (interface text and error messages in each language), `speech` (sentence splitting), `config` (model, limits), `prompts`.
- `public/images/paintings/` — preview images (High Museum works only).
- `research/source/` — the original supplied JSON files with research notes; not shipped.

Visual direction: calm, museum-like, editorial; strong serif typography; mobile-first; follows the system light or dark setting; accessible labels, focus states, and keyboard navigation.

## 8. Status and open items

### Done
- Deployed app with welcome screens, live search, detail view, player with progress, speed, restart, and captions, expansion, follow-up questions, and six public-domain or CC0 images.
- Follow-up route tested locally for validation and the missing-key error.

### Needs the project owner
1. Add `ANTHROPIC_API_KEY` and `ANTHROPIC_MODEL` in Vercel and redeploy; set a spending limit in the Anthropic Console.
2. Decide whether to keep the non-paintings in the High set (§4.2), and whether the Henan ox-shaped zun (§4.5) can be confirmed as a Henan Museum object.
3. Review the catalog metadata and guide text against the museum's records.
4. Confirm the rule that only clearly public-domain works get images, or supply others.

### Not yet verified or built
- The Chinese interface text and the Chinese guide display values (§4.1) have not been reviewed by a native speaker. Chinese speech depends on the device having a Chinese voice and has not been tested in a browser.
- 4 of the 19 Henan objects have no image: 07 jade-hilted sword, 17 pottery stove, 18 Fu Yi jue, 20 lotus-petal bowl. No Commons photo of the Henan Museum's object was found.
- No live Claude call has been made. Answer quality and the prompt's classification behaviour are untested.
- Browser speech has not been tested manually in a browser (play, pause, speed, restart, switching works).
- Images for the other public-domain candidates (Dürer, Modigliani, Dewing, Cordier, Story) have not been found in a form that clearly shows the High's own object. The Cassatt download needs a retry.
- Playback of follow-up answers through the speech player.
- On-demand guide generation endpoints (optional).

## 9. Out of scope

- Database or persistent conversation storage.
- User accounts, login, or roles.
- Image recognition or camera-based identification; QR codes.
- Indoor maps, navigation, or floor plans. (A world map is used for choosing a museum only.)
- Paid TTS or generated audio files; audio downloads; offline mode.
- Admin dashboard or CMS.
- Automatic museum collection scraping.
- Museums or languages beyond those listed. The screens support more: add a guide file and register it in `src/data/catalog.ts`.
- Application-level spend accounting or quota dashboards.
- Retrieval pipelines, vector databases, or RAG infrastructure.

## 10. Definition of done

A visitor can:
1. Open https://lazyguide.vercel.app/, choose a museum, then one of that museum's languages.
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

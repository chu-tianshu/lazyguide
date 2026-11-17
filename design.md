# Museum Audio Guide — Coding Agent Brief

## 1. Project goal

Build a small, polished web-based audio guide prototype, initially for the **High Museum of Art in Atlanta, Georgia**.

The first release is deliberately narrow:
- One museum.
- A curated catalog of **30 notable paintings** (paintings only; exclude sculpture, prints, photography, decorative arts, and other media).
- Search by painting title and painter.
- Two guide depths: **Low effort** and **High effort**.
- Readable guide text and browser-native spoken audio.
- Low-effort guides can be expanded with additional, non-repetitive stories.
- Visitors can ask arbitrary follow-up questions, answered by Claude.

**Do not download or bundle painting images.** The first version needs painting metadata only. Artwork images and image rights are explicitly out of scope for this milestone. Do not scrape or hotlink images as a workaround.

The exact list and researched details for the 30 paintings will be supplied/curated in a later step. Do not invent a list of collection objects or fill the catalog with fabricated artwork facts. Build the data model and app so that the real 30 records can be added later.

## 2. Product and infrastructure constraints

### Required stack / deployment
- Deploy as a Vercel web app.
- Use a static/client-rendered frontend plus Vercel serverless API routes.
- Use the Anthropic Claude API for guide generation, expansion, and follow-up Q&A.
- Store the Anthropic API key only in a Vercel server-side environment variable, e.g. `ANTHROPIC_API_KEY`.
- Never expose the key in browser code, client bundles, source maps, or API responses.
- No database.
- No traditional always-on server.
- No user accounts or authentication in this prototype.
- Intended audience: a small, trusted group using an unlisted URL. An unlisted URL is not access control; accept that limited exposure for this prototype.
- Rely on Anthropic Console spending limits as the initial budget control. Do not build an application usage ledger, Redis counter, or database-backed rate limiter.
- Still implement basic request validation and sensible maximum input/output sizes to prevent accidental oversized calls. These are correctness/safety guards, not a separate quota system.

### Suggested implementation choices
Use a mainstream, Vercel-compatible TypeScript framework (Next.js App Router is a reasonable default) unless the repository already has a suitable framework. Keep dependencies and abstractions minimal. Use the official Anthropic TypeScript SDK from server-only code.

Keep the Claude model name configurable through a server-side environment variable such as `ANTHROPIC_MODEL`; do not scatter model identifiers through the UI.

## 3. Main user experience

### A. Collection / search screen
- Show the museum name and a simple collection heading.
- Display the catalog of 30 paintings as a compact searchable list or grid.
- Search must match:
  - Painting title.
  - Painter / artist name.
- Search is client-side against bundled metadata; it must not call Claude.
- Search should be case-insensitive and tolerate partial matches.
- Selecting a painting opens its detail/guide view.
- Include a clear way to return to the collection/search view.
- Do not imply that the app covers the museum's entire collection; it is a curated 30-painting selection.

### B. Painting detail / guide screen
Display available catalog metadata:
- Painting title.
- Artist.
- Date/year, if known.
- Medium, if known.
- A short factual description/context, if supplied in the catalog.
- A link to the museum's official object page, if supplied.

No image is required. Use a neutral visual placeholder rather than a fake artwork image.

Offer two explicit guide choices:
1. **Low effort** — concise, approachable guide.
2. **High effort** — more detailed guide with deeper historical, artistic, and contextual interpretation.

The guide must be:
- Readable on screen.
- Speakable through the browser's built-in `SpeechSynthesis` API.
- Generated on demand through Claude for the selected painting and requested effort level.
- Clearly associated with the selected painting and effort level.

Do not generate both versions automatically. Generate only the version the visitor requests.

### C. Audio playback
Use browser-native `window.speechSynthesis`; do not integrate a paid TTS provider or generate audio files.

Required controls:
- Play.
- Pause.
- Resume.
- Stop.
- Replay from the beginning.

Implementation notes:
- Provide a single reusable audio-player component.
- Handle browsers where speech synthesis is unavailable; the transcript must remain usable and show a clear message.
- Cancel speech when the user changes paintings or leaves the guide view.
- Avoid overlapping utterances when the user starts another guide or question.
- Handle long text safely. Split into manageable sentence/paragraph chunks if necessary, and queue them in order.
- Do not assume speech synthesis voices are immediately available; handle `voiceschanged` and an empty voice list.
- Keep the displayed text as the source of truth. Speech is a playback enhancement, not a separate content store.
- Voice selection, playback speed controls, word-level highlighting, and background playback are out of scope for the first version.

### D. Low-effort expansion
After a Low effort guide has been generated, show an **Expand with another story** (or similarly clear) action.

Each expansion must:
- Call the server and Claude.
- Add a new, self-contained section/story to the existing guide.
- Avoid repeating topics and facts already covered.
- Preserve all existing guide text; append the new section rather than replacing the original.
- Be readable and playable through the same audio controls.
- Allow more than one expansion, subject to the visitor's interest and Anthropic's configured spend limit.

To reduce repetition, send Claude:
- Painting metadata and any trusted source notes.
- The original low-effort guide.
- The text or a concise structured summary of all previously generated expansions.
- A list of covered topics/facts (maintain this in client session state).
- An instruction to choose a genuinely new angle and explicitly avoid restating prior material.

Ask Claude to return a structured response with:
- `title` (short section heading).
- `text` (the new story).
- `topic` (short topic identifier/description).

Do not rely only on a vague instruction such as “don't repeat yourself.” Pass actual prior content / covered-topic state. If no genuinely distinct angle remains, Claude should say so in a structured, user-friendly way rather than padding or repeating.

Expansion is available only for Low effort in the first release. Do not add expansion controls to High effort.

### E. Follow-up questions
Both Low effort and High effort guides must allow the visitor to ask a free-form follow-up question.

Requirements:
- Provide a text input and submit action.
- Send the question to a Claude-backed API route.
- Include the selected painting's metadata, the active guide text, and the prior Q&A turns for that painting in the current browser session.
- The answer should be readable and playable using the same speech player.
- Keep the question/answer history in client memory only. It does not need to survive refreshes or be stored remotely.
- The answer should focus on the selected artwork. If the question asks for information not supported by supplied facts or reliable model knowledge, Claude should clearly distinguish uncertainty rather than inventing provenance, dates, ownership, or museum display status.
- Allow a new question after each answer.
- Stop/cancel any current speech before playing a new answer.

No general-purpose chatbot outside the context of a selected painting is needed.

## 4. Content and data model

Create a local, typed catalog module (for example `src/data/paintings.ts`) containing exactly 30 painting records when the real catalog is added.

For the initial UI scaffold, use a small number of clearly marked test fixtures if needed. Do not present fixtures as real High Museum collection objects. Keep the app able to render an empty/incomplete catalog gracefully until the curated 30 records are supplied.

Suggested TypeScript shape:

```ts
export interface Painting {
  id: string;                 // stable slug or museum accession identifier
  title: string;
  artist: string;
  date?: string;
  medium?: string;
  dimensions?: string;
  department?: string;
  description?: string;       // concise, factual, editorially reviewed
  museumObjectUrl?: string;   // official High Museum object page, if available
  sources?: Array<{
    label: string;
    url: string;
    note?: string;
  }>;
}
```

Data rules:
- Only paintings.
- Each record must correspond to an actual work in the High Museum's collection, not merely an artist represented by the museum.
- Prefer the museum's official collection/object pages and official collection highlights for object identity and factual metadata.
- Record source URLs for later editorial verification.
- Do not claim an artwork is currently on view unless a current authoritative source confirms it.
- Distinguish facts in the museum's records from interpretive commentary.
- Do not download artwork images as part of this project milestone.
- Do not add full guide scripts to the catalog; Claude generates guide content on demand.

## 5. Claude API design

Implement three small server-side endpoints. Keep prompt construction and Anthropic SDK calls in server-only modules, not React components.

### `POST /api/generate-guide`
Input:
```ts
{
  paintingId: string;
  effort: "low" | "high";
}
```

Server behavior:
- Validate `paintingId` against the local catalog.
- Resolve painting metadata on the server from the catalog; do not trust arbitrary client-supplied artwork facts.
- Ask Claude for a visitor-friendly guide focused on this painting.
- Low effort: concise, engaging, accessible language; aim for roughly 1–2 minutes spoken.
- High effort: a more substantial guide; aim for roughly 4–6 minutes spoken, with deeper visual analysis, technique, historical context, and interpretation.
- Do not fabricate facts. Mark uncertainty and avoid unsupported claims.
- Return structured JSON, at minimum:
```ts
{
  title: string;
  text: string;
}
```

### `POST /api/expand-guide`
Input:
```ts
{
  paintingId: string;
  originalGuide: string;
  previousExpansions: Array<{
    title: string;
    text: string;
    topic: string;
  }>;
}
```

Server behavior:
- Validate the painting ID and enforce reasonable request size limits.
- Resolve trusted painting metadata server-side.
- Generate one new story that adds a distinct angle and does not repeat the supplied guide/expansions.
- Return:
```ts
{
  title: string;
  text: string;
  topic: string;
  hasMoreDistinctStories?: boolean;
}
```
If no meaningful new angle is available, return a clear no-more-content result rather than repetitive text. Define a consistent response shape for this case.

### `POST /api/ask-question`
Input:
```ts
{
  paintingId: string;
  effort: "low" | "high";
  activeGuide: string;
  history: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
  question: string;
}
```

Server behavior:
- Validate all fields and enforce reasonable history/question size limits.
- Resolve painting metadata server-side.
- Include the active guide and recent Q&A context in the Claude prompt.
- Answer the current question directly and conversationally.
- Return:
```ts
{
  answer: string;
}
```

### API implementation requirements
- Use server-only environment variables.
- Never accept a client-provided system prompt.
- Validate request bodies (Zod or similarly lightweight validation is fine).
- Return useful HTTP status codes and safe error messages.
- Do not return raw provider errors, secrets, or stack traces to the browser.
- Add a reasonable timeout/abort strategy where supported.
- Keep model and token limits configurable in one place.
- Do not add streaming unless it is straightforward and does not complicate the first milestone.
- Keep prompts concise but explicit; don't overbuild a prompt framework.

## 6. Client state and session behavior

No persistent storage is required.

Keep in-memory state for:
- Selected painting.
- Selected effort level.
- Generated guide.
- Expansion sections and covered topics.
- Follow-up Q&A history.
- Current loading/error state.
- Current speech playback state.

When the visitor switches paintings:
- Stop speech immediately.
- Clear the previous painting's guide, expansions, and Q&A from the active view.
- Load the newly selected painting's detail view.

A page refresh may clear generated guides and Q&A. This is expected for the prototype.

## 7. Suggested UI structure

Keep the interface responsive and usable on a phone, since visitors may use it while standing in a gallery.

Suggested components:
- `CollectionPage` — museum header, search, painting results.
- `PaintingDetail` — metadata and guide controls.
- `GuidePanel` — guide text, effort label, expansion action.
- `SpeechPlayer` — shared browser-native speech controls.
- `FollowUpPanel` — question input and answer history.

Avoid unnecessary routing complexity. A simple route per painting or client-side selected-painting state is acceptable. Prefer the simplest implementation that remains easy to understand.

Visual direction:
- Calm, museum-like, editorial layout.
- Strong typography and generous spacing.
- Avoid dashboard aesthetics.
- Mobile-first responsive behavior.
- Clear distinction between painting metadata, guide narrative, expansions, and Q&A.
- Accessible labels, keyboard navigation, focus states, and sufficient contrast.

## 8. What the coding agent should do vs. what the project owner will do

### Coding agent: implement now
1. Inspect the existing repository before making framework assumptions.
2. Set up or adapt the Vercel-compatible application.
3. Build the collection/search experience using typed local data.
4. Build the painting detail and Low/High guide selection UI.
5. Implement the reusable browser SpeechSynthesis player.
6. Implement the three Claude API endpoints.
7. Implement low-effort expansion with prior-content awareness.
8. Implement contextual follow-up Q&A for both effort levels.
9. Add loading, empty, and error states.
10. Add a small, clearly labeled fixture dataset only if required to exercise the UI.
11. Add `.env.example` with variable names only, never real credentials.
12. Add a README with local setup, Vercel deployment, and Anthropic environment-variable instructions.
13. Verify the application locally and document any manual configuration that cannot be performed by the agent.

### Project owner: provide/do later
1. Supply or approve the final curated list of 30 High Museum paintings.
2. Review and approve factual metadata and source links for those paintings.
3. Create/configure the Anthropic API key and set the desired spending limit in Anthropic Console.
4. Add the API key and chosen Claude model to Vercel environment variables.
5. Connect the repository to Vercel and deploy, if the agent does not have authorized access.

The agent must not invent the final 30-object catalog, acquire images, or spend time researching artwork content in this implementation phase.

## 9. Incremental milestones and verification

Work in small increments. Do not implement the whole application in one unverified pass.

### Milestone 1 — App shell and local catalog
Implement:
- Vercel-compatible app shell.
- Typed `Painting` model.
- Local catalog module with clearly marked fixtures only.
- Collection list and client-side search by title and artist.

Verify:
- Search matches partial title.
- Search matches partial artist name.
- Search is case-insensitive.
- Empty results are handled.
- Selecting a result opens the correct detail view.
- No network or Claude call occurs during search.

### Milestone 2 — Guide generation and transcript
Implement:
- Low/High selection.
- `POST /api/generate-guide`.
- Loading and error states.
- Readable guide transcript.

Verify:
- Each effort calls the API only when selected.
- Low guide is materially shorter than High guide.
- Returned content is associated with the correct painting.
- Missing API key produces a clear setup error, not a broken page.
- Invalid painting IDs are rejected server-side.

### Milestone 3 — Speech playback
Implement the shared SpeechSynthesis player.

Verify manually in at least one Chromium browser:
- Play, pause, resume, stop, replay.
- Switching paintings cancels old speech.
- Starting new speech does not overlap old speech.
- Long text is spoken in order.
- Transcript remains readable when speech synthesis is unavailable.

### Milestone 4 — Expansion
Implement Low-effort expansion and topic tracking.

Verify:
- Expansion appends a new section.
- Original guide is unchanged.
- A second expansion receives both the original guide and first expansion as context.
- Repeated expansions do not simply paraphrase the same story.
- No-more-distinct-content response is handled gracefully.
- Expanded text can be played.

### Milestone 5 — Follow-up questions
Implement contextual Q&A for both effort levels.

Verify:
- Questions are sent to Claude.
- The selected painting and active guide are included as context.
- Earlier turns are included in later requests.
- Switching paintings clears the active conversation.
- Answers are readable and playable.
- Empty questions and oversized requests are rejected.

### Milestone 6 — Deployment readiness
Verify:
- Production build succeeds.
- No API key appears in client bundle or browser network responses.
- Vercel serverless routes work after deployment.
- Anthropic errors are handled safely.
- README and `.env.example` are accurate.

## 10. Out of scope for this first version

Do not implement:
- Database or persistent conversation storage.
- User accounts, login, or roles.
- Downloading, hosting, or displaying actual artwork images.
- Image recognition or camera-based artwork identification.
- QR-code scanning.
- Maps, indoor navigation, or museum floor plans.
- TTS provider integration or generated audio files.
- Audio downloads.
- Offline mode.
- Admin dashboard or CMS.
- Automatic museum collection scraping.
- Multi-museum support.
- Application-level spend accounting or quota dashboards.
- Complex agent orchestration, retrieval pipelines, vector databases, or RAG infrastructure.

## 11. Public reference sources for later catalog curation

Use these as starting points when the 30 painting records are curated. They are not a pre-approved list of 30 individual objects.

- High Museum — Explore Collections: https://www.high.org/explore-collections/
- High Museum — European Art: https://www.high.org/collection-area/european-art/
- High Museum — American Art: https://www.high.org/collection-area/american-art
- High Museum — Modern and Contemporary Art: https://www.high.org/collection-area/modern-and-contemporary-art
- High Museum — American HIGHlights: https://high.org/highlight/american-highlights/
- High Museum — History of the High Museum: https://high.org/history-of-the-high-museum/

The High's collection spans multiple departments and media. The eventual shortlist must filter strictly to paintings and verify each specific object against museum sources.

## 12. Definition of done for the coding phase

The coding phase is complete when a visitor can:
1. Open the Vercel-hosted app.
2. Search the local painting catalog by title or artist.
3. Select a painting.
4. Request either a Low-effort or High-effort guide.
5. Read and listen to the guide using browser speech synthesis.
6. Expand a Low-effort guide with additional non-repetitive stories.
7. Ask follow-up questions about the selected painting in either effort mode.
8. Navigate to another painting without stale speech or conversation state leaking into the new selection.

The app must work without a database, persistent server, authentication, or bundled artwork images.

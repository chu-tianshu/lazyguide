# Museum experience: the Louvre is the north star

When adding or reworking a museum's collection page, aim for the Louvre explorer
(`src/components/LouvreExplorer.tsx`, data in `scripts/louvre/`). It is the reference for what "good" looks like here.

## The experience
- **Geometry first.** A real floor plan the visitor can click, with rooms tied to the museum's own room numbers. Outlines come from open data (the Louvre uses OpenStreetMap indoor ways, ODbL, credited on the page). Rooms with no outline stay reachable as chips under the plan. The plan says it is schematic and not every room is outlined.
- **Two independent, orthogonal filters, wing then level.** Wing (or building/zone) row first, level row second, each with a small label once, chips are plain numbers for levels (−2 … 2, ascending) and plain names for wings. Default: ground level and all wings. Each chip's count ignores only its own row. The plan, heading and list show the intersection.
- **Never grey out or disable a chip.** Empty choices are selectable and show an empty state. Choosing a wing that has nothing on the current level goes back to the ground level. Do not dim empty chips.
- **No genre, school or "sub-area" filters** on the geometry views. Colour rooms by wing/zone, not by what hangs in them.
- **Rooms and works.** Click a room on the plan or in the list to see its works; works are grouped by room in room-number order; artwork cards (thumbnail, title, artist, date) open the guide page. Works with no room go in a collapsed "not on display / not recorded" section.
- **Remember the place.** Coming back from a work restores level, wing, selected room and the exact scroll position.
- **Search falls back to the plain result list**; the explorer is only shown when the search box is empty.
- **Fallback when there is no geometry** (e.g. the Prado): collapsed room headings, each opening to the artwork cards. Never invent a plan.

## The data
- **Location and metadata** come from the museum's own public collection records (room, wing, level, department, date, size, inventory number); Wikidata for IDs and English labels; Wikimedia Commons for images.
- **Images:** only Public domain, CC0, CC BY or CC BY-SA files, hot-linked as 500 px thumbnails (`Special:FilePath?width=500`), with the author credited where the licence requires. Never use a museum's own copyrighted images.
- **Never invent location data** (rooms, floors, wings). If no open source has it, say so, and collect it from the museum's site by a route the museum allows. If the site blocks bots (the Prado does), do not bypass it: write a script the user runs in their own browser and build from the file it saves.
- **Reproducible pipeline** in `scripts/<museum>/` (`fetch.py`, `build.py`, README) that writes `supabase/data/<museum>/en.json` and `src/data/<museum>/*.json`; never hand-edit generated files. Add the museum's sources to `CREDITS.md` and a note to `CLAUDE.md`.
- **Seed SQL:** the Supabase SQL editor rejects large queries; `scripts/build-seed.mjs` splits big catalogs into numbered parts. After pushing, tell the user which SQL files to run, in order.

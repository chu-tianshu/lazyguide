# Louvre import

Builds the Louvre catalog (works with metadata), the room list and the floor-plan outlines from public sources.

```sh
python3 scripts/louvre/fetch.py /tmp/louvre-cache      # downloads, ~10 min the first time
python3 scripts/louvre/build.py /tmp/louvre-cache      # writes the three files below
node scripts/build-seed.mjs                            # regenerates supabase/seed/louvre.sql
```

| Output | Used by |
| --- | --- |
| `supabase/data/louvre/en.json` | the catalog (Supabase `works`), via `build-seed.mjs` |
| `src/data/louvre/rooms.json` | rooms (level, wing, sub-area, outline) and which work hangs in which room |
| `src/data/louvre/plan.json` | floor-plan outlines per level, drawn by `src/components/LouvreExplorer.tsx` |

Sources and what is taken from each:

- **Louvre collection records** (`collections.louvre.fr/ark:/53355/cl<ark>.json`): room, wing, level, department, dates, dimensions, inventory number. Text metadata only; the Louvre's images are copyrighted (and its robots.txt asks AI crawlers to leave them) so none is used.
- **Wikidata**: which works have a Louvre ARK id (property P9394), English titles, creators, materials, and the Commons image.
- **Wikimedia Commons**: licence and author of each image. Only Public domain, CC0 and CC BY / CC BY-SA files are kept; images are hot-linked as 500 px thumbnails (`Special:FilePath?width=500`), not copied, and CC BY(-SA) authors are credited on the work page.
- **OpenStreetMap** (© OpenStreetMap contributors, ODbL): indoor room, corridor and wall outlines. Rooms are tied to the Louvre's room numbers by the `ref` tag where OpenStreetMap has it, otherwise by the name in `NAME_MATCH` in `build.py`.

Limits: only works that have a Wikidata item with a Louvre ARK id and at least two sitelinks are included (about 760 of the roughly 33,000 on display), so the coverage leans to famous works and to paintings. About 140 of 172 rooms are matched to an outline; the rest appear as chips under the plan. Sub-areas (`area_for` in `build.py`) are this app's grouping by department and, for paintings, school and period.

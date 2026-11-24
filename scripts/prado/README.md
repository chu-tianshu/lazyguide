# Prado import

```sh
python3 scripts/prado/fetch.py /tmp/prado-cache   # Wikidata + Commons, about a minute
python3 scripts/prado/build.py /tmp/prado-cache   # writes supabase/data/prado/en.json and src/data/prado/halls.json
node scripts/build-seed.mjs                       # regenerates supabase/seed/prado.sql
```

Unlike the Louvre, the Prado has no open floor or room data:

- The Prado's website (museodelprado.es) returns 403 to automated clients, and its linked-open-data endpoint is down, so it is not used.
- OpenStreetMap has no indoor map of the museum.
- **Wikidata** (CC0) records the hall for some works (`location` = "Prado Hall 012"). About 70 works in 12 halls have one; that is the whole hall index. Wikidata has no floor for a hall, so the explorer has halls and sub-areas but **no floors and no plan**.
- Sub-areas are the artist's country of citizenship on Wikidata (Spain, Habsburg Netherlands, Republic of Venice, …) grouped into schools.
- Images: Wikimedia Commons, hot-linked as 500 px thumbnails; only Public domain, CC0 and CC BY(-SA) files, with author credit where required.

To grow the index, add hall data to Wikidata (P276) or extend `build.py` with a new open source, then re-run. Do not hand-write hall numbers without a source.

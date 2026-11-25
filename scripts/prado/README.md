# Prado import

The Prado's website (museodelprado.es) blocks automated clients with a Cloudflare check, so the room data is collected
**by hand in a browser** and the rest is built from it:

```sh
# 1. In your browser: open https://www.museodelprado.es/en/explore-artworks, paste research/prado/collect-rooms.js into
#    the console (resumable; keep the tab visible). It downloads prado-rooms.json -> save it in research/prado/.
python3 scripts/prado/fetch.py /tmp/prado-cache      # Wikidata (by the Prado UUID = P8905) and Commons licences
python3 scripts/prado/build.py /tmp/prado-cache      # writes supabase/data/prado/en.json and src/data/prado/halls.json
node scripts/build-seed.mjs                          # regenerates supabase/seed/prado.sql
```

- **Rooms, titles, authors, medium/date, URLs:** from the Prado's own room listings (`research/prado/prado-rooms.json`).
- **Inventory number, size, Commons image:** from Wikidata, matched by the Prado UUID (Wikidata property P8905).
- **Images:** Wikimedia Commons only (Public domain, CC0, CC BY, CC BY-SA, hot-linked at 500 px); the Prado's own images are not used. Works Wikidata does not have, or has no free image for, show without a picture.
- **No floors and no plan:** no open source has them (OpenStreetMap has no indoor map). Do not add floor or room data without a source.
- **Known gaps:** the collector's paging stopped at 20 per page for a few rooms (051A, 051C, 063A, 079, 086, 089 and part of 079B), so about 70 works are missing. Re-run the collector to try again.

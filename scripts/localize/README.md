# Localized work metadata

Titles, artists and materials in the visitor's language, taken only from sources that have them. Nothing is machine-translated or written by hand.

```sh
python3 scripts/localize/fetch.py /tmp/localize-cache    # Wikidata + the Louvre's French records, ~20 min (throttled)
python3 scripts/localize/build.py /tmp/localize-cache    # writes supabase/translations/<museum>.json
node scripts/build-seed.mjs                              # writes supabase/seed/<museum>-translations*.sql
```

Run `supabase/translations.sql` once, then the generated `*-translations*.sql` files (parts in order). The app overlays these rows on the English catalog (`src/lib/localizeWork.ts`); a work or field with no row stays as the catalog has it.

## What each source offers (checked)

| Source | Languages for object data | Used |
| --- | --- | --- |
| Wikidata (labels of work, creator, material) | all nine, patchy per item | yes: title, artist, medium |
| Louvre collection records (collections.louvre.fr) | French only (the English page shows the same French record) | yes, for French: date, materials, department |
| Cleveland Open Access API, Art Institute of Chicago API | English only | no |
| National Gallery London | English only | no |
| Orsay, NGA, MoMA, Seattle, High, Prado sites | cannot be checked: they refuse automated clients (403), and we do not bypass that | no (Wikidata covers the works it has) |

## Matching

Louvre: ARK id (P9394). Prado: the Prado UUID (P8905). Others: exact English title, the museum being the item's collection (P195), and the creator's name agreeing with the catalog's artist. Unmatched works are left alone.

## Rules

- A field is written only when the source has it in that language. Wikidata `zh-hans`, `zh-cn`, then `zh` are read for Chinese, `pt` then `pt-br` for Portuguese.
- Artist: the creator's label plus life dates when the English text has plain years (e.g. `Léonard de Vinci (1452–1519)`); nationality words are dropped because they would be English.
- Room, wing and level text comes from the app's interface strings, not from here.
- Wikidata is community-edited: labels can be wrong or missing. Fix them there.

Remaining gaps: dimensions and dates are left as the English catalog has them (numbers) except French Louvre dates; department names exist only in French; the Prado's own Spanish text could be added by running the collector against the Spanish pages in a browser (not done).

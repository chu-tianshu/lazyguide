#!/usr/bin/env python3
"""Writes supabase/translations/<museum>.json from the downloads of scripts/localize/fetch.py.

    python3 scripts/localize/build.py <cache-dir>

A row is written only for a field that a source has in that language; nothing is translated or generated.
  title    Wikidata label of the work in that language (French: the Louvre's own "titre d'usage" if Wikidata has none)
  artist   Wikidata label of the work's single creator, followed by the life dates already in the English text
  facts    Medium: Wikidata labels of all the work's materials (French Louvre works: the Louvre's own materials field);
           Date and Department: French Louvre works only, from the Louvre's own record
A match between a catalog work and a Wikidata item is kept only when the museum's own ID matches (Louvre, Prado) or
the exact English title is in that museum's collection and the creator's name agrees with the catalog's artist.
Then run `node scripts/build-seed.mjs`.
"""
import json
import re
import sys
import unicodedata
from collections import Counter
from pathlib import Path

CACHE = Path(sys.argv[1])
ROOT = Path(__file__).resolve().parents[2]
WD_LANGS = {
    "fr": ["fr"], "es": ["es"], "de": ["de"], "pt": ["pt", "pt-br"], "it": ["it"], "ja": ["ja"], "ko": ["ko"],
    "zh": ["zh-hans", "zh-cn", "zh"],
}
items = json.loads((CACHE / "items.json").read_text())
labels = json.loads((CACHE / "labels.json").read_text())
louvre_fr = json.loads((CACHE / "louvre_fr.json").read_text())


def label(q, lang):
    for code in WD_LANGS[lang]:
        v = labels.get(q, {}).get(code)
        if v:
            return v.strip()
    return None


def tokens(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower()
    return {t for t in re.findall(r"[a-z]+", s) if len(t) > 2}


def artist_ok(work, creators):
    """True when the catalog's artist agrees with one of the item's creators (or there is nothing to compare)."""
    name = (work.get("artist") or "").split("(")[0]
    if not name.strip() or not creators:
        return True
    return any(tokens(name) & tokens(labels.get(c, {}).get("en", "")) for c in creators)


def choose(work, cands, by_id):
    if by_id:  # the museum's own ID matched, so the item is right; several items sharing it are ambiguous
        return next(iter(cands.items())) if len(cands) == 1 else None
    ok = [(q, c) for q, c in cands.items() if artist_ok(work, c["creators"])]
    return ok[0] if len(ok) == 1 else None


def artist_text(work, creators, lang):
    if len(creators) != 1:
        return None
    name = label(creators[0], lang)
    if not name:
        return None
    m = re.search(r"\(([^)]*)\)\s*$", work.get("artist") or "")
    if not m:
        return name
    years = re.search(r"\d.*$", m[1])
    # Only plain years are carried over; "c. 1390" has an English abbreviation, so the dates are left out.
    if years and re.fullmatch(r"\d{3,4}(\s*[–-]\s*\d{3,4})?", years[0]) and m[1].split(",")[-1].strip() == years[0]:
        return f"{name} ({years[0]})"
    return name


out_dir = ROOT / "supabase/translations"
out_dir.mkdir(exist_ok=True)
stats = Counter()
for museum, found in items.items():
    works = json.loads((ROOT / f"supabase/data/{museum}/en.json").read_text())["works"]
    by_id = museum in ("louvre", "prado")
    rows = []
    matched = 0
    for w in works:
        pick = choose(w, found.get(w["id"], {}), by_id)
        if not pick:
            continue
        matched += 1
        q, c = pick
        has_fact = {f["label"] for f in w["facts"]}
        for lang in WD_LANGS:
            row = {"work_id": w["id"], "language": lang}
            title = label(q, lang)
            fr = louvre_fr.get(w["id"]) if (museum == "louvre" and lang == "fr") else None
            if not title and fr:
                usage = next((d["value"] for d in (fr.get("denominationTitle") or []) if d.get("type") == "Titre d'usage"), None)
                title = usage or fr.get("title")
            if title and title != w["title"]:
                row["title"] = title
            artist = artist_text(w, c["creators"], lang)
            if artist and artist != w.get("artist"):
                row["artist"] = artist
            facts = {}
            if fr:
                if "Medium" in has_fact and fr.get("materialsAndTechniques"):
                    facts["Medium"] = fr["materialsAndTechniques"].strip()
                date = re.sub(r"^Date de création/fabrication\s*:\s*", "", fr.get("displayDateCreated") or "").strip()
                if "Date" in has_fact and date:
                    facts["Date"] = date
                if "Department" in has_fact and fr.get("collection"):
                    facts["Department"] = fr["collection"].strip()
            elif "Medium" in has_fact and c["materials"]:
                names = [label(m, lang) for m in c["materials"]]
                if all(names):
                    facts["Medium"] = ", ".join(names)
            if facts:
                row["facts"] = facts
            if len(row) > 2:
                rows.append(row)
                stats[(museum, lang)] += 1
    if not rows:
        (out_dir / f"{museum}.json").unlink(missing_ok=True)
        print(f"{museum}: no source has these works in other languages")
        continue
    (out_dir / f"{museum}.json").write_text(json.dumps({"museum": museum, "rows": rows}, ensure_ascii=False, separators=(",", ":")) + "\n")
    print(f"{museum}: {matched}/{len(works)} works matched; " + ", ".join(f"{l} {stats[(museum, l)]}" for l in WD_LANGS))

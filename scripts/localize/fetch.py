#!/usr/bin/env python3
"""Downloads the translated labels of the works in our catalogs from the open sources that have them.

    python3 scripts/localize/fetch.py <cache-dir>

Sources (see scripts/localize/README.md for why each was or was not used):
  Wikidata          item labels in every language we support, for the work, its creator and its materials.
                    Works are matched by the museum's own ID where Wikidata stores it (Louvre ARK P9394, Prado UUID P8905),
                    otherwise by exact English title + the museum being the item's collection (P195).
  Louvre records    collections.louvre.fr/ark:/53355/cl<ark>.json, which the museum publishes in French only:
                    title, date, materials and department, used as the French text.

Nothing is translated or generated here: a field is written only when a source has it in that language.
Each step is skipped when its file exists, so delete a file to refresh it. Requests are sequential and throttled.
Outputs: items.json, labels.json, louvre_fr.json.
"""
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

CACHE = Path(sys.argv[1])
CACHE.mkdir(parents=True, exist_ok=True)
ROOT = Path(__file__).resolve().parents[2]
UA = "LazyGuideLocalizeImport/1.0 (museum audio guide prototype)"
# Wikidata language codes to read for each of our languages, best first.
WD_LANGS = {
    "fr": ["fr"], "es": ["es"], "de": ["de"], "pt": ["pt", "pt-br"], "it": ["it"], "ja": ["ja"], "ko": ["ko"],
    "zh": ["zh-hans", "zh-cn", "zh"],
}
ALL_WD = sorted({c for v in WD_LANGS.values() for c in v} | {"en"})
# Museums matched by title: the English name the item's collection (P195) must contain.
COLLECTION = {
    "cleveland": r"cleveland museum of art", "aic": r"art institute of chicago", "moma": r"museum of modern art",
    "seattle": r"seattle art museum", "nga-dc": r"national gallery of art", "orsay": r"orsay",
    "national-gallery-london": r"^national gallery$", "high-atlanta": r"high museum of art", "prado": r"prado",
    "henan": r"henan museum",
}


def http(url, data=None, accept=None, retries=8):
    headers = {"User-Agent": UA}
    if accept:
        headers["Accept"] = accept
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, data=data, headers=headers)
            return json.load(urllib.request.urlopen(req, timeout=180))
        except urllib.error.HTTPError as e:
            if e.code not in (429, 502, 503, 504):
                raise
            time.sleep(20 * (attempt + 1))
    raise SystemExit(f"giving up on {url}")


def sparql(query):
    body = urllib.parse.urlencode({"query": query}).encode()
    return http("https://query.wikidata.org/sparql", data=body, accept="application/sparql-results+json")["results"]["bindings"]


def lit(s):
    return json.dumps(s, ensure_ascii=False)


def qid(uri):
    return uri.rsplit("/", 1)[-1]


def catalog(museum):
    return json.loads((ROOT / f"supabase/data/{museum}/en.json").read_text())["works"]


EXTRA = """OPTIONAL { ?item wdt:P170 ?c } OPTIONAL { ?item wdt:P186 ?m }"""


def rows_to_items(rows, key_of):
    """key -> {item, creators, materials, collections}; one entry per candidate item."""
    out = {}
    for r in rows:
        key = key_of(r)
        item = qid(r["item"]["value"])
        cand = out.setdefault(key, {}).setdefault(item, {"creators": set(), "materials": set(), "collections": set()})
        if "c" in r:
            cand["creators"].add(qid(r["c"]["value"]))
        if "m" in r:
            cand["materials"].add(qid(r["m"]["value"]))
        if "cl" in r:
            cand["collections"].add(r["cl"]["value"])
    return {k: {i: {f: sorted(v) for f, v in c.items()} for i, c in cands.items()} for k, cands in out.items()}


# ------------------------------------------------------------------ 1. which Wikidata item is each work
path = CACHE / "items.json"
if not path.exists():
    items = {}  # museum -> work id -> list of candidate items
    # Louvre: by ARK id.
    louvre = {}
    for w in catalog("louvre"):
        m = re.search(r"cl(\d+)$", w.get("objectUrl") or "")
        if m:
            louvre[m[1]] = w["id"]
    keys = list(louvre)
    found = {}
    for i in range(0, len(keys), 100):
        vals = " ".join(lit(k) for k in keys[i:i + 100])
        rows = sparql(f"SELECT ?key ?item ?c ?m WHERE {{ VALUES ?key {{ {vals} }} ?item wdt:P9394 ?key. {EXTRA} }}")
        found.update(rows_to_items(rows, lambda r: r["key"]["value"]))
        print("louvre", i, flush=True)
        time.sleep(3)
    items["louvre"] = {louvre[k]: v for k, v in found.items()}
    # Prado: by the UUID in the work id / URL (Wikidata P8905).
    prado, found = {}, {}
    uuid_re = re.compile(r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}")
    for w in catalog("prado"):
        m = uuid_re.search(w["id"]) or uuid_re.search(w.get("objectUrl") or "")
        if m:
            prado[m[0]] = w["id"]
    keys = list(prado)
    for i in range(0, len(keys), 100):
        vals = " ".join(lit(k) for k in keys[i:i + 100])
        rows = sparql(f"SELECT ?key ?item ?c ?m WHERE {{ VALUES ?key {{ {vals} }} ?item wdt:P8905 ?key. {EXTRA} }}")
        found.update(rows_to_items(rows, lambda r: r["key"]["value"]))
        print("prado", i, flush=True)
        time.sleep(3)
    items["prado"] = {prado[k]: v for k, v in found.items()}
    # Everything else: exact English title, in the museum's collection. Candidates are checked against the artist in build.py.
    for museum in COLLECTION:
        todo = [w for w in catalog(museum) if w["id"] not in items.get(museum, {})]
        titles = sorted({w["title"] for w in todo})
        found = {}
        for i in range(0, len(titles), 60):
            vals = " ".join(f"{lit(t)}@en" for t in titles[i:i + 60])
            rows = sparql(f"""SELECT ?key ?item ?cl ?c ?m WHERE {{ VALUES ?key {{ {vals} }} ?item rdfs:label ?key.
              ?item wdt:P195 ?coll. ?coll rdfs:label ?cl FILTER(LANG(?cl)="en") {EXTRA} }}""")
            found.update(rows_to_items(rows, lambda r: r["key"]["value"]))
            time.sleep(3)
        items.setdefault(museum, {})
        for w in todo:
            cands = {i: c for i, c in found.get(w["title"], {}).items()
                     if any(re.search(COLLECTION[museum], x, re.I) for x in c["collections"])}
            if cands:
                items[museum][w["id"]] = cands
        print(museum, len(items[museum]), "of", len(todo) + len(catalog(museum)) - len(todo), flush=True)
    path.write_text(json.dumps(items))
items = json.loads(path.read_text())

# ------------------------------------------------------------------ 2. their labels, in every language
path = CACHE / "labels.json"
if not path.exists():
    ids = set()
    for museum in items.values():
        for cands in museum.values():
            for q, c in cands.items():
                ids |= {q, *c["creators"], *c["materials"]}
    ids = sorted(ids)
    labels = {}
    for i in range(0, len(ids), 50):
        r = http("https://www.wikidata.org/w/api.php?" + urllib.parse.urlencode({
            "action": "wbgetentities", "format": "json", "props": "labels", "ids": "|".join(ids[i:i + 50]),
            "languages": "|".join(ALL_WD)}))
        for q, e in r.get("entities", {}).items():
            labels[q] = {lang: v["value"] for lang, v in e.get("labels", {}).items()}
        if i % 500 == 0:
            print("labels", i, "of", len(ids), flush=True)
        time.sleep(1)
    path.write_text(json.dumps(labels, ensure_ascii=False))

# ------------------------------------------------------------------ 3. the Louvre's own French records
path = CACHE / "louvre_fr.json"
if not path.exists():
    out = {}
    for n, w in enumerate(catalog("louvre")):
        m = re.search(r"cl(\d+)$", w.get("objectUrl") or "")
        if not m:
            continue
        try:
            r = http(f"https://collections.louvre.fr/ark:/53355/cl{m[1]}.json")
            out[w["id"]] = {k: r.get(k) for k in ("title", "denominationTitle", "displayDateCreated", "materialsAndTechniques", "collection")}
        except Exception as e:  # noqa: BLE001 - a failed record is skipped
            print("record failed", w["id"], e, flush=True)
        if n % 100 == 0:
            print("record", n, flush=True)
        time.sleep(0.4)
    path.write_text(json.dumps(out, ensure_ascii=False))
print("cache complete:", CACHE)

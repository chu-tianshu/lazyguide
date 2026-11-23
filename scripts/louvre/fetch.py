#!/usr/bin/env python3
"""Downloads the public sources scripts/louvre/build.py needs into a cache directory.

    python3 scripts/louvre/fetch.py <cache-dir>

Each step is skipped when its file already exists, so delete a file to refresh it. It is polite (throttled, sequential,
with a descriptive User-Agent) and takes about 10 minutes the first time, mostly the Louvre records.

  wd_list.json     Wikidata: items with a Louvre ARK id (P9394) and at least 2 sitelinks
  records.json     the Louvre's collection record for each (https://collections.louvre.fr/ark:/53355/cl<ark>.json);
                   only text metadata is kept, the Louvre's images are copyrighted and never used
  wd_details.json  Wikidata: English label, creators, materials, Commons image of the works on display
  commons.json     Wikimedia Commons: licence, author and file page of those images
  osm_geom.json    OpenStreetMap: indoor rooms, corridors and walls around the Louvre (Overpass API)
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
UA = "LazyGuideLouvreImport/1.0 (museum audio guide prototype)"
ROOM_RE = re.compile(r"Salle\s+(\S+?),\s*Aile\s+(?:Aile\s+)?(\w+),\s*Niveau\s+(-?\d+)")


def get(url, data=None, accept=None, retries=6):
    headers = {"User-Agent": UA}
    if accept:
        headers["Accept"] = accept
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, data=data, headers=headers)
            return json.load(urllib.request.urlopen(req, timeout=120))
        except urllib.error.HTTPError as e:
            if e.code not in (429, 502, 503, 504):
                raise
            time.sleep(15 * (attempt + 1))
    raise SystemExit(f"giving up on {url}")


def sparql(query):
    body = urllib.parse.urlencode({"query": query}).encode()
    return get("https://query.wikidata.org/sparql", data=body, accept="application/sparql-results+json")["results"]["bindings"]


def step(name):
    path = CACHE / name
    return path, path.exists()


# 1. Which works.
path, done = step("wd_list.json")
if not done:
    rows = sparql("""SELECT ?ark (MAX(?sl) AS ?sitelinks) WHERE {
      ?item wdt:P9394 ?ark; wikibase:sitelinks ?sl. FILTER(?sl >= 2) } GROUP BY ?ark""")
    path.write_text(json.dumps([r["ark"]["value"] for r in rows]))
arks = json.loads(path.read_text())
print(len(arks), "works with a Louvre ARK id", flush=True)

# 2. The Louvre's own records.
path, done = step("records.json")
if not done:
    records = {}
    for i, ark in enumerate(arks):
        try:
            records[ark] = get(f"https://collections.louvre.fr/ark:/53355/cl{ark}.json")
        except Exception as e:  # noqa: BLE001 - a failed record is kept as an error entry and skipped by build.py
            records[ark] = {"error": str(e)}
        if i % 100 == 0:
            print("record", i, flush=True)
        time.sleep(0.4)
    path.write_text(json.dumps(records))
records = json.loads(path.read_text())
shown = [a for a, r in records.items() if ROOM_RE.match(r.get("room") or "")]
print(len(shown), "are on display in a numbered room", flush=True)

# 3. Wikidata details.
path, done = step("wd_details.json")
if not done:
    details = {}
    for i in range(0, len(shown), 150):
        values = " ".join(f'"{a}"' for a in shown[i : i + 150])
        rows = sparql("""SELECT ?ark ?l ?d (GROUP_CONCAT(DISTINCT ?cl;separator="|") AS ?creators)
          (GROUP_CONCAT(DISTINCT ?ml;separator="|") AS ?mats) (GROUP_CONCAT(DISTINCT ?tl;separator="|") AS ?types)
          (SAMPLE(?img) AS ?image) WHERE {
          VALUES ?ark { %s } ?item wdt:P9394 ?ark.
          OPTIONAL { ?item rdfs:label ?l FILTER(LANG(?l)="en") }
          OPTIONAL { ?item schema:description ?d FILTER(LANG(?d)="en") }
          OPTIONAL { ?item wdt:P170 ?c. ?c rdfs:label ?cl FILTER(LANG(?cl)="en") }
          OPTIONAL { ?item wdt:P186 ?m. ?m rdfs:label ?ml FILTER(LANG(?ml)="en") }
          OPTIONAL { ?item wdt:P31 ?t. ?t rdfs:label ?tl FILTER(LANG(?tl)="en") }
          OPTIONAL { ?item wdt:P18 ?img }
        } GROUP BY ?item ?ark ?l ?d""" % values)
        for r in rows:
            details[r["ark"]["value"]] = {k: v["value"] for k, v in r.items() if k != "ark"}
        time.sleep(2)
    path.write_text(json.dumps(details))
details = json.loads(path.read_text())

# 4. Commons licences.
path, done = step("commons.json")
if not done:
    files = {a: urllib.parse.unquote(d["image"].split("Special:FilePath/")[-1]).replace("_", " ") for a, d in details.items() if d.get("image")}
    names = sorted(set(files.values()))
    info, redirects = {}, {}
    for i in range(0, len(names), 40):
        params = {"action": "query", "format": "json", "prop": "imageinfo", "iiprop": "url|extmetadata", "redirects": "1",
                  "iiextmetadatafilter": "LicenseShortName|Artist", "titles": "|".join("File:" + n for n in names[i : i + 40])}
        q = get("https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(params))["query"]
        for r in q.get("redirects", []) + q.get("normalized", []):
            redirects[r["from"]] = r["to"]
        for pg in q["pages"].values():
            ii = (pg.get("imageinfo") or [None])[0]
            if ii:
                info[pg["title"]] = {"page": ii["descriptionurl"], "meta": {k: v["value"] for k, v in ii["extmetadata"].items()}}
        time.sleep(4)
    out = {}
    for ark, n in files.items():
        t = "File:" + n
        t = redirects.get(redirects.get(t, t), redirects.get(t, t))
        if t in info:
            out[ark] = info[t]
    path.write_text(json.dumps(out))

# 5. OpenStreetMap indoor geometry.
path, done = step("osm_geom.json")
if not done:
    q = '[out:json][timeout:100];(way["indoor"](48.8590,2.3320,48.8640,2.3400);relation["indoor"](48.8590,2.3320,48.8640,2.3400););out tags geom 6000;'
    path.write_text(json.dumps(get("https://overpass-api.de/api/interpreter", data=urllib.parse.urlencode({"data": q}).encode())))
print("cache complete:", CACHE)

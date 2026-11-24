#!/usr/bin/env python3
"""Downloads the Prado works that Wikidata places in a numbered hall ("Prado Hall 012"), plus Commons image licences.

    python3 scripts/prado/fetch.py <cache-dir>

The Prado's own website blocks automated clients and has no floor plan data in OpenStreetMap, so Wikidata (CC0)
is the only open source for which hall a work hangs in. Output: wd_prado.json, commons_prado.json.
"""
import json, sys, time, urllib.error, urllib.parse, urllib.request
from pathlib import Path

CACHE = Path(sys.argv[1]); CACHE.mkdir(parents=True, exist_ok=True)
UA = "LazyGuidePradoImport/1.0 (museum audio guide prototype)"


def get(url, data=None, accept=None):
    h = {"User-Agent": UA}
    if accept: h["Accept"] = accept
    for attempt in range(6):
        try:
            return json.load(urllib.request.urlopen(urllib.request.Request(url, data=data, headers=h), timeout=120))
        except urllib.error.HTTPError as e:
            if e.code not in (429, 502, 503, 504): raise
            time.sleep(15 * (attempt + 1))
    raise SystemExit("giving up on " + url)


QUERY = """SELECT ?item ?itemLabel ?hallLabel ?inv ?img ?when ?h ?w
 (GROUP_CONCAT(DISTINCT ?cl;separator="|") AS ?creators) (GROUP_CONCAT(DISTINCT ?country;separator="|") AS ?countries)
 (GROUP_CONCAT(DISTINCT ?ml;separator="|") AS ?mats) WHERE {
  ?item wdt:P8905 ?pid; wdt:P276 ?hall.
  ?hall rdfs:label ?hallLabel FILTER(LANG(?hallLabel)="en" && REGEX(?hallLabel,"^Prado [Hh]all"))
  ?item rdfs:label ?itemLabel FILTER(LANG(?itemLabel)="en")
  OPTIONAL { ?item wdt:P217 ?inv } OPTIONAL { ?item wdt:P18 ?img } OPTIONAL { ?item wdt:P571 ?when }
  OPTIONAL { ?item p:P2048/psn:P2048/wikibase:quantityAmount ?h } OPTIONAL { ?item p:P2049/psn:P2049/wikibase:quantityAmount ?w }
  OPTIONAL { ?item wdt:P170 ?c. ?c rdfs:label ?cl FILTER(LANG(?cl)="en")
             OPTIONAL { ?c wdt:P27 ?co. ?co rdfs:label ?country FILTER(LANG(?country)="en") } }
  OPTIONAL { ?item wdt:P186 ?m. ?m rdfs:label ?ml FILTER(LANG(?ml)="en") }
} GROUP BY ?item ?itemLabel ?hallLabel ?inv ?img ?when ?h ?w"""

p = CACHE / "wd_prado.json"
if not p.exists():
    rows = get("https://query.wikidata.org/sparql", urllib.parse.urlencode({"query": QUERY}).encode(), "application/sparql-results+json")["results"]["bindings"]
    p.write_text(json.dumps([{k: v["value"] for k, v in r.items()} for r in rows]))
rows = json.loads(p.read_text())
print(len(rows), "rows")

p = CACHE / "commons_prado.json"
if not p.exists():
    files = sorted({urllib.parse.unquote(r["img"].split("Special:FilePath/")[-1]).replace("_", " ") for r in rows if r.get("img")})
    info, redir = {}, {}
    for i in range(0, len(files), 40):
        q = get("https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode({
            "action": "query", "format": "json", "prop": "imageinfo", "iiprop": "url|extmetadata", "redirects": "1",
            "iiextmetadatafilter": "LicenseShortName|Artist", "titles": "|".join("File:" + f for f in files[i:i + 40])}))["query"]
        for r in q.get("redirects", []) + q.get("normalized", []): redir[r["from"]] = r["to"]
        for pg in q["pages"].values():
            ii = (pg.get("imageinfo") or [None])[0]
            if ii: info[pg["title"]] = {"page": ii["descriptionurl"], "meta": {k: v["value"] for k, v in ii["extmetadata"].items()}}
        time.sleep(4)
    out = {}
    for f in files:
        t = "File:" + f; t = redir.get(redir.get(t, t), redir.get(t, t))
        if t in info: out[f] = info[t]
    p.write_text(json.dumps(out))
print("cache complete:", CACHE)

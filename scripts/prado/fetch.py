#!/usr/bin/env python3
"""Downloads Wikidata and Commons data for the works in research/prado/prado-rooms.json.

    python3 scripts/prado/fetch.py <cache-dir> [research/prado/prado-rooms.json]

prado-rooms.json is collected by research/prado/collect-rooms.js, run by hand in a browser (the Prado's site blocks
bots). Each work's Prado UUID is also its Wikidata "Museo del Prado artwork ID" (P8905), which gives a Wikidata item,
inventory number, size and a Commons image. Output: wd_prado.json (uuid -> fields), commons_prado.json.
"""
import json, sys, time, urllib.error, urllib.parse, urllib.request
from pathlib import Path

CACHE = Path(sys.argv[1]); CACHE.mkdir(parents=True, exist_ok=True)
ROOMS = Path(sys.argv[2] if len(sys.argv) > 2 else "research/prado/prado-rooms.json")
UA = "LazyGuidePradoImport/1.0 (museum audio guide prototype)"


def get(url, data=None, accept=None):
    h = {"User-Agent": UA}
    if accept: h["Accept"] = accept
    for attempt in range(6):
        try:
            return json.load(urllib.request.urlopen(urllib.request.Request(url, data=data, headers=h), timeout=180))
        except urllib.error.HTTPError as e:
            if e.code not in (429, 502, 503, 504): raise
            time.sleep(15 * (attempt + 1))
    raise SystemExit("giving up on " + url)


uuids = sorted({w["uuid"] for r in json.loads(ROOMS.read_text())["rooms"].values() for w in r["works"] if w.get("uuid")})
print(len(uuids), "works in rooms")

p = CACHE / "wd_prado.json"
if not p.exists():
    out = {}
    for i in range(0, len(uuids), 150):
        values = " ".join(f'"{u}"' for u in uuids[i:i + 150])
        q = """SELECT ?pid ?item ?img ?inv ?h ?w WHERE { VALUES ?pid { %s } ?item wdt:P8905 ?pid.
          OPTIONAL { ?item wdt:P18 ?img } OPTIONAL { ?item wdt:P217 ?inv }
          OPTIONAL { ?item p:P2048/psn:P2048/wikibase:quantityAmount ?h } OPTIONAL { ?item p:P2049/psn:P2049/wikibase:quantityAmount ?w } }""" % values
        for r in get("https://query.wikidata.org/sparql", urllib.parse.urlencode({"query": q}).encode(), "application/sparql-results+json")["results"]["bindings"]:
            out.setdefault(r["pid"]["value"], {k: v["value"] for k, v in r.items() if k != "pid"})
        time.sleep(2)
    p.write_text(json.dumps(out))
wd = json.loads(p.read_text())
print(len(wd), "matched to Wikidata,", sum(1 for v in wd.values() if v.get("img")), "with a Commons image")

p = CACHE / "commons_prado.json"
if not p.exists():
    files = sorted({urllib.parse.unquote(v["img"].split("Special:FilePath/")[-1]).replace("_", " ") for v in wd.values() if v.get("img")})
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

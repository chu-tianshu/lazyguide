#!/usr/bin/env python3
"""Builds the Prado catalog and room index from the Prado's room listings plus Wikidata/Commons.

    python3 scripts/prado/build.py <cache-dir> [research/prado/prado-rooms.json]

Inputs: prado-rooms.json (collected by research/prado/collect-rooms.js in a browser: room -> works with the Prado's own
English title, author, medium/date, URL), and wd_prado.json / commons_prado.json from fetch.py (matched by the Prado UUID,
which is Wikidata property P8905).
Outputs: supabase/data/prado/en.json (the original 30 works plus every work in a room) and src/data/prado/halls.json
(work -> room), read by src/components/PradoExplorer.tsx. The Prado's own images are never used; images are Commons only.
There is no floor data.
"""
import html, json, re, sys, unicodedata, urllib.parse
from pathlib import Path

CACHE = Path(sys.argv[1]); ROOT = Path(__file__).resolve().parents[2]
ROOMS = Path(sys.argv[2]) if len(sys.argv) > 2 else ROOT / "research/prado/prado-rooms.json"
rooms = json.loads(ROOMS.read_text())["rooms"]
wd = json.loads((CACHE / "wd_prado.json").read_text())
commons = json.loads((CACHE / "commons_prado.json").read_text())
existing = json.loads((ROOT / "supabase/data/prado/en.json").read_text())

ORIGINAL = [w for w in existing["works"] if re.fullmatch(r"prado-\d\d", w["id"])]
PREVIOUS_Q_IDS = {w["id"] for w in existing["works"] if re.match(r"prado-Q\d+$", w["id"])}


def norm(s):
    return set(re.sub(r"[^a-z0-9 ]", " ", unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower()).split()) - {"the", "of", "and", "a", "in", "de", "el", "la"}


def room_name(r): return "Room " + r
def room_sort(r):
    m = re.match(r"(\d+)(.*)", r); return (int(m[1]), m[2])


def tidy_author(a):
    m = re.fullmatch(r"([^,]+),\s*([^,]+)", a.strip())
    return f"{m[2]} {m[1]}" if m else a.strip()


listed = {}  # uuid -> (room, card)
for r, v in rooms.items():
    for w in v["works"]:
        if w.get("uuid"): listed[w["uuid"]] = (r, w)

# Original works -> their listing, by title and artist (a few need a hint: the Prado's English titles differ).
HINT = {"prado-04": "The Feast of Bacchus", "prado-06": "3rd of May", "prado-07": "2nd of May", "prado-08": "Saturn",
        "prado-11": "Family of Carlos IV", "prado-24": "The Andrians", "prado-27": "The Cardinal", "prado-05": "1632"}
orig_uuid = {}
for e in ORIGINAL:
    t = norm(re.sub(r"\s*\(.*\)", "", e["title"])); a = norm(e["artist"].split("(")[0])
    cands = [(u, r, w) for u, (r, w) in listed.items() if a & norm(w["author"]) and (
        (e["id"] in HINT and (HINT[e["id"]].lower() in w["title"].lower() or HINT[e["id"]] in w["detail"])) or
        (e["id"] not in HINT and len(t & norm(w["title"])) >= max(1, len(t) * 0.7)))]
    if e["id"] == "prado-05":
        cands = [c for c in cands if "crucified" in c[2]["title"].lower()] or cands
    if cands: orig_uuid[e["id"]] = cands[0][0]
used_uuids = set(orig_uuid.values())

f = lambda v: f"{v:.1f}".rstrip("0").rstrip(".")
work_room, works = {}, []
for e in ORIGINAL:
    u = orig_uuid.get(e["id"])
    if u:
        r = listed[u][0]
        work_room[e["id"]] = r
        facts = [x for x in e["facts"] if x["label"] != "Location"] + [{"label": "Location", "value": f"{room_name(r)}, Museo del Prado"}]
        e = {**e, "facts": facts, "category": room_name(r)}
    works.append(e)

new = []
for u, (r, c) in listed.items():
    if u in used_uuids: continue
    m = wd.get(u, {})
    q = m.get("item", "").split("/")[-1]
    wid = f"prado-{q}" if f"prado-{q}" in PREVIOUS_Q_IDS else f"prado-{u}"
    detail = c["detail"].strip()
    mm = re.match(r"^(.*?)\.\s+(.+)$", detail)
    medium, date = (mm[1], mm[2]) if mm and re.search(r"\d", mm[2]) else (detail or None, None)
    facts = []
    if date: facts.append({"label": "Date", "value": date})
    if medium: facts.append({"label": "Medium", "value": medium})
    if m.get("h") and m.get("w"):
        facts.append({"label": "Dimensions", "value": f"{f(float(m['h']) * 100)} × {f(float(m['w']) * 100)} cm"})
    facts.append({"label": "Location", "value": f"{room_name(r)}, Museo del Prado"})
    if m.get("inv"): facts.append({"label": "Inventory no.", "value": m["inv"]})
    work = {"id": wid, "title": html.unescape(c["title"]) or "Untitled", "category": room_name(r), "facts": facts,
            "objectUrl": c["url"], "guide": {"text": "Audio guide unavailable.", "unavailable": True}}
    if c["author"]: work["artist"] = tidy_author(c["author"])
    if m.get("img"):
        name = m["img"].split("Special:FilePath/")[-1]
        info = commons.get(urllib.parse.unquote(name).replace("_", " "))
        if info:
            lic = html.unescape(re.sub("<[^>]+>", "", info["meta"].get("LicenseShortName", "")))
            if re.match(r"(Public domain|PD|CC0|CC BY)", lic, re.I):
                image = {"src": f"https://commons.wikimedia.org/wiki/Special:FilePath/{name.replace('http://', 'https://')}?width=500",
                         "sourceUrl": info["page"], "license": lic}
                author = html.unescape(re.sub(r"\s+", " ", re.sub("<[^>]+>", "", info["meta"].get("Artist", "")))).strip()
                if re.match(r"CC BY", lic, re.I) and author and not re.search(r"machine-readable|^Template:", author):
                    image["author"] = author
                work["image"] = image
    work_room[wid] = r
    new.append(work)

new.sort(key=lambda w: (room_sort(work_room[w["id"]]), w["title"]))
works += new
room_keys = sorted(set(work_room.values()), key=room_sort)
unplaced_cats = [w["category"] for w in works if w["id"] not in work_room]
categories = [room_name(r) for r in room_keys] + [c for c in dict.fromkeys(unplaced_cats)]
(ROOT / "supabase/data/prado/en.json").write_text(json.dumps({"museum": existing["museum"], "categories": categories, "works": works}, ensure_ascii=False, indent=1) + "\n")
(ROOT / "src/data/prado").mkdir(parents=True, exist_ok=True)
(ROOT / "src/data/prado/halls.json").write_text(json.dumps({"halls": {r: room_name(r) for r in room_keys}, "workHalls": work_room}, ensure_ascii=False, separators=(",", ":")))
print(f"{len(works)} works; {len(work_room)} in {len(room_keys)} rooms; {sum(1 for w in new if 'image' in w)}/{len(new)} new with image; originals placed: {len(orig_uuid)}/{len(ORIGINAL)}")
print("unplaced originals:", [e['id'] for e in ORIGINAL if e['id'] not in orig_uuid])

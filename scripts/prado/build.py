#!/usr/bin/env python3
"""Builds the Prado catalog and hall index from the Wikidata/Commons downloads of fetch.py.

    python3 scripts/prado/build.py <cache-dir>

Outputs supabase/data/prado/en.json (the original 30 works plus the works Wikidata places in a numbered hall) and
src/data/prado/halls.json (work -> hall, work -> sub-area), read by src/components/PradoExplorer.tsx.
There is no floor or plan data: no open source has it (the Prado site blocks bots, OpenStreetMap has no indoor map).
"""
import html, json, re, sys
from collections import defaultdict
from pathlib import Path

CACHE = Path(sys.argv[1]); ROOT = Path(__file__).resolve().parents[2]
rows = json.loads((CACHE / "wd_prado.json").read_text())
commons = json.loads((CACHE / "commons_prado.json").read_text())
existing = json.loads((ROOT / "supabase/data/prado/en.json").read_text())

ORIGINAL = {w["id"]: w for w in existing["works"] if re.fullmatch(r"prado-\d\d", w["id"])}
# Original works that Wikidata also places in a hall (checked by title and artist).
ORIGINAL_QIDS = {"prado-22": "Q2388965", "prado-25": "Q2378567", "prado-28": "Q75846"}
QID_TO_ORIGINAL = {q: i for i, q in ORIGINAL_QIDS.items()}

AREAS = {
    "Spanish Painting": {"Spain", "Crown of Aragon", "Crown of Castile", "Kingdom of Castile", "Kingdom of Aragon"},
    "Flemish & Dutch Painting": {"Habsburg Netherlands", "Duchy of Brabant", "Netherlands", "Belgium", "County of Flanders",
                                 "Dutch Republic", "Spanish Netherlands", "Southern Netherlands", "Burgundian Netherlands"},
    "Italian Painting": {"Italy", "Republic of Venice", "Duchy of Milan", "Papal States", "Republic of Florence", "Kingdom of Naples", "Duchy of Mantua"},
    "German Painting": {"Germany", "Holy Roman Empire", "Electorate of Saxony", "Free imperial city of Nuremberg"},
    "French Painting": {"France"},
}
AREA_ORDER = list(AREAS) + ["Other & anonymous"]


def area_of(countries: str) -> str:
    cs = {c for c in countries.split("|") if c}
    for name, members in AREAS.items():
        if cs & members:
            return name
    return "Other & anonymous"


def hall_key(label: str) -> str:
    return re.sub(r"^Prado [Hh]all\s*", "", label).strip()  # "056B"


def hall_name(key: str) -> str:
    return "Hall " + key.lstrip("0")


def hall_sort(key: str):
    m = re.match(r"(\d+)(.*)", key)
    return (int(m[1]), m[2]) if m else (999, key)


by_item = defaultdict(list)
for r in rows:
    by_item[r["item"].split("/")[-1]].append(r)

f = lambda v: f"{v:.1f}".rstrip("0").rstrip(".")
new_works, work_hall, work_area = [], {}, {}
for qid, rs in by_item.items():
    r0 = rs[0]
    key = hall_key(r0["hallLabel"])
    wid = QID_TO_ORIGINAL.get(qid, f"prado-{qid}")
    old = ORIGINAL.get(wid)
    area = area_of("|".join(r.get("countries", "") for r in rs))
    work_hall[wid] = key
    work_area[wid] = area
    if old:
        continue
    years = sorted({int(r["when"][:4]) for r in rs if r.get("when")})
    date = None if not years else (str(years[0]) if len(years) == 1 else f"{years[0]}–{years[-1]}")
    mats = set(r0.get("mats", "").split("|")) - {""}
    techniques = {"oil paint": "oil", "tempera": "tempera", "fresco": "fresco"}
    tech = [techniques[m] for m in sorted(mats) if m in techniques]
    sup = [m for m in sorted(mats) if m not in techniques]
    medium = f"{tech[0]} on {', '.join(sup)}" if tech and sup else ", ".join(sorted(mats)) or None
    facts = []
    if date: facts.append({"label": "Date", "value": date})
    if medium: facts.append({"label": "Medium", "value": medium})
    if r0.get("h") and r0.get("w"):
        facts.append({"label": "Dimensions", "value": f"{f(float(r0['h']) * 100)} × {f(float(r0['w']) * 100)} cm"})
    facts.append({"label": "Location", "value": f"{hall_name(key)}, Museo del Prado"})
    if r0.get("inv"): facts.append({"label": "Inventory no.", "value": r0["inv"]})
    work = {"id": wid, "title": r0["itemLabel"], "category": area, "facts": facts,
            "objectUrl": f"https://www.wikidata.org/wiki/{qid}",
            "guide": {"text": "Audio guide unavailable.", "unavailable": True}}
    creators = sorted({c for r in rs for c in r.get("creators", "").split("|") if c})
    if creators: work["artist"] = creators[0]
    if r0.get("img"):
        name = r0["img"].split("Special:FilePath/")[-1]
        c = commons.get(re.sub("_", " ", __import__("urllib.parse").parse.unquote(name)))
        if c:
            lic = html.unescape(re.sub("<[^>]+>", "", c["meta"].get("LicenseShortName", "")))
            if re.match(r"(Public domain|PD|CC0|CC BY)", lic, re.I):
                image = {"src": f"https://commons.wikimedia.org/wiki/Special:FilePath/{name.replace('http://', 'https://')}?width=500",
                         "sourceUrl": c["page"], "license": lic}
                author = html.unescape(re.sub(r"\s+", " ", re.sub("<[^>]+>", "", c["meta"].get("Artist", "")))).strip()
                if re.match(r"CC BY", lic, re.I) and author and not re.search(r"machine-readable|^Template:", author):
                    image["author"] = author
                work["image"] = image
    new_works.append(work)

new_works.sort(key=lambda w: (hall_sort(work_hall[w["id"]]), w["title"]))
# Mark the original works that are in a hall.
works = []
for w in existing["works"]:
    if w["id"] in work_hall and w["id"] in ORIGINAL:
        w = {**w, "facts": [x for x in w["facts"] if x["label"] != "Location"] + [{"label": "Location", "value": f"{hall_name(work_hall[w['id']])}, Museo del Prado"}]}
    if re.fullmatch(r"prado-\d\d", w["id"]):
        works.append(w)
works += new_works

used = [a for a in AREA_ORDER if any(w.get("category") == a for w in works)]
categories = list(existing["categories"]) + [a for a in used if a not in existing["categories"]]
(ROOT / "supabase/data/prado/en.json").write_text(json.dumps({"museum": existing["museum"], "categories": categories, "works": works}, ensure_ascii=False, indent=1) + "\n")
halls = sorted(set(work_hall.values()), key=hall_sort)
(ROOT / "src/data/prado").mkdir(parents=True, exist_ok=True)
(ROOT / "src/data/prado/halls.json").write_text(json.dumps(
    {"halls": {k: hall_name(k) for k in halls}, "workHalls": work_hall, "workAreas": work_area, "areaOrder": AREA_ORDER},
    ensure_ascii=False, separators=(",", ":")))
print(len(works), "works;", len(work_hall), "in halls;", len(halls), "halls;", sum(1 for w in new_works if "image" in w), "new with image")

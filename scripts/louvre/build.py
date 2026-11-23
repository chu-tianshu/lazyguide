#!/usr/bin/env python3
"""Builds the Louvre catalog, room metadata and floor-plan geometry from public sources.

    python3 scripts/louvre/build.py <cache-dir>

<cache-dir> holds the raw downloads written by the fetch_*.py scripts next to this file (see README.md
in this folder). Outputs:

  supabase/data/louvre/en.json   catalog: every on-display work found, with metadata facts
  src/data/louvre/rooms.json     rooms (level, wing, area, outline shape) and work -> room
  src/data/louvre/plan.json      floor-plan outlines per level, from OpenStreetMap indoor data (ODbL)

Sources: Louvre collection records (collections.louvre.fr, text metadata only, never its images),
Wikidata (English labels, creators, materials, Commons image names), Wikimedia Commons (image
licence and author), OpenStreetMap (indoor room outlines, (c) OpenStreetMap contributors, ODbL).
"""
import html
import json
import math
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

CACHE = Path(sys.argv[1])
ROOT = Path(__file__).resolve().parents[2]


def load(name):
    return json.loads((CACHE / name).read_text())


records = load("records.json")
details = load("wd_details.json")
commons = load("commons.json")
osm = load("osm_geom.json")["elements"]
existing = json.loads((ROOT / "supabase/data/louvre/en.json").read_text())

ROOM_RE = re.compile(r"Salle\s+(\S+?),\s*Aile\s+(?:Aile\s+)?(\w+),\s*Niveau\s+(-?\d+)")

# The first 30 works of the catalog, which predate the ARK ids.
EXISTING_ARKS = {
    "louvre-01": "010062370", "louvre-02": "010062373", "louvre-03": "010062374", "louvre-04": "010062372",
    "louvre-05": "010066107", "louvre-06": "010060754", "louvre-07": "010066418", "louvre-08": "010062290",
    "louvre-09": "010064382", "louvre-10": "010064446", "louvre-11": "010064459", "louvre-12": "010064463",
    "louvre-13": "010062304", "louvre-14": "010062329", "louvre-15": "010060453", "louvre-16": "010064918",
    "louvre-17": "010064324", "louvre-18": "010060820", "louvre-19": "010062528", "louvre-20": "010061995",
    "louvre-21": "010059617", "louvre-22": "010065938", "louvre-23": "010062239", "louvre-24": "010065720",
    "louvre-25": "010059215", "louvre-26": "010065566", "louvre-27": "010066528", "louvre-28": "010059199",
    "louvre-29": "010065872", "louvre-30": "010065871",
}
ARK_TO_EXISTING = {a: i for i, a in EXISTING_ARKS.items()}
# Only the original 30 count as existing; the rest of the file is generated output that a re-run replaces.
EXISTING_BY_ID = {w["id"]: w for w in existing["works"] if w["id"] in EXISTING_ARKS}

DEPARTMENTS = {
    "Département des Peintures": "Paintings",
    "Département des Antiquités orientales": "Near Eastern Antiquities",
    "Département des Antiquités grecques, étrusques et romaines": "Greek, Etruscan & Roman Antiquities",
    "Département des Sculptures du Moyen Age, de la Renaissance et des temps modernes": "Sculpture",
    "Département des Antiquités égyptiennes": "Egyptian Antiquities",
    "Département des Objets d'art du Moyen Age, de la Renaissance et des temps modernes": "Decorative Arts",
    "Département des Arts de Byzance et des chrétientés en Orient": "Byzantine & Eastern Christian Art",
    "Département des Arts de l'Islam": "Islamic Art",
}


def area_for(dept: str, room: str) -> str:
    """The sub-area (a named section of the museum) a room belongs to."""
    d = DEPARTMENTS.get(dept, "Other")
    if d != "Paintings":
        return d
    n = int(re.sub(r"\D", "", room) or 0)
    if n in (700, 701, 702):  # Mollien, Denon and Daru rooms: large French Romantic and Neoclassical canvases
        return "French Painting 1800–1850"
    if 700 <= n < 800:
        return "Italian & Spanish Painting"
    if n == 902:
        return "Northern European Painting"
    if 900 <= n <= 907:
        return "French Painting 1650–1800"
    if 800 <= n <= 815 or 836 <= n <= 863:
        return "Northern European Painting"
    if 816 <= n <= 835 or 908 <= n <= 915:
        return "French Painting to 1650"
    if 916 <= n <= 935:
        return "French Painting 1650–1800"
    if 936 <= n <= 952:
        return "French Painting 1800–1850"
    return "Paintings"


AREA_ORDER = [
    "Italian & Spanish Painting", "Northern European Painting", "French Painting to 1650",
    "French Painting 1650–1800", "French Painting 1800–1850", "Paintings", "Sculpture", "Decorative Arts",
    "Greek, Etruscan & Roman Antiquities", "Egyptian Antiquities", "Near Eastern Antiquities", "Islamic Art",
    "Byzantine & Eastern Christian Art",
]

# ---------------------------------------------------------------- room names, in English
ROOM_EN = {
    "102": "Cour Marly", "104": "Girardon Crypt", "105": "Cour Puget", "160": "Donatello Gallery",
    "162": "Study Gallery 2", "169": "Late Gothic", "170": "Pre-Classical Greece", "186": "Islamic Art, 1250–1800",
    "201": "Cluny: Romanesque Sculpture", "203": "Chartres: Gothic Sculpture", "210": "Tomb of Philippe Pot",
    "214": "Mannerist Sculpture", "218": "Anguier and Sarazin", "219": "Petite Galerie of the Académie",
    "221": "Pajou and Bouchardon", "222": "Falconet and Houdon", "225": "Chaudet", "226": "Barye and Romantic Sculpture",
    "227": "Code of Hammurabi Room", "228": "Mesopotamia", "230": "Mesopotamia and Northern Syria",
    "231": "Iran: Susa in the 3rd Millennium BC", "234": "Mari", "236": "Archaic Mesopotamia",
    "301": "Levant: Coastal Syria", "302": "Levant: Inland Syria", "303": "Levant: Palestine and Transjordan",
    "304": "Iran: Middle Elamite Susiana", "307": "Iran: Palace of Darius at Susa", "310": "Mesopotamia",
    "311": "Byblos and the Phoenician Kingdoms", "312": "Levant: Phoenician Kingdoms", "314": "Arabia Felix",
    "315": "Arabia: Caravan Cities", "317": "Gods and Magic", "324": "The Temple", "325": "The Chapels",
    "330": "Adornment", "331": "House and Furniture", "337": "News Room", "338": "Crypt of the Sphinx",
    "339": "Greek Art: Ptolemaic World", "340": "Greek Art: Asia Minor", "341": "Greek Art: Northern Greece",
    "343": "Greek Art: Attic Votive and Funerary Monuments", "344": "Classical and Hellenistic Greek Art",
    "345": "Venus de Milo Room", "348": "Gods and Heroes: Apollo", "403": "Michelangelo Gallery",
    "405": "Manège Room", "407": "Olympia", "501": "Charlemagne", "502": "Suger", "503": "Jeanne d'Évreux",
    "504": "Sceptre of Charles V", "505": "Corridors of Valence and Faenza", "507": "Gallery of the Hunts of Maximilian",
    "515": "Francis I", "555": "Biennais", "562": "Marie d'Orléans", "614": "Louis XV Gallery", "616": "Piranesi",
    "617": "Louis XIV to Louis XVI", "627": "Marie-Antoinette Gallery", "633": "Naqada Period", "635": "Old Kingdom",
    "636": "Middle Kingdom", "637": "New Kingdom: to Amenhotep III", "638": "New Kingdom: Akhenaten and Nefertiti",
    "640": "New Kingdom: Tutankhamun and Successors", "641": "New Kingdom: Age of Ramesses",
    "643": "Year 1000 BC to the First Persian Rule", "644": "Last Pharaohs to Cleopatra",
    "660": "Seven Chimneys Room", "663": "Salle des Séances", "700": "Mollien Room", "701": "Denon Room",
    "702": "Daru Room", "703": "Winged Victory Landing", "705": "Apollo Gallery", "706": "Percier and Fontaine",
    "707": "Duchâtel Room", "708": "Salon Carré", "709": "Salle des Sept Mètres", "710": "Grande Galerie",
    "711": "Mona Lisa Room (Salle des États)", "712": "Grande Galerie", "713": "Britain and the United States",
    "714": "Beistegui Collection", "716": "Grande Galerie", "717": "Salvator Rosa", "718": "Murillo", "719": "Goya",
    "800": "Paintings", "801": "Medici Gallery (Rubens)", "802": "Large Flemish Paintings, Early 17th c.",
    "806": "Cabinet Paintings", "807": "Flemish Painting c. 1600", "809": "Germany", "810": "Lucas Cranach the Elder",
    "811": "Southern Netherlands: Antwerp", "814": "Humanism and Reformation", "815": "Northern Netherlands",
    "818": "Painting for Merchants", "820": "French Painting, 1440–1500", "822": "Portraits",
    "823": "First School of Fontainebleau", "824": "Second School of Fontainebleau", "825": "Poussin: Masterpieces",
    "826": "Poussin: Between Rome and Paris", "827": "Claude Lorrain", "828": "Painters of Louis XIII",
    "829": "French Painting under Louis XIII", "830": "Valentin de Boulogne", "832": "Provence c. 1450–1500",
    "833": "Artistic Revival in Provence", "834": "Patronage of the Dukes of Berry and Burgundy",
    "835": "14th-Century Painting", "836": "Dutch Landscape", "837": "Vermeer and Ruisdael", "838": "Frans Post",
    "839": "Genre Painting", "841": "Utrecht and Dordrecht", "843": "Portraits", "844": "Around Rembrandt",
    "845": "Holland and Italy", "846": "Frans Hals and Haarlem", "848": "Jacob Jordaens", "850": "Anthony van Dyck",
    "852": "The Picturesque in Dutch Painting", "853": "Anthony van Dyck", "855": "Peter Paul Rubens",
    "857": "David Teniers the Younger", "860": "Flanders", "862": "Scandinavia", "863": "Germany",
    "902": "Croÿ Donation", "903": "Lyon Donation", "908": "Altarpieces", "909": "Devotional Paintings",
    "910": "Life of Saint Bruno (Le Sueur)", "911": "Atticism", "912": "Georges de La Tour and the Le Nain Brothers",
    "913": "Philippe de Champaigne", "914": "Charles Le Brun", "915": "Jean Jouvenet",
    "916": "Painters of Louis XIV", "917": "Watteau", "918": "La Caze Collection", "919": "Painters of Louis XV",
    "920": "Chardin", "921": "Genre Painting", "927": "Boucher", "928": "Painters of Diderot", "929": "Fragonard",
    "930": "Hubert Robert", "932": "Greuze", "933": "Vigée Le Brun", "934": "History Painting, Late 18th c.",
    "935": "David and His Students", "937": "Anecdotal Genre Painting, 1800–1820", "938": "Boilly and Parisian Life",
    "940": "Ingres", "941": "Géricault", "942": "Delacroix", "943": "Chassériau and Portraiture c. 1840",
    "944": "Théodore Rousseau", "946": "Romantic Idyll and Drama", "949": "Moreau-Nélaton: Corot",
    "950": "Moreau-Nélaton: The Romantics", "951": "Thomy Thiéry Collection", "952": "Corot",
}


def en_room(num: str, fr: str) -> str:
    return ROOM_EN.get(num) or fr


# ---------------------------------------------------------------- shapes from OpenStreetMap
LAT0, LON0 = 48.8610, 2.3360


def floor_of(level) -> int | None:
    try:
        return math.floor(float(str(level).split(";")[0]) + 0.25)
    except ValueError:
        return None


def project(p):
    x = (p["lon"] - LON0) * math.cos(math.radians(LAT0)) * 111320
    y = -(p["lat"] - LAT0) * 110540
    return round(x, 1), round(y, 1)


def path_of(geom, close):
    pts = []
    for p in geom:
        q = project(p)
        if not pts or pts[-1] != q:
            pts.append(q)
    if len(pts) < 2:
        return None
    s = "M" + "L".join(f"{x:g},{y:g}" for x, y in pts)
    return s + "Z" if close else s


def centroid(geom):
    pts = [project(p) for p in geom]
    return sum(x for x, _ in pts) / len(pts), sum(y for _, y in pts) / len(pts)


# Louvre room -> OSM way id, where the room has no matching `ref` tag in OpenStreetMap (matched by name).
NAME_MATCH = {
    "104": 446688181, "160": 373769693, "162": 373770961, "169": 378904619, "170": 374829202, "186": 376694360,
    "201": 447278668, "203": 447279303, "210": 447281132, "218": 447674447, "219": 449044185, "221": 449044196,
    "222": 449044169, "225": 449043953, "226": 449043898, "227": 449577464, "228": 449579147, "230": 449948233,
    "324": 338795997, "325": 338795998, "317": 338651009, "330": 454347280, "331": 454347273, "338": 454340507,
    "344": 484680363, "345": 453817508, "403": 373775126, "405": 374823876, "501": 445981038, "502": 446637001,
    "503": 446637009, "504": 446637010, "507": 488530232, "515": 488651438, "555": 451733465, "562": 452685614,
    "616": 479858092, "627": 481187492, "633": 484356703, "635": 484356705, "636": 484360496, "643": 458962702,
    "644": 458962703, "660": 442806812, "700": 367784145, "701": 367780082, "702": 366134895, "703": 451971079,
    "705": 367790015, "706": 367790013, "707": 366143569, "708": 366143567, "709": 366134896, "710": 366143566,
    "711": 367700350, "712": 366143566, "716": 366143566, "717": 383406097, "932": 459007004,
}

by_ref = defaultdict(list)
for e in osm:
    t = e["tags"]
    if t.get("ref") and t.get("indoor") in ("room", "area"):
        by_ref[t["ref"]].append(e)
by_id = {e["id"]: e for e in osm}

# ---------------------------------------------------------------- works
rooms = {}  # number -> info
works = []
work_room = {}
work_area = {}
for ark, rec in records.items():
    m = ROOM_RE.match(rec.get("room") or "")
    if not m or ark not in details:
        continue
    num, wing, level = m[1], m[2], int(m[3])
    dept = rec["collection"]
    area = area_for(dept, num)
    wd = details[ark]
    cur = re.search(r"Salle " + re.escape(num) + r"\s*-\s*([^,\[]*)", rec.get("currentLocation", ""))
    r = rooms.setdefault(num, {"level": level, "wing": wing, "fr": (cur.group(1).strip() if cur else ""), "areas": Counter()})
    r["areas"][area] += 1

    wid = ARK_TO_EXISTING.get(ark, f"louvre-{ark}")
    old = EXISTING_BY_ID.get(wid)

    title = (old or {}).get("title") or wd.get("l") or re.split(r"[.,;]", rec["title"])[0]
    # Artist
    artist = (old or {}).get("artist")
    if not artist:
        name = (wd.get("creators") or "").split("|")[0]
        life = ""
        for c in rec.get("creator") or []:
            if c.get("dates") and c.get("label"):
                years = {d["type"]: re.search(r"-?\d{3,4}", d["date"]) for d in c["dates"] if d.get("date")}
                b, d = years.get("date de naissance"), years.get("date de mort")
                if b and d:
                    life = f" ({b.group()}–{d.group()})"
                if not name:
                    name = re.sub(r"\s*\(.*", "", c["label"])
                break
        artist = (name + life) if name else None

    facts = []
    dc = (rec.get("dateCreated") or [{}])[0]
    s, e_ = dc.get("startYear"), dc.get("endYear")
    date = None
    if isinstance(s, int):
        if isinstance(e_, int) and e_ != s:
            date = f"{abs(s)}–{abs(e_)} BCE" if e_ <= 0 else (f"{abs(s)} BCE–{e_} CE" if s < 0 else f"{s}–{e_}")
        else:
            date = f"{abs(s)} BCE" if s < 0 else str(s)
    old_facts = {f["label"]: f["value"] for f in (old or {}).get("facts", [])}
    date = old_facts.get("Date") or date
    if date:
        facts.append({"label": "Date", "value": date})

    mat_fr = (rec.get("materialsAndTechniques") or "").strip()
    medium = old_facts.get("Medium")
    if not medium:
        mm = re.match(r"(huile|tempera|détrempe)\s+sur\s+([^(\r\n]+?)(?:\s*\(([^)]*)\))?\s*$", mat_fr.split("\r\n")[0], re.I)
        if mm:
            tech = {"huile": "oil", "tempera": "tempera", "détrempe": "distemper"}[mm[1].lower()]
            sup = {"toile": "canvas", "bois": "panel", "métal": "metal", "cuivre": "copper", "papier": "paper"}.get(mm[2].strip().lower())
            wood = {"peuplier": "poplar", "chêne": "oak", "noyer": "walnut", "hêtre": "beech", "cuivre": "copper"}.get((mm[3] or "").lower())
            if sup:
                medium = f"{tech} on {sup}" + (f" ({wood})" if wood and sup == "panel" else "")
        if not medium and wd.get("mats"):
            mats = set(wd["mats"].split("|"))
            techniques = {"oil paint": "oil", "tempera": "tempera", "fresco": "fresco", "acrylic paint": "acrylic"}
            tech = [techniques[m] for m in sorted(mats) if m in techniques]
            sup = [m for m in sorted(mats) if m not in techniques]
            medium = f"{tech[0]} on {', '.join(sup)}" if tech and sup else ", ".join(sorted(mats))
    if medium:
        facts.append({"label": "Medium", "value": medium})

    dims = {d["type"]: d for d in rec.get("dimension") or []}
    def cm(d):
        try:
            v = float(d["value"].replace(",", "."))
        except ValueError:
            return None
        return v * 100 if d.get("unit") == "m" else v
    h, w_ = cm(dims["Hauteur"]) if "Hauteur" in dims else None, cm(dims["Largeur"]) if "Largeur" in dims else None
    f = lambda v: f"{v:.1f}".rstrip("0").rstrip(".")
    if h and w_:
        facts.append({"label": "Dimensions", "value": f"{f(h)} × {f(w_)} cm"})
    elif h:
        facts.append({"label": "Height", "value": f"{f(h)} cm"})

    facts.append({"label": "Department", "value": DEPARTMENTS.get(dept, dept.replace("Département des ", ""))})
    facts.append({"label": "Location", "value": f"Room {num}, {wing} Wing, Level {level}"})
    acc = next((n["value"] for n in rec.get("objectNumber") or [] if n.get("type", "").startswith("Num")), None)
    if acc:
        facts.append({"label": "Inventory no.", "value": acc})

    work = {"id": wid, "title": title, "category": area, "facts": facts,
            "objectUrl": f"https://collections.louvre.fr/en/ark:/53355/cl{ark}",
            "guide": {"text": "Audio guide unavailable.", "unavailable": True}}
    if artist:
        work["artist"] = artist
    image = (old or {}).get("image")
    if image and not image["src"].startswith("/images/"):
        image = None  # only the bundled files count; anything else is regenerated below
    if not image and ark in commons:
        c = commons[ark]
        meta = c["meta"]
        lic = html.unescape(re.sub("<[^>]+>", "", meta.get("LicenseShortName", "")))
        if re.match(r"(Public domain|PD|CC0|CC BY)", lic, re.I):
            author = html.unescape(re.sub(r"\s+", " ", re.sub("<[^>]+>", "", meta.get("Artist", "")))).strip()
            # Special:FilePath redirects to a right-sized thumbnail, so no original is ever downloaded.
            file_name = wd["image"].split("Special:FilePath/")[-1].replace("http://", "https://")
            image = {"src": f"https://commons.wikimedia.org/wiki/Special:FilePath/{file_name}?width=500", "sourceUrl": c["page"], "license": lic}
            if re.match(r"CC BY", lic, re.I) and author:
                image["author"] = author
    if image:
        work["image"] = image
    works.append((num, wid, work))
    work_room[wid] = num
    work_area[wid] = area

# Original works that are off display right now stay in the catalog (visit history may point at them), with no room.
OFF_DISPLAY = [{
    "id": "louvre-04", "title": "La Belle Ferronnière", "category": "Paintings", "artist": "Leonardo da Vinci (Italian, 1452–1519)",
    "facts": [{"label": "Date", "value": "c. 1490–97"}, {"label": "Medium", "value": "oil on walnut panel"},
              {"label": "Location", "value": "Not currently on display"}],
    "objectUrl": "https://collections.louvre.fr/en/ark:/53355/cl010062372",
    "guide": {"text": "Audio guide unavailable.", "unavailable": True},
    "image": {"src": "/images/louvre/louvre-04.jpg", "sourceUrl": "https://commons.wikimedia.org/wiki/File:La_Belle_Ferroni%C3%A8re_-_Google_Arts.jpg", "license": "Public domain"},
}]
for w in OFF_DISPLAY:
    if w["id"] not in work_room:
        works.append((None, w["id"], w))

# Order: by level (top floor first is a UI concern), then room, then title. Existing works keep their first positions.
works.sort(key=lambda t: (0 if t[1] in EXISTING_BY_ID else 1, t[1] if t[1] in EXISTING_BY_ID else "", int(re.sub(r"\D", "", t[0] or "") or 0), t[2]["title"]))

# ---------------------------------------------------------------- shape matching
room_shape = {}
for num, r in rooms.items():
    cand = None
    if num in NAME_MATCH:
        cand = by_id.get(NAME_MATCH[num])
    else:
        for e in by_ref.get(num, []):
            if floor_of(e["tags"].get("level")) == r["level"]:
                cand = e
                break
    if cand:
        room_shape[num] = f"w{cand['id']}"

levels = {}
all_x, all_y = [], []
shape_wing = defaultdict(Counter)
for num, sid in room_shape.items():
    shape_wing[sid][rooms[num]["wing"]] += 1
for e in osm:
    t = e["tags"]
    kind = t.get("indoor")
    lvl = floor_of(t.get("level"))
    if lvl is None or kind not in ("room", "area", "corridor", "wall") or "geometry" not in e:
        continue
    g = e["geometry"]
    closed = len(g) > 3 and g[0] == g[-1]
    d = path_of(g, closed and kind != "wall")
    if not d:
        continue
    L = levels.setdefault(str(lvl), {"shapes": [], "corridors": [], "walls": []})
    if kind == "corridor":
        L["corridors"].append(d)
    elif kind == "wall":
        L["walls"].append(d)
    else:
        sid = f"w{e['id']}"
        item = {"id": sid, "d": d}
        if t.get("name"):
            item["n"] = t["name"]
        L["shapes"].append(item)
    for p in g:
        x, y = project(p)
        all_x.append(x)
        all_y.append(y)

# Wing label positions: the mean centre of each wing's matched shapes.
wing_pts = defaultdict(list)
for num, sid in room_shape.items():
    e = by_id[int(sid[1:])]
    wing_pts[rooms[num]["wing"]].append(centroid(e["geometry"]))
wing_labels = {w: [round(sum(p[0] for p in pts) / len(pts)), round(sum(p[1] for p in pts) / len(pts))] for w, pts in wing_pts.items()}

plan = {
    "bounds": [math.floor(min(all_x)), math.floor(min(all_y)), math.ceil(max(all_x)), math.ceil(max(all_y))],
    "levels": levels,
    "wingLabels": wing_labels,
}
(ROOT / "src/data/louvre").mkdir(parents=True, exist_ok=True)
(ROOT / "src/data/louvre/plan.json").write_text(json.dumps(plan, ensure_ascii=False, separators=(",", ":")))

room_out = {}
for num, r in sorted(rooms.items()):
    room_out[num] = {
        "level": r["level"], "wing": r["wing"], "name": en_room(num, r["fr"]),
        "area": r["areas"].most_common(1)[0][0],
    }
    if num in room_shape:
        room_out[num]["shape"] = room_shape[num]
(ROOT / "src/data/louvre/rooms.json").write_text(
    json.dumps({"rooms": room_out, "workRooms": work_room, "workAreas": work_area, "areaOrder": AREA_ORDER}, ensure_ascii=False, separators=(",", ":"))
)

# ---------------------------------------------------------------- catalog
used = {w[2]["category"] for w in works}
catalog = {
    "museum": existing["museum"],
    "categories": [a for a in AREA_ORDER if a in used],
    "works": [w[2] for w in works],
}
(ROOT / "supabase/data/louvre/en.json").write_text(json.dumps(catalog, ensure_ascii=False, indent=1) + "\n")

print(f"{len(works)} works, {len(rooms)} rooms, {len(room_shape)} rooms outlined")
print("images:", sum(1 for w in works if "image" in w[2]))
print("levels:", {k: (len(v['shapes']), len(v['corridors']), len(v['walls'])) for k, v in levels.items()})
print("wing labels:", wing_labels, "bounds:", plan["bounds"])
print("unmatched rooms:", sorted(set(rooms) - set(room_shape)))

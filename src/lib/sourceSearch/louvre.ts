/**
 * The Louvre's own collection record for an object (https://collections.louvre.fr).
 * The site has no search API (its search page is behind a bot check), but each object has a public
 * JSON record at its ARK address. Wikidata supplies the ARK id (property P9394), so the search finds the
 * work and this record adds the official page link and where in the museum it is hung.
 * Only the record is read, never images (the site's robots.txt asks AI crawlers to leave those).
 */
import type { LanguageCode } from "@/lib/i18n";
import { getJson } from "./util";

export interface LouvreRecord {
  /** The official page for the work. */
  url: string;
  /** Where it is on display, in the visitor's language, or that it is not. */
  location?: string;
}

const BASE = "https://collections.louvre.fr";

interface RawRecord {
  currentLocation?: string;
  room?: string;
}

const WINGS: Record<string, Partial<Record<LanguageCode, string>>> = {
  Denon: { en: "Denon Wing", zh: "德农馆", fr: "Aile Denon", es: "Ala Denon" },
  Sully: { en: "Sully Wing", zh: "苏利馆", fr: "Aile Sully", es: "Ala Sully" },
  Richelieu: { en: "Richelieu Wing", zh: "黎塞留馆", fr: "Aile Richelieu", es: "Ala Richelieu" },
};

/** "Salle 711, Aile Aile Denon, Niveau 1" -> "Room 711, Denon Wing, Level 1". */
function formatRoom(room: string, language: LanguageCode): string {
  const m = room.match(/^Salle\s+(\S+?),\s*Aile\s+(?:Aile\s+)?(\w+),\s*Niveau\s+(-?\d+)/i);
  if (!m) return room;
  const wing = WINGS[m[2]]?.[language] ?? m[2];
  if (language === "zh") return `${m[1]}号展厅，${wing}，${m[3]}层`;
  if (language === "fr") return `Salle ${m[1]}, ${wing}, Niveau ${m[3]}`;
  if (language === "es") return `Sala ${m[1]}, ${wing}, Planta ${m[3]}`;
  return `Room ${m[1]}, ${wing}, Level ${m[3]}`;
}

/** `arkId` is Wikidata's P9394 value, e.g. "010062370". */
export async function louvreRecord(arkId: string, language: LanguageCode): Promise<LouvreRecord> {
  const ark = `ark:/53355/cl${arkId}`;
  const record: LouvreRecord = { url: `${BASE}/en/${ark}` };
  try {
    const raw = await getJson<RawRecord>(`${BASE}/${ark}.json`);
    if (raw.room?.trim()) {
      record.location = formatRoom(raw.room.trim(), language);
    } else if (/non expos/i.test(raw.currentLocation ?? "")) {
      record.location = language === "zh" ? "未展出" : "Not on display";
    }
  } catch {
    // The link is still right without the extras.
  }
  return record;
}

import rawCatalog from "./high_museum_20_audio_guides.json";

export interface Guide {
  /** Standalone concise guide (~1 minute). */
  short: string;
  /** Additional layer of looking/context (~1 minute). */
  expansion: string;
  /** Standalone detailed guide (~2–3 minutes). */
  long: string;
}

export interface Painting {
  id: string; // stable slug derived from the museum accession number
  title: string;
  artist: string;
  date?: string;
  medium?: string;
  accessionNumber?: string;
  museumObjectUrl?: string; // official High Museum object page
  guide: Guide;
}

interface RawWork {
  metadata: {
    title: string;
    artist: string;
    date?: string;
    medium?: string;
    accession_number?: string;
    official_record?: string;
  };
  short: string;
  expansion: string;
  long: string;
}

function slugFromAccession(accession: string): string {
  return accession
    .split(" ")[0]
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const works: RawWork[] = rawCatalog.works;

export const paintings: Painting[] = works.map((w) => ({
  id: slugFromAccession(w.metadata.accession_number ?? w.metadata.title),
  title: w.metadata.title,
  artist: w.metadata.artist,
  date: w.metadata.date,
  medium: w.metadata.medium,
  accessionNumber: w.metadata.accession_number,
  museumObjectUrl: w.metadata.official_record,
  guide: { short: w.short, expansion: w.expansion, long: w.long },
}));

export function getPaintingById(id: string): Painting | undefined {
  return paintings.find((p) => p.id === id);
}

export function searchPaintings(list: Painting[], query: string): Painting[] {
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter(
    (p) => p.title.toLowerCase().includes(q) || p.artist.toLowerCase().includes(q),
  );
}

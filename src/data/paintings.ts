export interface Painting {
  id: string; // stable slug or museum accession identifier
  title: string;
  artist: string;
  date?: string;
  medium?: string;
  dimensions?: string;
  department?: string;
  description?: string; // concise, factual, editorially reviewed
  museumObjectUrl?: string; // official High Museum object page, if available
  sources?: Array<{ label: string; url: string; note?: string }>;
  /** True for placeholder records used only to exercise the UI. */
  isFixture?: boolean;
}

/**
 * TEST FIXTURES ONLY — these are NOT real High Museum collection objects.
 * Replace with the curated 30-painting catalog once it is supplied.
 */
export const paintings: Painting[] = [
  {
    id: "fixture-1",
    title: "Placeholder Landscape",
    artist: "Test Artist A",
    date: "n.d.",
    medium: "Oil on canvas",
    description: "Test fixture used to exercise the interface. Not a real artwork.",
    isFixture: true,
  },
  {
    id: "fixture-2",
    title: "Sample Portrait Study",
    artist: "Test Artist B",
    medium: "Tempera on panel",
    description: "Test fixture used to exercise the interface. Not a real artwork.",
    isFixture: true,
  },
  {
    id: "fixture-3",
    title: "Example Still Life",
    artist: "Test Artist A",
    description: "Test fixture used to exercise the interface. Not a real artwork.",
    isFixture: true,
  },
];

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

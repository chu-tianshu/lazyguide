/** Art Institute of Chicago public API: https://api.artic.edu/docs/ */
import type { Adapter, Found } from "./types";
import { getJson, stripHtml, clipText } from "./util";

interface AicWork {
  id: number;
  title: string;
  artist_display?: string | null;
  date_display?: string | null;
  medium_display?: string | null;
  dimensions?: string | null;
  place_of_origin?: string | null;
  classification_title?: string | null;
  department_title?: string | null;
  main_reference_number?: string | null;
  is_public_domain?: boolean;
  image_id?: string | null;
  description?: string | null;
  short_description?: string | null;
}

const FIELDS = [
  "id", "title", "artist_display", "date_display", "medium_display", "dimensions", "place_of_origin",
  "classification_title", "department_title", "main_reference_number", "is_public_domain", "image_id", "description",
  "short_description",
].join(",");

export const searchAic: Adapter = async ({ query, source }) => {
  const url = `${source.url}/api/v1/artworks/search?q=${encodeURIComponent(query)}&limit=20&fields=${FIELDS}`;
  // The API asks clients to identify themselves.
  const { data } = await getJson<{ data: AicWork[] }>(url, {
    "AIC-User-Agent": "LazyGuide (museum audio guide prototype)",
  });

  return data.map((w): Found => {
    const text = stripHtml(w.description || w.short_description || "");
    const facts: Found["facts"] = [];
    if (w.date_display) facts.push({ key: "date", value: w.date_display });
    if (w.medium_display) facts.push({ key: "medium", value: w.medium_display });
    if (w.dimensions) facts.push({ key: "dimensions", value: w.dimensions.split("\n")[0] });
    if (w.place_of_origin) facts.push({ key: "culture", value: w.place_of_origin });
    if (w.classification_title) facts.push({ key: "type", value: w.classification_title });
    if (w.main_reference_number) facts.push({ key: "accession", value: w.main_reference_number });

    const page = `https://www.artic.edu/artworks/${w.id}`;
    return {
      sourceId: String(w.id),
      title: w.title,
      category: w.department_title || undefined,
      artist: w.artist_display?.replace(/\s*\n\s*/g, " ") || undefined,
      facts,
      objectUrl: page,
      image:
        w.is_public_domain && w.image_id
          ? {
              src: `https://www.artic.edu/iiif/2/${w.image_id}/full/843,/0/default.jpg`,
              sourceUrl: page,
              license: "CC0",
              sourceLabel: "Art Institute of Chicago",
            }
          : undefined,
      text: text ? clipText(text) : undefined,
      textCredit: text ? "Text: Art Institute of Chicago (CC BY 4.0)." : undefined,
    };
  });
};

/** Cleveland Museum of Art Open Access API: https://openaccess-api.clevelandart.org (CC0). */
import type { Adapter, Found } from "./types";
import { getJson, stripHtml, clipText } from "./util";

interface ClevelandWork {
  id: number;
  accession_number: string;
  title: string;
  creation_date?: string;
  technique?: string;
  type?: string;
  department?: string;
  culture?: string[];
  measurements?: string;
  description?: string | null;
  did_you_know?: string | null;
  fun_fact?: string | null;
  url?: string;
  share_license_status?: string;
  creators?: { description: string; role?: string }[];
  images?: { web?: { url: string } | null } | null;
}

export const searchCleveland: Adapter = async ({ query, source }) => {
  const url = `${source.url}/api/artworks/?title=${encodeURIComponent(query)}&limit=20`;
  const { data } = await getJson<{ data: ClevelandWork[] }>(url);

  return data.map((w): Found => {
    const paragraphs = [w.description, w.fun_fact, w.did_you_know]
      .map((p) => (p ? stripHtml(p) : ""))
      .filter(Boolean);
    const facts: Found["facts"] = [];
    if (w.creation_date) facts.push({ key: "date", value: w.creation_date });
    if (w.technique) facts.push({ key: "medium", value: w.technique });
    if (w.measurements) facts.push({ key: "dimensions", value: w.measurements });
    if (w.culture?.length) facts.push({ key: "culture", value: w.culture.join(", ") });
    if (w.type) facts.push({ key: "type", value: w.type });
    facts.push({ key: "accession", value: w.accession_number });

    const image = w.images?.web?.url;
    return {
      sourceId: String(w.id),
      title: w.title,
      category: w.department || undefined,
      artist: w.creators?.[0]?.description,
      facts,
      objectUrl: w.url,
      // Only CC0 works have freely reusable images.
      image:
        image && w.share_license_status === "CC0"
          ? { src: image, sourceUrl: w.url ?? source.url, license: "CC0", sourceLabel: "Cleveland Museum of Art" }
          : undefined,
      text: paragraphs.length ? clipText(paragraphs.join("\n\n")) : undefined,
      textCredit: paragraphs.length ? "Text: Cleveland Museum of Art Open Access (CC0)." : undefined,
    };
  });
};

/**
 * Public URL path for each museum (lazyguide.io/<slug>), taken from the museum's official name.
 * Keys are `museums.id` in the database. Slugs are lowercase; once published, don't change them.
 */
export const museumSlugs: Record<string, string> = {
  louvre: "louvre",
  orsay: "musee-dorsay",
  prado: "museo-del-prado",
  "national-gallery-london": "national-gallery",
  "high-atlanta": "high-museum-of-art",
  cleveland: "cleveland-museum-of-art",
  seattle: "seattle-art-museum",
  "nga-dc": "national-gallery-of-art",
  moma: "moma",
  aic: "art-institute-of-chicago",
  "king-center": "king-center",
  henan: "henan-museum",
  deshou: "southern-song-deshou-palace-museum",
};

export const slugForMuseum = (id: string): string | undefined => museumSlugs[id];

export const museumIdForSlug = (slug: string): string | undefined =>
  Object.keys(museumSlugs).find((id) => museumSlugs[id] === slug.toLowerCase());

export interface MuseumPlace {
  lat: number;
  lng: number;
  city: string;
  country: string;
  continent: string;
}

/** A museum, as stored in the `museums` table (supabase/catalog.sql) and shown on the world map. */
export interface Museum {
  id: string;
  /** Name and subtitle shown on the world map, before a language is chosen. */
  name: string;
  subtitle: string;
  place: MuseumPlace;
  /**
   * Map icon: the inner markup of a 24x24 SVG, drawn with strokes in currentColor.
   * Every museum must have its own distinct glyph.
   */
  icon: string;
}

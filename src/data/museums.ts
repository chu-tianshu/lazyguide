export interface MuseumPlace {
  lat: number;
  lng: number;
  city: string;
  country: string;
  continent: string;
}

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

export const museums: Museum[] = [
  {
    id: "high-atlanta",
    name: "High Museum of Art",
    subtitle: "Atlanta, Georgia",
    place: {
      lat: 33.7895,
      lng: -84.3863,
      city: "Atlanta",
      country: "United States",
      continent: "North America",
    },
    // White block with the curved glass atrium and the ramp line of the Meier building.
    icon: '<rect x="3" y="8" width="10" height="12"/><path d="M13 20a8 8 0 0 0 8-8h-8"/><path d="M3 14h10M3 20h18"/>',
  },
  {
    id: "henan",
    name: "河南博物院",
    subtitle: "Henan Museum · Zhengzhou, China",
    place: {
      lat: 34.7893,
      lng: 113.666,
      city: "Zhengzhou",
      country: "China",
      continent: "Asia",
    },
    // Stepped pyramid with a spire, after the museum's square-cone main hall.
    icon: '<path d="M3 20h18M5 20v-4h14v4M8 16v-4h8v4M10.5 12V8h3v4M12 8V4"/>',
  },
];

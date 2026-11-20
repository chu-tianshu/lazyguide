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
  {
    id: "cleveland",
    name: "Cleveland Museum of Art",
    subtitle: "Cleveland, Ohio",
    place: {
      lat: 41.509,
      lng: -81.6117,
      city: "Cleveland",
      country: "United States",
      continent: "North America",
    },
    // Classical pediment and columns, after the museum's marble Beaux-Arts building.
    icon: '<path d="M3 9l9-5 9 5zM6 9v9M10 9v9M14 9v9M18 9v9M3 21h18"/>',
  },
  {
    id: "deshou",
    name: "南宋德寿宫遗址博物馆",
    subtitle: "Deshou Palace Site Museum · Hangzhou, China",
    place: {
      lat: 30.2432,
      lng: 120.1717,
      city: "Hangzhou",
      country: "China",
      continent: "Asia",
    },
    // Hall with flared, upturned eaves, a ridge block and a door, after a Song palace hall.
    icon: '<path d="M1.5 12c3.5 0 6-1.5 7-4h7c1 2.5 3.5 4 7 4M9 8l1.5-3.5h3L15 8M6 12v8h12v-8M10 20v-4h4v4"/>',
  },
  {
    id: "seattle",
    name: "Seattle Art Museum",
    subtitle: "Seattle, Washington",
    place: {
      lat: 47.6073,
      lng: -122.3381,
      city: "Seattle",
      country: "United States",
      continent: "North America",
    },
    // Picture frame around a mountain ridge, after Mount Rainier.
    icon: '<rect x="4" y="5" width="16" height="14"/><path d="M4 16l5-5 4 4 3-3 4 4"/>',
  },
  {
    id: "nga-dc",
    name: "National Gallery of Art",
    subtitle: "Washington, D.C.",
    place: {
      lat: 38.8913,
      lng: -77.02,
      city: "Washington, D.C.",
      country: "United States",
      continent: "North America",
    },
    // Domed rotunda on a low base, after the West Building.
    icon: '<path d="M3 20h18M5 20v-7h14v7M8 13a4 4 0 0 1 8 0M12 9V6"/>',
  },
  {
    id: "moma",
    name: "The Museum of Modern Art",
    subtitle: "New York, New York",
    place: {
      lat: 40.7614,
      lng: -73.9776,
      city: "New York",
      country: "United States",
      continent: "North America",
    },
    // Offset grid of squares, after a modernist canvas.
    icon: '<rect x="4" y="4" width="7" height="7"/><rect x="13" y="4" width="7" height="7"/><rect x="4" y="13" width="7" height="7"/><path d="M13 20l7-7"/>',
  },
  {
    id: "aic",
    name: "The Art Institute of Chicago",
    subtitle: "Chicago, Illinois",
    place: {
      lat: 41.8796,
      lng: -87.6237,
      city: "Chicago",
      country: "United States",
      continent: "North America",
    },
    // Round arch and doorway, after the Michigan Avenue entrance.
    icon: '<path d="M4 20V10a8 8 0 0 1 16 0v10M9 20v-6a3 3 0 0 1 6 0v6"/>',
  },
  {
    id: "louvre",
    name: "Musée du Louvre",
    subtitle: "Paris, France",
    place: {
      lat: 48.8606,
      lng: 2.3376,
      city: "Paris",
      country: "France",
      continent: "Europe",
    },
    // Glass pyramid.
    icon: '<path d="M3 20h18L12 5zM12 5v15M7.5 12.5h9"/>',
  },
  {
    id: "orsay",
    name: "Musée d’Orsay",
    subtitle: "Paris, France",
    place: {
      lat: 48.86,
      lng: 2.3266,
      city: "Paris",
      country: "France",
      continent: "Europe",
    },
    // Clock face, after the station clock.
    icon: '<circle cx="12" cy="11" r="7"/><path d="M12 7v4l3 2M4 21h16"/>',
  },
  {
    id: "prado",
    name: "Museo del Prado",
    subtitle: "Madrid, Spain",
    place: {
      lat: 40.4138,
      lng: -3.6921,
      city: "Madrid",
      country: "Spain",
      continent: "Europe",
    },
    // Crown, for the Spanish royal collection.
    icon: '<path d="M4 18L3 9l5 4 4-7 4 7 5-4-1 9zM4 21h16"/>',
  },
  {
    id: "national-gallery-london",
    name: "The National Gallery",
    subtitle: "London, United Kingdom",
    place: {
      lat: 51.5089,
      lng: -0.1283,
      city: "London",
      country: "United Kingdom",
      continent: "Europe",
    },
    // Column, after Nelson’s Column in Trafalgar Square.
    icon: '<path d="M10 4h4v2h-4zM11 6v13M13 6v13M8 19h8v2H8z"/>',
  },
];

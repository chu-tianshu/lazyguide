/**
 * Preview images, keyed by painting id. Only works whose copyright has expired
 * are included, each taken from a Wikimedia Commons file that identifies the
 * High Museum of Art's own object. See CREDITS.md.
 */
export interface PaintingImage {
  src: string;
  sourceUrl: string; // Wikimedia Commons file page
  license: string;
}

export const paintingImages: Record<string, PaintingImage> = {
  "58-33": {
    src: "/images/paintings/58-33.jpg",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Giovanni_Bellini_-_Madonna_and_Child_(High_Museum_of_Art).jpg",
    license: "Public domain",
  },
  "1990-1": {
    src: "/images/paintings/1990-1.jpg",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:The_Funeral_of_Atala_by_Anne-Louis_De_Roussy_Girodet-Trioson,_High_Museum_of_Art.jpg",
    license: "Public domain",
  },
  "60-5": {
    src: "/images/paintings/60-5.jpg",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Claude_Monet_-_Houses_of_Parliament_in_the_Fog_-_High_Museum_of_Art.jpg",
    license: "Public domain",
  },
  "2000-205": {
    src: "/images/paintings/2000-205.jpg",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Autumn_on_the_Seine,_Argenteuil_by_Claude_Monet,_High_Museum_of_Art.jpg",
    license: "Public domain",
  },
  "73-3": {
    src: "/images/paintings/73-3.jpg",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:John_Singer_Sargent_-_Ralph_Curtis_on_the_Beach_in_Scheveningen.jpg",
    license: "Public domain",
  },
};

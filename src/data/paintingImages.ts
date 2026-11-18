/**
 * Preview images, keyed by work id, from Wikimedia Commons files that identify
 * the museum's own object. High Museum works: public domain or CC0 only. Henan
 * Museum objects: CC0, or CC BY-SA 4.0 with the photographer credited. See CREDITS.md.
 */
export interface PaintingImage {
  src: string;
  sourceUrl: string; // Wikimedia Commons file page
  license: string;
  author?: string; // photographer credit, shown in the caption (required by CC BY-SA)
  sourceLabel?: string; // name of the source site, when it is not Wikimedia Commons
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
  "2018-41": {
    src: "/images/paintings/2018-41.jpg",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Henry_Church_-_'A_Friend_in_Need_is_a_Friend_Indeed',_c._1888.JPG",
    license: "CC0",
  },
  "73-3": {
    src: "/images/paintings/73-3.jpg",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:John_Singer_Sargent_-_Ralph_Curtis_on_the_Beach_in_Scheveningen.jpg",
    license: "Public domain",
  },
  "henan-01": {
    src: "/images/paintings/henan-01.jpg",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Early_Peiligang_Culture_Bone_Flute,_Wuyang.jpg",
    license: "CC0",
    author: "Gary Todd",
  },
  "henan-05": {
    src: "/images/paintings/henan-05.jpg",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Spring_%26_Autumn_Bronze_Jin_-_10336384816.jpg",
    license: "CC0",
    author: "Gary Todd",
  },
  "henan-08": {
    src: "/images/paintings/henan-08.jpg",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Four_Deities_in_Clouds,_Western_Han_Tomb_Mural_Painting.jpg",
    license: "CC0",
    author: "Gary Todd",
  },
  "henan-10": {
    src: "/images/paintings/henan-10.jpg",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Yangshao_Culture_Painted_Pottery_Twin_Flasks.jpg",
    license: "CC0",
    author: "Gary Todd",
  },
  "henan-12": {
    src: "/images/paintings/henan-12.jpg",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Sun_Gao_Bianzhong,_picture4.jpg",
    license: "CC0",
    author: "Huangdan2060",
  },
  "henan-02": {
    src: "/images/paintings/henan-02.jpg",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:20210220_Bronze_owl-shaped_Zun_with_inscriptions_of_Fu_Hao,_Henan_Museum.jpg",
    license: "CC BY-SA 4.0",
    author: "Windmemories",
  },
  "henan-03": {
    src: "/images/paintings/henan-03.jpg",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:20260520_Rectangular_Pots_with_Lotus_Petal_Cover_and_Crane_Decoration_01.jpg",
    license: "CC BY-SA 4.0",
    author: "Windmemories",
  },
  "henan-04": {
    src: "/images/paintings/henan-04.jpg",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:20210220_Wu_Zetian_Gold_Strip,_Henan_Museum.jpg",
    license: "CC BY-SA 4.0",
    author: "Windmemories",
  },
  "henan-06": {
    src: "/images/paintings/henan-06.jpg",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:20250527_Nipple-nailed_square_ding_with_beast_face_patterns_in_the_Henan_Museum.jpg",
    license: "CC BY-SA 4.0",
    author: "Yumeto",
  },
  "henan-09": {
    src: "/images/paintings/henan-09.jpg",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:汝窑天蓝釉刻花鹅颈瓷瓶.png",
    license: "CC BY-SA 4.0",
    author: "陳寅恪",
  },
  "henan-11": {
    src: "/images/paintings/henan-11.jpg",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:“王子午”青铜鼎（附匕）03671.jpg",
    license: "CC BY-SA 4.0",
    author: "Cangminzho",
  },
  "henan-14": {
    src: "/images/paintings/henan-14.jpg",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:20260520_Jade_Suit_Sewn_with_Gold_Thread.jpg",
    license: "CC BY-SA 4.0",
    author: "Windmemories",
  },
  "henan-15": {
    src: "/images/paintings/henan-15.jpg",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:20260520_Tri-Color_Glazed_Pottery_Cup_Shaped_of_Horn.jpg",
    license: "CC BY-SA 4.0",
    author: "Windmemories",
  },
  "henan-16": {
    src: "/images/paintings/henan-16.jpg",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:20210220_Green_glazed_pottery_standing_dog,_Henan_Museum.jpg",
    license: "CC BY-SA 4.0",
    author: "Windmemories",
  },
  "henan-19": {
    src: "/images/paintings/henan-19.jpg",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:20230217_Three-color_Porcelain_Pillow_in_Lion_Shape.jpg",
    license: "CC BY-SA 4.0",
    author: "Windmemories",
  },
};

/**
 * Header photos for each museum, hosted on Wikimedia Commons (free licences or public domain).
 * `file` is the Commons file name; the image is served resized through Special:FilePath.
 */
const HEADERS: Record<string, string> = {
  "high-atlanta": "High_Museum_in_Atlanta.jpg",
  henan: "20210220_Henan_Museum_-_main_hall_01.jpg",
  cleveland: "Cleveland_Museum_of_Art_(8687300870).jpg",
  deshou: "20240109_Nan_Song_Deshou_Gong_Yizhi_Bowuguan_(113510).jpg",
  "king-center": "Martin_Luther_King_Jr._National_Historic_Site_August_2016_23_(The_King_Center_-_Reflecting_Pool).jpg",
  seattle: "Seattle_Art_Museum_03.jpg",
  "nga-dc": "National_Gallery_of_Art_-_2026_(55255088792).jpg",
  moma: "MoMa_NY_USA_1.jpg",
  aic: "2014_Chicago_Art_Institute_02.jpg",
  louvre: "Louvre_Museum_Wikimedia_Commons.jpg",
  orsay: "Musée_d'Orsay,_North-West_view,_Paris_7e_140402.jpg",
  prado: "Museo_del_Prado_2016_(25185969599).jpg",
  "national-gallery-london": "Galería_Nacional,_Londres,_Inglaterra,_2014-08-07,_DD_036.JPG",
};

export interface MuseumHeader {
  src: string;
  /** The Commons page for the photo, for attribution. */
  creditUrl: string;
}

export function museumHeader(museumId: string): MuseumHeader | null {
  const file = HEADERS[museumId];
  if (!file) return null;
  const name = encodeURIComponent(file);
  return {
    src: `https://commons.wikimedia.org/wiki/Special:FilePath/${name}?width=1280`,
    creditUrl: `https://commons.wikimedia.org/wiki/File:${name}`,
  };
}

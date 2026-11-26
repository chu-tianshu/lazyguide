/**
 * Museum names and places in each supported language. The database holds one (English) name per
 * museum; these are the translations shown in the app. A museum or place missing here falls back to the
 * database value.
 */
import type { LanguageCode } from "@/lib/i18n";

type L10n = Record<LanguageCode, string>;

const museumText: Record<string, { name: L10n; location: L10n }> = {
  "high-atlanta": {
    name: { en: "High Museum of Art", zh: "高艺术博物馆", fr: "Musée d’art High", es: "Museo de Arte High" },
    location: { en: "Atlanta, Georgia", zh: "美国佐治亚州亚特兰大", fr: "Atlanta, Géorgie", es: "Atlanta, Georgia" },
  },
  henan: {
    name: { en: "Henan Museum", zh: "河南博物院", fr: "Musée du Henan", es: "Museo de Henan" },
    location: { en: "Zhengzhou, China", zh: "中国郑州", fr: "Zhengzhou, Chine", es: "Zhengzhou, China" },
  },
  cleveland: {
    name: { en: "Cleveland Museum of Art", zh: "克利夫兰艺术博物馆", fr: "Musée d’art de Cleveland", es: "Museo de Arte de Cleveland" },
    location: { en: "Cleveland, Ohio", zh: "美国俄亥俄州克利夫兰", fr: "Cleveland, Ohio", es: "Cleveland, Ohio" },
  },
  deshou: {
    name: {
      en: "Deshou Palace Site Museum",
      zh: "南宋德寿宫遗址博物馆",
      fr: "Musée du site du palais Deshou des Song du Sud",
      es: "Museo del sitio del Palacio Deshou de los Song del Sur",
    },
    location: { en: "Hangzhou, China", zh: "中国杭州", fr: "Hangzhou, Chine", es: "Hangzhou, China" },
  },
  seattle: {
    name: { en: "Seattle Art Museum", zh: "西雅图艺术博物馆", fr: "Musée d’art de Seattle", es: "Museo de Arte de Seattle" },
    location: { en: "Seattle, Washington", zh: "美国华盛顿州西雅图", fr: "Seattle, Washington", es: "Seattle, Washington" },
  },
  "nga-dc": {
    name: { en: "National Gallery of Art", zh: "美国国家美术馆", fr: "Galerie nationale d’art", es: "Galería Nacional de Arte" },
    location: { en: "Washington, D.C.", zh: "美国华盛顿特区", fr: "Washington, D.C.", es: "Washington, D. C." },
  },
  moma: {
    name: { en: "The Museum of Modern Art", zh: "纽约现代艺术博物馆", fr: "Musée d’art moderne (MoMA)", es: "Museo de Arte Moderno (MoMA)" },
    location: { en: "New York, New York", zh: "美国纽约", fr: "New York, New York", es: "Nueva York, Nueva York" },
  },
  aic: {
    name: { en: "The Art Institute of Chicago", zh: "芝加哥艺术博物馆", fr: "Art Institute de Chicago", es: "Instituto de Arte de Chicago" },
    location: { en: "Chicago, Illinois", zh: "美国伊利诺伊州芝加哥", fr: "Chicago, Illinois", es: "Chicago, Illinois" },
  },
  louvre: {
    name: { en: "Musée du Louvre", zh: "卢浮宫", fr: "Musée du Louvre", es: "Museo del Louvre" },
    location: { en: "Paris, France", zh: "法国巴黎", fr: "Paris, France", es: "París, Francia" },
  },
  orsay: {
    name: { en: "Musée d’Orsay", zh: "奥赛博物馆", fr: "Musée d’Orsay", es: "Museo de Orsay" },
    location: { en: "Paris, France", zh: "法国巴黎", fr: "Paris, France", es: "París, Francia" },
  },
  prado: {
    name: { en: "Museo del Prado", zh: "普拉多博物馆", fr: "Musée du Prado", es: "Museo del Prado" },
    location: { en: "Madrid, Spain", zh: "西班牙马德里", fr: "Madrid, Espagne", es: "Madrid, España" },
  },
  "national-gallery-london": {
    name: { en: "The National Gallery", zh: "伦敦国家美术馆", fr: "National Gallery", es: "Galería Nacional de Londres" },
    location: { en: "London, United Kingdom", zh: "英国伦敦", fr: "Londres, Royaume-Uni", es: "Londres, Reino Unido" },
  },
  "king-center": {
    name: {
      en: "The King Center & King Birth Home",
      zh: "金中心与金博士出生故居",
      fr: "Centre King et maison natale de King",
      es: "Centro King y casa natal de King",
    },
    location: { en: "Atlanta, Georgia", zh: "美国佐治亚州亚特兰大", fr: "Atlanta, Géorgie", es: "Atlanta, Georgia" },
  },
};

/** The names the world map groups museums under, keyed by their English value in the database. */
const placeText: Record<string, L10n> = {
  // Continents
  "North America": { en: "North America", zh: "北美洲", fr: "Amérique du Nord", es: "Norteamérica" },
  Europe: { en: "Europe", zh: "欧洲", fr: "Europe", es: "Europa" },
  Asia: { en: "Asia", zh: "亚洲", fr: "Asie", es: "Asia" },
  // Countries
  "United States": { en: "United States", zh: "美国", fr: "États-Unis", es: "Estados Unidos" },
  China: { en: "China", zh: "中国", fr: "Chine", es: "China" },
  France: { en: "France", zh: "法国", fr: "France", es: "Francia" },
  Spain: { en: "Spain", zh: "西班牙", fr: "Espagne", es: "España" },
  "United Kingdom": { en: "United Kingdom", zh: "英国", fr: "Royaume-Uni", es: "Reino Unido" },
  // Cities
  Atlanta: { en: "Atlanta", zh: "亚特兰大", fr: "Atlanta", es: "Atlanta" },
  Zhengzhou: { en: "Zhengzhou", zh: "郑州", fr: "Zhengzhou", es: "Zhengzhou" },
  Cleveland: { en: "Cleveland", zh: "克利夫兰", fr: "Cleveland", es: "Cleveland" },
  Hangzhou: { en: "Hangzhou", zh: "杭州", fr: "Hangzhou", es: "Hangzhou" },
  Seattle: { en: "Seattle", zh: "西雅图", fr: "Seattle", es: "Seattle" },
  "Washington, D.C.": { en: "Washington, D.C.", zh: "华盛顿特区", fr: "Washington, D.C.", es: "Washington, D. C." },
  "New York": { en: "New York", zh: "纽约", fr: "New York", es: "Nueva York" },
  Chicago: { en: "Chicago", zh: "芝加哥", fr: "Chicago", es: "Chicago" },
  Paris: { en: "Paris", zh: "巴黎", fr: "Paris", es: "París" },
  Madrid: { en: "Madrid", zh: "马德里", fr: "Madrid", es: "Madrid" },
  London: { en: "London", zh: "伦敦", fr: "Londres", es: "Londres" },
};

/** A continent, country or city name from the database, in the visitor's language. */
export function placeName(name: string, language: LanguageCode): string {
  return placeText[name]?.[language] ?? name;
}

export function museumName(museumId: string, language: LanguageCode): string | undefined {
  return museumText[museumId]?.name[language];
}

export function museumLocation(museumId: string, language: LanguageCode): string | undefined {
  return museumText[museumId]?.location[language];
}

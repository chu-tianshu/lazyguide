/**
 * Museum names and places in each supported language. The database holds one (English) name per
 * museum; these are the translations shown in the app. A museum or place missing here falls back to the
 * database value.
 */
import type { LanguageCode } from "@/lib/i18n";

type L10n = Record<LanguageCode, string>;

const museumText: Record<string, { name: L10n; location: L10n }> = {
  "high-atlanta": {
    name: { en: "High Museum of Art", zh: "高艺术博物馆", fr: "Musée d’art High", es: "Museo de Arte High", de: "High Museum of Art", pt: "High Museum of Art", it: "High Museum of Art", ja: "ハイ美術館", ko: "하이 미술관" },
    location: { en: "Atlanta, Georgia", zh: "美国佐治亚州亚特兰大", fr: "Atlanta, Géorgie", es: "Atlanta, Georgia", de: "Atlanta, Georgia", pt: "Atlanta, Geórgia", it: "Atlanta, Georgia", ja: "アメリカ・ジョージア州アトランタ", ko: "미국 조지아주 애틀랜타" },
  },
  "henan": {
    name: { en: "Henan Museum", zh: "河南博物院", fr: "Musée du Henan", es: "Museo de Henan", de: "Henan-Museum", pt: "Museu de Henan", it: "Museo dell’Henan", ja: "河南博物院", ko: "허난 박물원" },
    location: { en: "Zhengzhou, China", zh: "中国郑州", fr: "Zhengzhou, Chine", es: "Zhengzhou, China", de: "Zhengzhou, China", pt: "Zhengzhou, China", it: "Zhengzhou, Cina", ja: "中国・鄭州", ko: "중국 정저우" },
  },
  "cleveland": {
    name: { en: "Cleveland Museum of Art", zh: "克利夫兰艺术博物馆", fr: "Musée d’art de Cleveland", es: "Museo de Arte de Cleveland", de: "Cleveland Museum of Art", pt: "Museu de Arte de Cleveland", it: "Cleveland Museum of Art", ja: "クリーブランド美術館", ko: "클리블랜드 미술관" },
    location: { en: "Cleveland, Ohio", zh: "美国俄亥俄州克利夫兰", fr: "Cleveland, Ohio", es: "Cleveland, Ohio", de: "Cleveland, Ohio", pt: "Cleveland, Ohio", it: "Cleveland, Ohio", ja: "アメリカ・オハイオ州クリーブランド", ko: "미국 오하이오주 클리블랜드" },
  },
  "deshou": {
    name: { en: "Deshou Palace Site Museum", zh: "南宋德寿宫遗址博物馆", fr: "Musée du site du palais Deshou des Song du Sud", es: "Museo del sitio del Palacio Deshou de los Song del Sur", de: "Museum der Deshou-Palaststätte der Südlichen Song", pt: "Museu do Sítio do Palácio Deshou dos Song do Sul", it: "Museo del sito del Palazzo Deshou dei Song meridionali", ja: "南宋徳寿宮遺跡博物館", ko: "남송 덕수궁 유적 박물관" },
    location: { en: "Hangzhou, China", zh: "中国杭州", fr: "Hangzhou, Chine", es: "Hangzhou, China", de: "Hangzhou, China", pt: "Hangzhou, China", it: "Hangzhou, Cina", ja: "中国・杭州", ko: "중국 항저우" },
  },
  "seattle": {
    name: { en: "Seattle Art Museum", zh: "西雅图艺术博物馆", fr: "Musée d’art de Seattle", es: "Museo de Arte de Seattle", de: "Seattle Art Museum", pt: "Museu de Arte de Seattle", it: "Seattle Art Museum", ja: "シアトル美術館", ko: "시애틀 미술관" },
    location: { en: "Seattle, Washington", zh: "美国华盛顿州西雅图", fr: "Seattle, Washington", es: "Seattle, Washington", de: "Seattle, Washington", pt: "Seattle, Washington", it: "Seattle, Washington", ja: "アメリカ・ワシントン州シアトル", ko: "미국 워싱턴주 시애틀" },
  },
  "nga-dc": {
    name: { en: "National Gallery of Art", zh: "美国国家美术馆", fr: "Galerie nationale d’art", es: "Galería Nacional de Arte", de: "National Gallery of Art", pt: "Galeria Nacional de Arte", it: "National Gallery of Art", ja: "ナショナル・ギャラリー・オブ・アート", ko: "미국 국립미술관" },
    location: { en: "Washington, D.C.", zh: "美国华盛顿特区", fr: "Washington, D.C.", es: "Washington, D. C.", de: "Washington, D.C.", pt: "Washington, D.C.", it: "Washington, D.C.", ja: "アメリカ・ワシントンD.C.", ko: "미국 워싱턴 D.C." },
  },
  "moma": {
    name: { en: "The Museum of Modern Art", zh: "纽约现代艺术博物馆", fr: "Musée d’art moderne (MoMA)", es: "Museo de Arte Moderno (MoMA)", de: "Museum of Modern Art (MoMA)", pt: "Museu de Arte Moderna (MoMA)", it: "Museum of Modern Art (MoMA)", ja: "ニューヨーク近代美術館（MoMA）", ko: "뉴욕 현대미술관(MoMA)" },
    location: { en: "New York, New York", zh: "美国纽约", fr: "New York, New York", es: "Nueva York, Nueva York", de: "New York, New York", pt: "Nova Iorque, Nova Iorque", it: "New York, New York", ja: "アメリカ・ニューヨーク", ko: "미국 뉴욕" },
  },
  "aic": {
    name: { en: "The Art Institute of Chicago", zh: "芝加哥艺术博物馆", fr: "Art Institute de Chicago", es: "Instituto de Arte de Chicago", de: "Art Institute of Chicago", pt: "Instituto de Arte de Chicago", it: "Art Institute di Chicago", ja: "シカゴ美術館", ko: "시카고 미술관" },
    location: { en: "Chicago, Illinois", zh: "美国伊利诺伊州芝加哥", fr: "Chicago, Illinois", es: "Chicago, Illinois", de: "Chicago, Illinois", pt: "Chicago, Ilinóis", it: "Chicago, Illinois", ja: "アメリカ・イリノイ州シカゴ", ko: "미국 일리노이주 시카고" },
  },
  "louvre": {
    name: { en: "Musée du Louvre", zh: "卢浮宫", fr: "Musée du Louvre", es: "Museo del Louvre", de: "Louvre", pt: "Museu do Louvre", it: "Museo del Louvre", ja: "ルーヴル美術館", ko: "루브르 박물관" },
    location: { en: "Paris, France", zh: "法国巴黎", fr: "Paris, France", es: "París, Francia", de: "Paris, Frankreich", pt: "Paris, França", it: "Parigi, Francia", ja: "フランス・パリ", ko: "프랑스 파리" },
  },
  "orsay": {
    name: { en: "Musée d’Orsay", zh: "奥赛博物馆", fr: "Musée d’Orsay", es: "Museo de Orsay", de: "Musée d’Orsay", pt: "Museu de Orsay", it: "Museo d’Orsay", ja: "オルセー美術館", ko: "오르세 미술관" },
    location: { en: "Paris, France", zh: "法国巴黎", fr: "Paris, France", es: "París, Francia", de: "Paris, Frankreich", pt: "Paris, França", it: "Parigi, Francia", ja: "フランス・パリ", ko: "프랑스 파리" },
  },
  "prado": {
    name: { en: "Museo del Prado", zh: "普拉多博物馆", fr: "Musée du Prado", es: "Museo del Prado", de: "Museo del Prado", pt: "Museu do Prado", it: "Museo del Prado", ja: "プラド美術館", ko: "프라도 미술관" },
    location: { en: "Madrid, Spain", zh: "西班牙马德里", fr: "Madrid, Espagne", es: "Madrid, España", de: "Madrid, Spanien", pt: "Madrid, Espanha", it: "Madrid, Spagna", ja: "スペイン・マドリード", ko: "스페인 마드리드" },
  },
  "national-gallery-london": {
    name: { en: "The National Gallery", zh: "伦敦国家美术馆", fr: "National Gallery", es: "Galería Nacional de Londres", de: "National Gallery", pt: "National Gallery", it: "National Gallery", ja: "ナショナル・ギャラリー", ko: "런던 내셔널 갤러리" },
    location: { en: "London, United Kingdom", zh: "英国伦敦", fr: "Londres, Royaume-Uni", es: "Londres, Reino Unido", de: "London, Vereinigtes Königreich", pt: "Londres, Reino Unido", it: "Londra, Regno Unito", ja: "イギリス・ロンドン", ko: "영국 런던" },
  },
  "king-center": {
    name: { en: "The King Center & King Birth Home", zh: "金中心与金博士出生故居", fr: "Centre King et maison natale de King", es: "Centro King y casa natal de King", de: "King Center und Geburtshaus von King", pt: "Centro King e casa natal de King", it: "King Center e casa natale di King", ja: "キング・センターとキング生家", ko: "킹 센터 및 킹 생가" },
    location: { en: "Atlanta, Georgia", zh: "美国佐治亚州亚特兰大", fr: "Atlanta, Géorgie", es: "Atlanta, Georgia", de: "Atlanta, Georgia", pt: "Atlanta, Geórgia", it: "Atlanta, Georgia", ja: "アメリカ・ジョージア州アトランタ", ko: "미국 조지아주 애틀랜타" },
  },
};

/** The names the world map groups museums under, keyed by their English value in the database. */
const placeText: Record<string, L10n> = {
  "North America": { en: "North America", zh: "北美洲", fr: "Amérique du Nord", es: "Norteamérica", de: "Nordamerika", pt: "América do Norte", it: "Nord America", ja: "北アメリカ", ko: "북아메리카" },
  "Europe": { en: "Europe", zh: "欧洲", fr: "Europe", es: "Europa", de: "Europa", pt: "Europa", it: "Europa", ja: "ヨーロッパ", ko: "유럽" },
  "Asia": { en: "Asia", zh: "亚洲", fr: "Asie", es: "Asia", de: "Asien", pt: "Ásia", it: "Asia", ja: "アジア", ko: "아시아" },
  "United States": { en: "United States", zh: "美国", fr: "États-Unis", es: "Estados Unidos", de: "USA", pt: "Estados Unidos", it: "Stati Uniti", ja: "アメリカ合衆国", ko: "미국" },
  "China": { en: "China", zh: "中国", fr: "Chine", es: "China", de: "China", pt: "China", it: "Cina", ja: "中国", ko: "중국" },
  "France": { en: "France", zh: "法国", fr: "France", es: "Francia", de: "Frankreich", pt: "França", it: "Francia", ja: "フランス", ko: "프랑스" },
  "Spain": { en: "Spain", zh: "西班牙", fr: "Espagne", es: "España", de: "Spanien", pt: "Espanha", it: "Spagna", ja: "スペイン", ko: "스페인" },
  "United Kingdom": { en: "United Kingdom", zh: "英国", fr: "Royaume-Uni", es: "Reino Unido", de: "Vereinigtes Königreich", pt: "Reino Unido", it: "Regno Unito", ja: "イギリス", ko: "영국" },
  "Atlanta": { en: "Atlanta", zh: "亚特兰大", fr: "Atlanta", es: "Atlanta", de: "Atlanta", pt: "Atlanta", it: "Atlanta", ja: "アトランタ", ko: "애틀랜타" },
  "Zhengzhou": { en: "Zhengzhou", zh: "郑州", fr: "Zhengzhou", es: "Zhengzhou", de: "Zhengzhou", pt: "Zhengzhou", it: "Zhengzhou", ja: "鄭州", ko: "정저우" },
  "Cleveland": { en: "Cleveland", zh: "克利夫兰", fr: "Cleveland", es: "Cleveland", de: "Cleveland", pt: "Cleveland", it: "Cleveland", ja: "クリーブランド", ko: "클리블랜드" },
  "Hangzhou": { en: "Hangzhou", zh: "杭州", fr: "Hangzhou", es: "Hangzhou", de: "Hangzhou", pt: "Hangzhou", it: "Hangzhou", ja: "杭州", ko: "항저우" },
  "Seattle": { en: "Seattle", zh: "西雅图", fr: "Seattle", es: "Seattle", de: "Seattle", pt: "Seattle", it: "Seattle", ja: "シアトル", ko: "시애틀" },
  "Washington, D.C.": { en: "Washington, D.C.", zh: "华盛顿特区", fr: "Washington, D.C.", es: "Washington, D. C.", de: "Washington, D.C.", pt: "Washington, D.C.", it: "Washington, D.C.", ja: "ワシントンD.C.", ko: "워싱턴 D.C." },
  "New York": { en: "New York", zh: "纽约", fr: "New York", es: "Nueva York", de: "New York", pt: "Nova Iorque", it: "New York", ja: "ニューヨーク", ko: "뉴욕" },
  "Chicago": { en: "Chicago", zh: "芝加哥", fr: "Chicago", es: "Chicago", de: "Chicago", pt: "Chicago", it: "Chicago", ja: "シカゴ", ko: "시카고" },
  "Paris": { en: "Paris", zh: "巴黎", fr: "Paris", es: "París", de: "Paris", pt: "Paris", it: "Parigi", ja: "パリ", ko: "파리" },
  "Madrid": { en: "Madrid", zh: "马德里", fr: "Madrid", es: "Madrid", de: "Madrid", pt: "Madrid", it: "Madrid", ja: "マドリード", ko: "마드리드" },
  "London": { en: "London", zh: "伦敦", fr: "Londres", es: "Londres", de: "London", pt: "Londres", it: "Londra", ja: "ロンドン", ko: "런던" },
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

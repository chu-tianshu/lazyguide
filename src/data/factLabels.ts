/**
 * The metadata labels every work shares (date, medium, size…), in each language. Catalog rows store
 * the label in the catalog's own language ("Date", "年代"); this maps either back to one key so the
 * label shows in the visitor's language whichever catalog the work came from. Labels that are specific
 * to one work or museum are not here and show as stored.
 */
import type { LanguageCode } from "@/lib/i18n";

type L10n = Record<LanguageCode, string>;

const labels: Record<string, L10n & { aliases?: string[] }> = {
  date: { en: "Date", zh: "年代", fr: "Date", es: "Fecha", de: "Datum", pt: "Data", it: "Data", ja: "日付", ko: "날짜" },
  medium: { en: "Medium", zh: "材质", fr: "Technique", es: "Técnica", de: "Technik", pt: "Técnica", it: "Tecnica", ja: "技法・素材", ko: "기법" },
  dimensions: { en: "Dimensions", zh: "尺寸", fr: "Dimensions", es: "Dimensiones", aliases: ["Size"], de: "Maße", pt: "Dimensões", it: "Dimensioni", ja: "寸法", ko: "크기" },
  height: { en: "Height", zh: "高度", fr: "Hauteur", es: "Altura", de: "Höhe", pt: "Altura", it: "Altezza", ja: "高さ", ko: "높이" },
  location: { en: "Location", zh: "位置", fr: "Emplacement", es: "Ubicación", de: "Standort", pt: "Localização", it: "Ubicazione", ja: "所在地", ko: "위치" },
  inventory: { en: "Inventory no.", zh: "藏品编号", fr: "N° d’inventaire", es: "N.º de inventario", de: "Inventarnr.", pt: "N.º de inventário", it: "N. inventario", ja: "収蔵番号", ko: "소장품 번호" },
  accession: { en: "Accession", zh: "编号", fr: "N° d’acquisition", es: "N.º de registro", de: "Zugangsnr.", pt: "N.º de registo", it: "N. di acquisizione", ja: "受入番号", ko: "입수 번호" },
  department: { en: "Department", zh: "部门", fr: "Département", es: "Departamento", de: "Abteilung", pt: "Departamento", it: "Dipartimento", ja: "部門", ko: "부서" },
  culture: { en: "Culture", zh: "文化", fr: "Culture", es: "Cultura", de: "Kultur", pt: "Cultura", it: "Cultura", ja: "文化", ko: "문화" },
  period: { en: "Period", zh: "时期", fr: "Période", es: "Período", de: "Epoche", pt: "Período", it: "Periodo", ja: "時代", ko: "시대" },
  era: { en: "Era", zh: "时代", fr: "Époque", es: "Época", de: "Zeit", pt: "Época", it: "Epoca", ja: "年代区分", ko: "시기" },
  type: { en: "Type", zh: "类别", fr: "Type", es: "Tipo", de: "Typ", pt: "Tipo", it: "Tipo", ja: "種別", ko: "유형" },
  credit: { en: "Credit", zh: "来源", fr: "Crédit", es: "Crédito", de: "Nachweis", pt: "Crédito", it: "Crediti", ja: "クレジット", ko: "출처" },
  material: { en: "Material", zh: "材料", fr: "Matériau", es: "Material", de: "Material", pt: "Material", it: "Materiale", ja: "素材", ko: "재료" },
};

const byStoredLabel = new Map<string, string>();
for (const [key, l] of Object.entries(labels)) {
  for (const stored of [l.en, l.zh, ...(l.aliases ?? [])]) {
    if (!byStoredLabel.has(stored)) byStoredLabel.set(stored, key);
  }
}

/** A work's metadata label as stored, in the visitor's language when it is one of the shared ones. */
export function factLabel(stored: string, language: LanguageCode): string {
  const key = byStoredLabel.get(stored);
  return key ? labels[key][language] : stored;
}

/**
 * The metadata labels every work shares (date, medium, size…), in each language. Catalog rows store
 * the label in the catalog's own language ("Date", "年代"); this maps either back to one key so the
 * label shows in the visitor's language whichever catalog the work came from. Labels that are specific
 * to one work or museum are not here and show as stored.
 */
import type { LanguageCode } from "@/lib/i18n";

type L10n = Record<LanguageCode, string>;

const labels: Record<string, L10n & { aliases?: string[] }> = {
  date: { en: "Date", zh: "年代", fr: "Date", es: "Fecha" },
  medium: { en: "Medium", zh: "材质", fr: "Technique", es: "Técnica" },
  dimensions: { en: "Dimensions", zh: "尺寸", fr: "Dimensions", es: "Dimensiones", aliases: ["Size"] },
  height: { en: "Height", zh: "高度", fr: "Hauteur", es: "Altura" },
  location: { en: "Location", zh: "位置", fr: "Emplacement", es: "Ubicación" },
  inventory: { en: "Inventory no.", zh: "藏品编号", fr: "N° d’inventaire", es: "N.º de inventario" },
  accession: { en: "Accession", zh: "编号", fr: "N° d’acquisition", es: "N.º de registro" },
  department: { en: "Department", zh: "部门", fr: "Département", es: "Departamento" },
  culture: { en: "Culture", zh: "文化", fr: "Culture", es: "Cultura" },
  period: { en: "Period", zh: "时期", fr: "Période", es: "Período" },
  era: { en: "Era", zh: "时代", fr: "Époque", es: "Época" },
  type: { en: "Type", zh: "类别", fr: "Type", es: "Tipo" },
  credit: { en: "Credit", zh: "来源", fr: "Crédit", es: "Crédito" },
  material: { en: "Material", zh: "材料", fr: "Matériau", es: "Material" },
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

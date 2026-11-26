import type { LanguageCode } from "@/lib/i18n";

export interface Language {
  code: LanguageCode;
  label: string; // shown in the language's own script
  subtitle: string;
  /** The word "language" in this language, for the cycling heading on the first-run screen. */
  word: string;
}

/** All languages the app knows about. Which ones a museum offers comes from its guide files. */
export const languages: Language[] = [
  { code: "en", label: "English", subtitle: "United States", word: "Language" },
  { code: "zh", label: "简体中文", subtitle: "中国 · 普通话", word: "语言" },
  { code: "fr", label: "Français", subtitle: "France", word: "Langue" },
  { code: "es", label: "Español", subtitle: "España", word: "Idioma" },
  { code: "de", label: "Deutsch", subtitle: "Deutschland", word: "Sprache" },
  { code: "pt", label: "Português", subtitle: "Portugal", word: "Língua" },
  { code: "it", label: "Italiano", subtitle: "Italia", word: "Lingua" },
  { code: "ja", label: "日本語", subtitle: "日本", word: "言語" },
  { code: "ko", label: "한국어", subtitle: "대한민국", word: "언어" },
];

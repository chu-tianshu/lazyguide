import type { LanguageCode } from "@/lib/i18n";

export interface Language {
  code: LanguageCode;
  label: string; // shown in the language's own script
  subtitle: string;
}

/** All languages the app knows about. Which ones a museum offers comes from its guide files. */
export const languages: Language[] = [
  { code: "en", label: "English", subtitle: "United States" },
  { code: "zh", label: "简体中文", subtitle: "中国 · 普通话" },
];

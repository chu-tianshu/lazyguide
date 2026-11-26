import type { LanguageCode } from "@/lib/i18n";
import { CnFlag } from "./CnFlag";
import { UsFlag } from "./UsFlag";

function FrFlag({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 30 20" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <rect width="10" height="20" fill="#002395" />
      <rect x="10" width="10" height="20" fill="#ffffff" />
      <rect x="20" width="10" height="20" fill="#ed2939" />
    </svg>
  );
}

function EsFlag({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 30 20" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <rect width="30" height="20" fill="#aa151b" />
      <rect y="5" width="30" height="10" fill="#f1bf00" />
    </svg>
  );
}

/** A decorative flag for a language (its name is always shown next to it). */
export function LanguageFlag({ code, className }: { code: LanguageCode; className?: string }) {
  switch (code) {
    case "zh":
      return <CnFlag className={className} />;
    case "fr":
      return <FrFlag className={className} />;
    case "es":
      return <EsFlag className={className} />;
    default:
      return <UsFlag className={className} />;
  }
}

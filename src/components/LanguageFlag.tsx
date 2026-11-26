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

const svg = (className: string | undefined, children: React.ReactNode) => (
  <svg className={className} viewBox="0 0 30 20" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
    {children}
  </svg>
);

function DeFlag({ className }: { className?: string }) {
  return svg(
    className,
    <>
      <rect width="30" height="7" fill="#000000" />
      <rect y="6.67" width="30" height="6.67" fill="#dd0000" />
      <rect y="13.33" width="30" height="6.67" fill="#ffce00" />
    </>,
  );
}

function ItFlag({ className }: { className?: string }) {
  return svg(
    className,
    <>
      <rect width="10" height="20" fill="#009246" />
      <rect x="10" width="10" height="20" fill="#ffffff" />
      <rect x="20" width="10" height="20" fill="#ce2b37" />
    </>,
  );
}

function PtFlag({ className }: { className?: string }) {
  return svg(
    className,
    <>
      <rect width="12" height="20" fill="#006600" />
      <rect x="12" width="18" height="20" fill="#ff0000" />
      <circle cx="12" cy="10" r="3.4" fill="#ffcc00" />
      <circle cx="12" cy="10" r="1.9" fill="#ff0000" />
    </>,
  );
}

function JpFlag({ className }: { className?: string }) {
  return svg(
    className,
    <>
      <rect width="30" height="20" fill="#ffffff" />
      <circle cx="15" cy="10" r="6" fill="#bc002d" />
    </>,
  );
}

function KrFlag({ className }: { className?: string }) {
  const bars = (rot: number, n: number) => (
    <g transform={`translate(15 10) rotate(${rot}) translate(0 -7.6)`} fill="#000000">
      {Array.from({ length: n }).map((_, i) => (
        <rect key={i} x="-1.6" y={i * 0.9} width="3.2" height="0.5" />
      ))}
    </g>
  );
  return svg(
    className,
    <>
      <rect width="30" height="20" fill="#ffffff" />
      <path d="M9.5 10a5.5 5.5 0 0 1 11 0z" fill="#cd2e3a" />
      <path d="M9.5 10a5.5 5.5 0 0 0 11 0z" fill="#0047a0" />
      {bars(-35, 3)}
      {bars(35, 2)}
      {bars(-145, 2)}
      {bars(145, 3)}
    </>,
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
    case "de":
      return <DeFlag className={className} />;
    case "it":
      return <ItFlag className={className} />;
    case "pt":
      return <PtFlag className={className} />;
    case "ja":
      return <JpFlag className={className} />;
    case "ko":
      return <KrFlag className={className} />;
    default:
      return <UsFlag className={className} />;
  }
}

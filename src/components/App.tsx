"use client";

import { useState } from "react";
import { availableLanguages, getCatalog } from "@/data/catalog";
import { languages } from "@/data/languages";
import { museums } from "@/data/museums";
import type { LanguageCode } from "@/lib/i18n";
import { ChoicePage } from "./ChoicePage";
import { MuseumMap } from "./MuseumMap";
import { CnFlag } from "./CnFlag";
import { CollectionPage } from "./CollectionPage";
import { PaintingDetail } from "./PaintingDetail";
import { UsFlag } from "./UsFlag";
import { UserBar } from "./UserBar";
import { VisitsPage } from "./VisitsPage";
import { AuthProvider } from "@/lib/auth";

const flags: Record<LanguageCode, React.ReactNode> = {
  en: <UsFlag className="flag" />,
  zh: <CnFlag className="flag" />,
};

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const [museumId, setMuseumId] = useState<string | null>(null);
  const [languageCode, setLanguageCode] = useState<LanguageCode | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showVisits, setShowVisits] = useState(false);

  const museum = museums.find((m) => m.id === museumId);
  const catalog = museum && languageCode ? getCatalog(museum.id, languageCode) : undefined;
  const work = catalog?.works.find((w) => w.id === selectedId);

  const reset = () => {
    setMuseumId(null);
    setLanguageCode(null);
    setSelectedId(null);
  };

  if (showVisits) {
    return <VisitsPage onBack={() => setShowVisits(false)} />;
  }

  if (!museum) {
    return (
      <main className="map-shell" lang="en">
        <header className="brand map-brand">
          <h1>Lazy Guide</h1>
          <p className="brand-tag">Audio guides, at your own pace</p>
        </header>
        <UserBar onShowVisits={() => setShowVisits(true)} />
        <MuseumMap museums={museums} onSelect={setMuseumId} />
        <p className="map-hint">Zoom in to find a museum. Click its icon to see the name, then click the name to enter.</p>
      </main>
    );
  }

  let content;
  if (!catalog) {
    // Only the languages this museum has guides for are offered.
    const offered = availableLanguages(museum.id);
    content = (
      <ChoicePage
        heading={"Language · 语言"}
        options={languages
          .filter((l) => offered.includes(l.code))
          .map((l) => ({
            id: l.code,
            title: l.label,
            subtitle: l.subtitle,
            visual: flags[l.code],
          }))}
        onChoose={(code) => setLanguageCode(code as LanguageCode)}
        onBack={() => setMuseumId(null)}
      />
    );
  } else if (work) {
    content = (
      <PaintingDetail
        key={work.id}
        work={work}
        museumId={museum.id}
        language={catalog.language}
        textCredit={catalog.textCredit}
        onBack={() => setSelectedId(null)}
      />
    );
  } else {
    content = <CollectionPage catalog={catalog} onSelect={setSelectedId} onChangeMuseum={reset} />;
  }

  return (
    <main className="shell" lang={languageCode === "zh" ? "zh-Hans" : "en"}>
      {content}
    </main>
  );
}

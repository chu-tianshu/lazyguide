"use client";

import { useState } from "react";
import { availableLanguages, getCatalog } from "@/data/catalog";
import { languages } from "@/data/languages";
import { museums } from "@/data/museums";
import type { LanguageCode } from "@/lib/i18n";
import { ChoicePage } from "./ChoicePage";
import { CnFlag } from "./CnFlag";
import { CollectionPage } from "./CollectionPage";
import { PaintingDetail } from "./PaintingDetail";
import { UsFlag } from "./UsFlag";

const flags: Record<LanguageCode, React.ReactNode> = {
  en: <UsFlag className="flag" />,
  zh: <CnFlag className="flag" />,
};

export function App() {
  const [museumId, setMuseumId] = useState<string | null>(null);
  const [languageCode, setLanguageCode] = useState<LanguageCode | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const museum = museums.find((m) => m.id === museumId);
  const catalog = museum && languageCode ? getCatalog(museum.id, languageCode) : undefined;
  const work = catalog?.works.find((w) => w.id === selectedId);

  const reset = () => {
    setMuseumId(null);
    setLanguageCode(null);
    setSelectedId(null);
  };

  let content;
  if (!museum) {
    content = (
      <ChoicePage
        options={museums.map((m) => ({
          id: m.id,
          title: m.name,
          subtitle: m.subtitle,
          visual: <span className="monogram">{m.monogram}</span>,
        }))}
        onChoose={setMuseumId}
      />
    );
  } else if (!catalog) {
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

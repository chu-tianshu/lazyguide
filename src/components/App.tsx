"use client";

import { useState } from "react";
import { getPaintingById } from "@/data/paintings";
import { museums } from "@/data/museums";
import { languages } from "@/data/languages";
import { ChoicePage } from "./ChoicePage";
import { CollectionPage } from "./CollectionPage";
import { PaintingDetail } from "./PaintingDetail";
import { UsFlag } from "./UsFlag";

export function App() {
  const [museumId, setMuseumId] = useState<string | null>(null);
  const [languageCode, setLanguageCode] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const museum = museums.find((m) => m.id === museumId);
  const language = languages.find((l) => l.code === languageCode);
  const painting = selectedId ? getPaintingById(selectedId) : undefined;

  let content;
  if (!museum) {
    content = (
      <ChoicePage
        options={museums.map((m) => ({
          id: m.id,
          title: m.name,
          subtitle: m.location,
          visual: <span className="monogram">{m.monogram}</span>,
        }))}
        onChoose={setMuseumId}
      />
    );
  } else if (!language) {
    content = (
      <ChoicePage
        heading="Language"
        options={languages.map((l) => ({
          id: l.code,
          title: l.label,
          subtitle: "United States",
          visual: l.code === "en" ? <UsFlag className="flag" /> : null,
        }))}
        onChoose={setLanguageCode}
        onBack={() => setMuseumId(null)}
      />
    );
  } else if (painting) {
    content = (
      <PaintingDetail
        key={painting.id}
        painting={painting}
        onBack={() => setSelectedId(null)}
      />
    );
  } else {
    content = <CollectionPage museum={museum} onSelect={setSelectedId} />;
  }

  return <main className="shell">{content}</main>;
}

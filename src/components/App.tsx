"use client";

import { useEffect, useState } from "react";
import type { Catalog, Work } from "@/data/catalog";
import { languages } from "@/data/languages";
import type { Museum } from "@/data/museums";
import type { LanguageCode } from "@/lib/i18n";
import { fetchCatalog, fetchLanguageCodes, fetchMuseums, fetchWork } from "@/lib/catalogApi";
import { ChoicePage } from "./ChoicePage";
import { MuseumMap } from "./MuseumMap";
import { CnFlag } from "./CnFlag";
import { CollectionPage } from "./CollectionPage";
import { PaintingDetail } from "./PaintingDetail";
import { UsFlag } from "./UsFlag";
import { UserBar } from "./UserBar";
import { VisitsPage } from "./VisitsPage";
import { SignInGate } from "./SignInGate";
import { AuthProvider, useAuth } from "@/lib/auth";

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
  const { user, loading } = useAuth();
  const [museumId, setMuseumId] = useState<string | null>(null);
  const [languageCode, setLanguageCode] = useState<LanguageCode | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showVisits, setShowVisits] = useState(false);

  // The catalog lives in Postgres. Each of these is null until its fetch returns.
  const [museums, setMuseums] = useState<Museum[] | null>(null);
  const [offered, setOffered] = useState<LanguageCode[] | null>(null);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [work, setWork] = useState<Work | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  const museum = museums?.find((m) => m.id === museumId);

  useEffect(() => {
    if (!user) return;
    let current = true;
    fetchMuseums().then(
      (list) => current && setMuseums(list),
      () => current && setLoadFailed(true),
    );
    return () => {
      current = false;
    };
  }, [user]);

  useEffect(() => {
    if (!museumId) return;
    let current = true;
    fetchLanguageCodes(museumId).then(
      (codes) => current && setOffered(codes),
      () => current && setLoadFailed(true),
    );
    return () => {
      current = false;
    };
  }, [museumId]);

  useEffect(() => {
    if (!museumId || !languageCode) return;
    let current = true;
    fetchCatalog(museumId, languageCode).then(
      (c) => current && (c ? setCatalog(c) : setLoadFailed(true)),
      () => current && setLoadFailed(true),
    );
    return () => {
      current = false;
    };
  }, [museumId, languageCode]);

  useEffect(() => {
    if (!museumId || !languageCode || !selectedId) return;
    let current = true;
    fetchWork(museumId, languageCode, selectedId).then(
      (w) => current && (w ? setWork(w) : setLoadFailed(true)),
      () => current && setLoadFailed(true),
    );
    return () => {
      current = false;
    };
  }, [museumId, languageCode, selectedId]);

  const reset = () => {
    setMuseumId(null);
    setLanguageCode(null);
    setSelectedId(null);
    setOffered(null);
    setCatalog(null);
    setWork(null);
  };

  const chooseMuseum = (id: string) => {
    setOffered(null);
    setMuseumId(id);
  };

  const chooseLanguage = (code: LanguageCode) => {
    setCatalog(null);
    setLanguageCode(code);
  };

  const chooseWork = (id: string | null) => {
    setWork(null);
    setSelectedId(id);
  };

  if (loading) return null;
  if (!user) return <SignInGate />;

  if (loadFailed) {
    return (
      <main className="shell" lang="en">
        <p className="muted">The collection couldn’t be loaded. Check your connection and reload.</p>
      </main>
    );
  }

  if (showVisits) {
    return <VisitsPage onBack={() => setShowVisits(false)} />;
  }

  if (!museums) {
    return (
      <main className="shell" lang="en">
        <p className="muted">Loading…</p>
      </main>
    );
  }

  if (!museum) {
    return (
      <main className="map-shell" lang="en">
        <header className="brand map-brand">
          <h1>Lazy Guide</h1>
          <p className="brand-tag">Audio guides, at your own pace</p>
        </header>
        <UserBar onShowVisits={() => setShowVisits(true)} />
        <MuseumMap museums={museums} onSelect={chooseMuseum} />
        <p className="map-hint">Zoom in to find a museum. Click its icon to see the name, then click the name to enter.</p>
      </main>
    );
  }

  let content;
  if (!languageCode) {
    // Only the languages this museum has guides for are offered.
    content = offered ? (
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
        onChoose={(code) => chooseLanguage(code as LanguageCode)}
        onBack={reset}
      />
    ) : (
      <p className="muted">Loading…</p>
    );
  } else if (!catalog) {
    content = <p className="muted">Loading…</p>;
  } else if (selectedId) {
    content = work ? (
      <PaintingDetail
        key={work.id}
        work={work}
        museumId={museum.id}
        language={catalog.language}
        textCredit={catalog.textCredit}
        onBack={() => chooseWork(null)}
      />
    ) : (
      <p className="muted">Loading…</p>
    );
  } else {
    content = <CollectionPage catalog={catalog} onSelect={chooseWork} onChangeMuseum={reset} />;
  }

  return (
    <main className="shell" lang={languageCode === "zh" ? "zh-Hans" : "en"}>
      {content}
    </main>
  );
}

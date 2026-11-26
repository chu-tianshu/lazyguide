"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { museumIdForSlug, slugForMuseum } from "@/data/museumSlugs";
import type { Catalog, Work, WorkSummary } from "@/data/catalog";
import type { Museum } from "@/data/museums";
import { languages } from "@/data/languages";
import { browserLanguage, uiStrings, type LanguageCode } from "@/lib/i18n";
import { fetchCatalog, fetchLanguageCodes, fetchMuseumNames, fetchMuseums, fetchWork, localizeMuseums } from "@/lib/catalogApi";
import { MuseumMap } from "./MuseumMap";
import { CollectionPage } from "./CollectionPage";
import { PaintingDetail } from "./PaintingDetail";
import { UserBar } from "./UserBar";
import { VisitsPage } from "./VisitsPage";
import { PreferencesPage } from "./PreferencesPage";
import { fetchPreferences, type Preferences } from "@/lib/preferences";
import { SignInGate } from "./SignInGate";
import { track } from "@/lib/analytics";
import { AuthProvider, useAuth } from "@/lib/auth";

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  // The museum is in the address: lazyguide.io/louvre.
  const pathname = usePathname();
  const museumId = useMemo(() => museumIdForSlug(pathname.split("/")[1] ?? "") ?? null, [pathname]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showVisits, setShowVisits] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  // undefined while loading; null once loaded with nothing saved (first login); "error" if the lookup failed.
  const [prefs, setPrefs] = useState<Preferences | null | "error" | undefined>(undefined);
  // What an earlier, incomplete save held (e.g. from before language was a setting), to prefill the form.
  const [draft, setDraft] = useState<Partial<Preferences> | null>(null);

  // The catalog lives in Postgres. Each of these is null until its fetch returns.
  const [museums, setMuseums] = useState<Museum[] | null>(null);
  const [offered, setOffered] = useState<LanguageCode[] | null>(null);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [work, setWork] = useState<Work | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  const [names, setNames] = useState<Awaited<ReturnType<typeof fetchMuseumNames>> | null>(null);

  // Language is a user-level setting; until it is saved, app-level text follows the browser's language.
  const uiLang: LanguageCode = prefs && prefs !== "error" ? prefs.language : browserLanguage();
  const ui = uiStrings[uiLang];
  const localized = useMemo(() => (museums ? localizeMuseums(museums, names) : null), [museums, names]);
  const museum = localized?.find((m) => m.id === museumId);

  // Language is a user-level setting. A museum that has no guides in it shows its first available language.
  const preferredLanguage: LanguageCode = prefs && prefs !== "error" ? prefs.language : "en";
  const languageCode: LanguageCode | null = offered
    ? offered.includes(preferredLanguage)
      ? preferredLanguage
      : (offered[0] ?? null)
    : null;
  const languageFallback = Boolean(offered && languageCode && languageCode !== preferredLanguage);

  useEffect(() => {
    if (user) track("app_open");
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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
    if (!user) return;
    let current = true;
    // Museum names in the visitor's language; the English names stay if this fails.
    fetchMuseumNames(uiLang).then(
      (n) => current && setNames(n),
      () => {},
    );
    return () => {
      current = false;
    };
  }, [user, uiLang]);

  useEffect(() => {
    if (!user) {
      setPrefs(undefined);
      return;
    }
    let current = true;
    fetchPreferences().then(
      (r) => {
        if (!current) return;
        setPrefs(r.prefs);
        setDraft(r.draft);
      },
      // The app stays usable without preferences; only personalised guides are unavailable.
      () => current && setPrefs("error"),
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

  // Whenever the museum changes (link, Back button), drop the previous museum's data.
  useEffect(() => {
    setSelectedId(null);
    setOffered(null);
    setCatalog(null);
    setWork(null);
  }, [museumId]);

  const reset = () => router.push("/");

  const chooseMuseum = (id: string) => {
    const slug = slugForMuseum(id);
    if (slug) router.push(`/${slug}`);
  };

  // Works found by an online search join the list in place, so the page needs no reload.
  const addWorks = (found: WorkSummary[]) =>
    setCatalog((c) => {
      if (!c) return c;
      const have = new Set(c.works.map((w) => w.id));
      return { ...c, works: [...c.works, ...found.filter((w) => !have.has(w.id))] };
    });

  const chooseWork =(id: string | null) => {
    setWork(null);
    setSelectedId(id);
  };

  if (loading) return null;
  if (!user) return <SignInGate />;

  if (loadFailed) {
    return (
      <main className="shell" lang={uiLang === "zh" ? "zh-Hans" : "en"}>
        <p className="muted">{ui.loadFailed}</p>
      </main>
    );
  }

  if (prefs === undefined) {
    return (
      <main className="shell" lang={uiLang === "zh" ? "zh-Hans" : "en"}>
        <p className="muted">{ui.loading}</p>
      </main>
    );
  }

  // First login: ask once, before anything else.
  if (prefs === null) {
    return <PreferencesPage initial={draft} onboarding onSaved={setPrefs} />;
  }

  if (showSettings) {
    return (
      <PreferencesPage
        initial={prefs === "error" ? null : prefs}
        onboarding={false}
        onSaved={(p) => {
          setPrefs(p);
          setShowSettings(false);
        }}
        onBack={() => setShowSettings(false)}
      />
    );
  }

  if (showVisits) {
    return (
      <VisitsPage
        language={uiLang}
        onBack={() => setShowVisits(false)}
        onSelectMuseum={(id) => {
          setShowVisits(false);
          chooseMuseum(id);
        }}
      />
    );
  }

  if (!museums) {
    return (
      <main className="shell" lang={uiLang === "zh" ? "zh-Hans" : "en"}>
        <p className="muted">{ui.loading}</p>
      </main>
    );
  }

  if (!museum) {
    return (
      <main className="map-shell" lang={uiLang === "zh" ? "zh-Hans" : "en"}>
        <header className="brand map-brand">
          <h1>Lazy Guide</h1>
          <p className="brand-tag">{ui.tagline}</p>
        </header>
        <UserBar language={uiLang} onShowVisits={() => setShowVisits(true)} onShowSettings={() => setShowSettings(true)} />
        <MuseumMap museums={localized ?? museums} language={uiLang} onSelect={chooseMuseum} />
        <p className="map-hint">{ui.mapHint}</p>
      </main>
    );
  }

  let content;
  if (offered?.length === 0) {
    content = (
      <>
        <button className="back" onClick={reset}>
          {ui.allMuseums}
        </button>
        <p className="muted">{ui.noGuidesYet}</p>
      </>
    );
  } else if (!languageCode || !catalog) {
    content = <p className="muted">{ui.loading}</p>;
  } else if (selectedId) {
    content = work ? (
      <PaintingDetail
        key={work.id}
        work={work}
        museumId={museum.id}
        language={catalog.language}
        textCredit={catalog.textCredit}
        preferences={prefs === "error" ? null : prefs}
        onChangePreferences={() => setShowSettings(true)}
        onBack={() => chooseWork(null)}
      />
    ) : (
      <p className="muted">{ui.loading}</p>
    );
  } else {
    content = <CollectionPage catalog={catalog} onSelect={chooseWork} onChangeMuseum={reset} onAddWorks={addWorks} />;
  }

  return (
    <main className="shell" lang={languageCode === "zh" ? "zh-Hans" : "en"}>
      <BackToTop label={ui.backToTop} />
      {languageFallback && languageCode && (
        <p className="notice" role="note">
          {ui.fallbackNotice(languages.find((l) => l.code === languageCode)?.label ?? "")}
        </p>
      )}
      {content}
    </main>
  );
}

/** Floating button that appears after scrolling down and returns to the top (where "back" lives). */
function BackToTop({ label }: { label: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (!show) return null;
  return (
    <button className="back-to-top" aria-label={label} title={label} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
      ↑
    </button>
  );
}

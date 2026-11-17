"use client";

import { useState } from "react";
import { getPaintingById } from "@/data/paintings";
import { CollectionPage } from "./CollectionPage";
import { PaintingDetail } from "./PaintingDetail";

export function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const painting = selectedId ? getPaintingById(selectedId) : undefined;

  return (
    <main className="shell">
      {painting ? (
        <PaintingDetail
          key={painting.id}
          painting={painting}
          onBack={() => setSelectedId(null)}
        />
      ) : (
        <CollectionPage onSelect={setSelectedId} />
      )}
    </main>
  );
}

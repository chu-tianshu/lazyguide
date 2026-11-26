import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { App } from "@/components/App";
import { museumIdForSlug, museumSlugs } from "@/data/museumSlugs";

type Props = { params: Promise<{ museum?: string[] }> };

export function generateStaticParams() {
  return [{ museum: [] }, ...Object.values(museumSlugs).map((s) => ({ museum: [s] }))];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = (await params).museum?.[0];
  if (!slug || !museumIdForSlug(slug)) return {};
  const title = slug.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
  return { title: `${title} · LazyGuide` };
}

export default async function Page({ params }: Props) {
  const segments = (await params).museum ?? [];
  if (segments.length === 0) return <App />;
  const id = segments.length === 1 ? museumIdForSlug(segments[0]) : undefined;
  if (!id) notFound();
  // /Louvre and /LOUVRE go to the canonical lowercase address.
  if (segments[0] !== museumSlugs[id]) redirect(`/${museumSlugs[id]}`);
  return <App />;
}

import type { Metadata } from "next";
import TierBoard from "@/components/TierBoard";
import TierUpdateBadge from "@/components/TierUpdateBadge";
import { isLang, t, type Lang } from "@/lib/i18n/site";
import { loadIndex, loadSnapshot, recentTierChanges } from "@/lib/tier/data";
import type { Snapshot } from "@/lib/tier/types";
import "../../tier.css";

export function generateStaticParams() {
  return [{ lang: "zh-CN" }, { lang: "en" }];
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang: raw } = await params;
  const lang: Lang = isLang(raw) ? raw : "zh-CN";
  return {
    title: t(lang, "ranking.metaTitle"),
    description: t(lang, "ranking.metaNote"),
    alternates: { canonical: `/${lang}/ranking`, languages: { "zh-CN": "/zh-CN/ranking", en: "/en/ranking" } },
  };
}

export default async function RankingPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  const lang: Lang = isLang(raw) ? raw : "zh-CN";
  const index = await loadIndex();
  const snaps = Object.fromEntries(
    await Promise.all(index.snapshots.map(async (entry) => [entry.as_of, await loadSnapshot(entry.file)])),
  ) as Record<string, Snapshot>;
  const changes = recentTierChanges(index, snaps);

  return (
    <>
      <section className="hero">
        <p className="hero-kicker">{t(lang, "ranking.kicker")}</p>
        <div className="hero-big">{t(lang, "ranking.title")}</div>
        <TierUpdateBadge lang={lang} changes={changes} />
      </section>
      <TierBoard lang={lang} />
    </>
  );
}

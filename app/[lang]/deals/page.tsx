import { Browse } from "@/components/Browse";
import { Heatmap } from "@/components/Heatmap";
import { t, isLang, type Lang } from "@/lib/i18n/site";
import { deals, stats } from "@/lib/data";

export function generateStaticParams() {
  return [{ lang: "zh-CN" }, { lang: "en" }];
}

export default async function DealsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  const lang: Lang = isLang(raw) ? raw : "zh-CN";
  const all = deals();
  const s = stats();
  const vendorCount = new Set(all.map((o) => o.vendor)).size;
  const typeCount = new Set(all.map((o) => o.promotionType).filter((type): type is string => !!type)).size;
  const newest = all.slice().sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))[0];
  const daysSince = newest
    ? Math.max(0, Math.floor((Date.now() - Date.parse(newest.publishedAt)) / 86_400_000))
    : null;

  return (
    <>
      <section className="hero">
        <p className="hero-kicker">{t(lang, "deals.hero.kicker")}</p>
        <div className="hero-big">
          {daysSince === 0 ? t(lang, "deals.hero.today") : t(lang, "deals.hero.daysAgo", { n: daysSince ?? "—" })}
        </div>
        <p className="hero-meta">
          {newest
            ? `${newest.vendor} · ${newest.publishedAt.replace("T", " ").slice(0, 16)} UTC`
            : t(lang, "deals.hero.none")}
        </p>
        {s.expiringIn72h > 0 && (
          <span className="hero-badge">{t(lang, "deals.hero.ending", { n: s.expiringIn72h })}</span>
        )}
      </section>

      <section className="stats">
        <div className="stat amber">
          <small>{t(lang, "deals.stat.live")}</small>
          <b>{s.deals}</b>
        </div>
        <div className="stat pink">
          <small>{t(lang, "deals.stat.vendors")}</small>
          <b>{vendorCount}</b>
        </div>
        <div className="stat blue">
          <small>{t(lang, "deals.stat.types")}</small>
          <b>{typeCount}</b>
        </div>
      </section>

      <Browse all={all} lang={lang} />

      <Heatmap lang={lang} />

      <p className="note">{t(lang, "deals.note")}</p>
      {lang === "en" && <p className="note">{t(lang, "detail.quoteNote")}</p>}
    </>
  );
}

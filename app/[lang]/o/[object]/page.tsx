import { notFound } from "next/navigation";
import { Browse } from "@/components/Browse";
import { t, isLang, type Lang } from "@/lib/i18n/site";
import { deals, OBJECT_ORDER, objectLabel } from "@/lib/data";

export function generateStaticParams() {
  return OBJECT_ORDER.map((object) => ({ object }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string; object: string }> }) {
  const { lang: raw, object } = await params;
  const lang: Lang = isLang(raw) ? raw : "zh-CN";
  return { title: t(lang, "object.metaTitle", { label: objectLabel(lang, object) }) };
}

export default async function ObjectPage({ params }: { params: Promise<{ lang: string; object: string }> }) {
  const { lang: raw, object } = await params;
  const lang: Lang = isLang(raw) ? raw : "zh-CN";
  if (!OBJECT_ORDER.includes(object)) notFound();
  const all = deals();

  return (
    <>
      <section className="hero">
        <p className="hero-kicker">{t(lang, "filters.object")}</p>
        <div className="hero-big">{objectLabel(lang, object)}</div>
        <p className="hero-meta">
          <a href={`/${lang}/deals`}>{t(lang, "detail.back")}</a> · {all.filter((o) => (o.appliesTo ?? []).includes(object)).length}
        </p>
      </section>

      <Browse all={all} lang={lang} object={object} />
    </>
  );
}

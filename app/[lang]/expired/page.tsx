import { expired, primarySourceUrl, publicWithdrawalReason } from "@/lib/data";
import { SourceLink } from "@/components/SourceLink";
import { t, isLang, type Lang } from "@/lib/i18n/site";

export function generateStaticParams() {
  return [{ lang: "zh-CN" }, { lang: "en" }];
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  const lang: Lang = isLang(raw) ? raw : "zh-CN";
  return { title: t(lang, "expired.title") + " · AIRadar" };
}

export default async function ExpiredPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  const lang: Lang = isLang(raw) ? raw : "zh-CN";
  const rows = expired();

  return (
    <>
      <section className="hero">
        <p className="hero-kicker">{t(lang, "expired.kicker")}</p>
        <div className="hero-big">{rows.length}</div>
        <p className="hero-meta">{t(lang, "expired.note")}</p>
      </section>

      {!rows.length && <p className="note">{t(lang, "expired.none")}</p>}
      {rows.map((o) => (
        <article className="card" key={o.offerKey}>
          <div className="card-head">
            <span className="vendor">{o.vendor}</span>
            <span className="flag ended">{o.withdrawn ? t(lang, "expired.withdrawn") : t(lang, "expired.eol")}</span>
            <SourceLink url={primarySourceUrl(o)} lang={lang} />
          </div>
          <dl className="rows">
            <dt>{t(lang, "expired.amount")}</dt>
            <dd>{o.amount ?? t(lang, "card.unknownSource")}</dd>
            <dt>{t(lang, "expired.reason")}</dt>
            <dd>
              {o.withdrawn
                ? `${publicWithdrawalReason(o.withdrawn.reason, lang)}${o.withdrawn.at ? `（${o.withdrawn.at.slice(0, 10)}）` : ""}`
                : t(lang, "expired.byExpiry", { at: o.expiresAtText ?? o.expiresAt ?? "—" })}
            </dd>
            <dt>{t(lang, "expired.record")}</dt>
            <dd>
              <a href={`/${lang}/p/${o.offerKey}`} rel="nofollow">
                {t(lang, "expired.open")}
              </a>
            </dd>
          </dl>
        </article>
      ))}

      <p className="note">
        {t(lang, "expired.footerNote")}
      </p>
    </>
  );
}

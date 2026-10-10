
import { notFound } from "next/navigation";
import { isLang, t, type Lang } from "@/lib/i18n/site";
import { ClaimButton } from "@/components/ClaimButton";
import {
  claimLabelLang,
  countdownText,
  deals,
  expired,
  findOffer,
  objectLabel,
  publicWithdrawalReason,
  typeLabel,
  urgency,
} from "@/lib/data";

export function generateStaticParams() {
  return [{ lang: "zh-CN" }, { lang: "en" }].flatMap((lang) =>
    [...deals(), ...expired()].map((o) => ({ lang: lang.lang, slug: o.offerKey })),
  );
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { slug, lang: raw } = await params;
  const lang: Lang = isLang(raw) ? raw : "zh-CN";
  const o = findOffer(slug);
  if (!o) return { title: "AIRadar" };
  const typeName = o.promotionType ? typeLabel(lang, o.promotionType) : lang === "en" ? "Deal" : "优惠";
  return {
    title: `${o.vendor} ${o.amount ?? typeName} · ${typeName} · AIRadar`,
    description: [
      o.amount && `${t(lang, "card.amount")}：${o.amount}`,
      o.baseline && `${t(lang, "card.baseline")}：${o.baseline}`,
      o.eligibility && `${t(lang, "card.eligibility")}：${o.eligibility}`,
      `${t(lang, "card.until")}：${o.expiresAtText ?? t(lang, "card.unknownSource")}`,
      lang === "en"
        ? "Sources and retrieval time are in the page body; official terms prevail."
        : "来源与获取时间见页面正文，条款以官方页面为准。",
    ].filter(Boolean).join(" ｜ "),
  };
}

export default async function DealPage({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { slug, lang: raw } = await params;
  const lang: Lang = isLang(raw) ? raw : "zh-CN";
  const o = findOffer(slug);
  if (!o) notFound();

  const typeName = o.promotionType ? typeLabel(lang, o.promotionType) : lang === "en" ? "Deal" : "优惠";
  const u = urgency(o.expiresAt);
  return (
    <>
      <p className="hero-kicker">
        <a href={`/${lang}/deals`}>{t(lang, "detail.back")}</a>
      </p>
      <section className="hero">
        <p className="hero-kicker">
          {o.vendor}
        </p>
        <div className="hero-big">{o.amount ?? t(lang, "card.unknownSource")}</div>
        {o.baseline && <p className="was">{t(lang, "card.baseline")}：{o.baseline}</p>}
        <p className="hero-meta">
          {typeName} ·{" "}
          {(o.appliesTo ?? []).map((a) => objectLabel(lang, a) ?? a).join(" / ") ||
            (lang === "en" ? "Target not stated" : "对象未说明")}
        </p>
        {u !== "normal" && (
          <span className="hero-badge">
            {u === "soon" ? `⏳ ${countdownText(lang, o.expiresAt)}` : t(lang, "urgency.ended")}
          </span>
        )}
      </section>

      {o.withdrawn && (
        <p className="note">
          {t(lang, "detail.withdrawn", {
            reason: publicWithdrawalReason(o.withdrawn.reason, lang),
            at: o.withdrawn.at ?? t(lang, "detail.withdrawnAt"),
          })}
        </p>
      )}

      <section className="stats">
        <div className="stat amber">
          <small>{t(lang, "card.eligibility")}</small>
          <b style={{ fontSize: 16 }}>{o.eligibility ?? t(lang, "card.unknownSource")}</b>
        </div>
        <div className="stat pink">
          <small>{t(lang, "card.until")}</small>
          <b style={{ fontSize: 16 }}>{o.expiresAtText ?? t(lang, "card.unknownSource")}</b>
        </div>
        <div className="stat blue">
          <small>{t(lang, "card.how")}</small>
          <b style={{ fontSize: 16 }}>{claimLabelLang(lang, o.howToClaim)}</b>
        </div>
      </section>

      {o.restrictions && <p className="note">{t(lang, "detail.restrictions", { r: o.restrictions })}</p>}

      <h2>{t(lang, "detail.quote")}</h2>
      {lang === "en" && <p className="note">{t(lang, "detail.quoteNote")}</p>}
      {o.facts.map((f, i) => (
        <blockquote className="quote" key={i}>
          {f.quote}
          <br />
          <a href={f.url} rel="noopener noreferrer nofollow" target="_blank">
            {t(lang, "detail.source", { n: i + 1 })}
          </a>
        </blockquote>
      ))}

      {!!o.corroboration?.length && (
        <>
          <h2>{t(lang, "detail.corroborate")}</h2>
          {o.corroboration.map((c, i) => (
            <blockquote className="quote" key={i}>
              {t(lang, "detail.corroborateRow", { quote: c.quote })}
            </blockquote>
          ))}
        </>
      )}

      {o.supersedes &&
        (findOffer(o.supersedes) ? (
          <p className="note">
            {t(lang, "detail.supersedes")}{" "}
            <a href={`/${lang}/p/${o.supersedes}`}>
              {t(lang, "detail.supersedesLink")}
            </a>
            。
          </p>
        ) : (
          <p className="note">{t(lang, "detail.supersedesHidden")}</p>
        ))}

      <p className="note">
        {t(lang, "detail.captured", {
          at: o.publishedAt.replace("T", " ").slice(0, 16),
        })}
      </p>
      <div className="card-actions">
        <a className="chip on" href={o.claimUrl ?? "#"} rel="noopener noreferrer nofollow" target="_blank">
          {t(lang, "claim.go")}
        </a>
        {!o.withdrawn && <ClaimButton offerKey={o.offerKey} />}
      </div>
    </>
  );
}

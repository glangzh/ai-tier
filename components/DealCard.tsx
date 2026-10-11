import Link from "next/link";
import { ClaimButton } from "@/components/ClaimButton";
import { SourceLink } from "@/components/SourceLink";
import { AllowanceRows } from "@/components/AllowanceRows";
import { t, type Lang } from "@/lib/i18n/site";
import { INTERACTIONS_ENABLED } from "@/lib/deployment";
import {
  claimLabelLang,
  countdownText,
  planLabelLang,
  primarySourceUrl,
  typeLabel,
  urgency,
  type Offer,
} from "@/lib/data";

export function DealCard({ o, lang }: { o: Offer; lang: Lang }) {
  const left = countdownText(lang, o.expiresAt);
  const u = urgency(o.expiresAt);
  const flag = left ?? t(lang, o.allowance ? "allowance.ongoing" : "urgency.unstated");
  const resetAt = o.occurredAt.includes("T")
    ? `${o.occurredAt.slice(0, 16).replace("T", " ")} UTC`
    : o.occurredAt;
  return (
    <article
      className="card"
      data-type={o.promotionType ?? "none"}
      data-qty={o.quantity?.value ?? ""}
    >
      <div className="card-head">
        <Link className="card-link vendor" href={`/${lang}/p/${o.offerKey}`}>
          {o.planName ?? o.vendor}
        </Link>
        {o.promotionType && (
          <span className={`type ${o.promotionType}`}>{typeLabel(lang, o.promotionType)}</span>
        )}
        {planLabelLang(lang, o.planKind) && <span className="plan">{planLabelLang(lang, o.planKind)}</span>}
        <span className={`flag ${u}`}>{flag}</span>
        <SourceLink url={primarySourceUrl(o)} lang={lang} />
      </div>
      <dl className={`rows${o.allowance ? " allowance-rows" : ""}`}>
        {o.allowance ? <AllowanceRows o={o} lang={lang} /> : o.promotionType === "reset" ? (
          <>
            <dt>{t(lang, "reset.rowTitle")}</dt>
            <dd>{resetAt} · {o.amount ?? t(lang, "card.unknownSource")}</dd>
          </>
        ) : (
          <>
            <dt>{t(lang, "card.amount")}</dt>
            <dd>{o.amount ?? t(lang, "card.unknownSource")}</dd>
            {o.baseline ? (
              <>
                <dt>{t(lang, "card.baseline")}</dt>
                <dd>{o.baseline}</dd>
              </>
            ) : null}
          </>
        )}
        {!o.allowance && <><dt>{t(lang, "card.eligibility")}</dt>
        <dd>{o.eligibility ?? t(lang, "card.unknownSource")}</dd></>}
        <dt>{t(lang, "card.until")}</dt>
        <dd>
          {o.expiresAtText ??
            (o.startsAtText ? t(lang, "detail.started", { at: o.startsAtText }) : t(lang, "card.noExpiry"))}
        </dd>
        <dt>{t(lang, "card.how")}</dt>
        <dd>{claimLabelLang(lang, o.howToClaim)}</dd>
      </dl>
      {INTERACTIONS_ENABLED && (
        <div className="card-actions">
          <ClaimButton offerKey={o.offerKey} />
        </div>
      )}
    </article>
  );
}

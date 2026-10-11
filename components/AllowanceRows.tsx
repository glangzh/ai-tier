import { t, type Lang } from "@/lib/i18n/site";
import type { Offer } from "@/lib/data";

export function AllowanceRows({ o, lang }: { o: Offer; lang: Lang }) {
  const a = o.allowance;
  if (!a) return null;
  const locale = lang === "en" ? "en" : "zh";
  const money = (value: number) => `$${value.toLocaleString("en-US")}${t(lang, "allowance.month")}`;
  return (
    <>
      <dt>{t(lang, "allowance.price")}</dt>
      <dd className="allowance-price">{money(a.price.value)}</dd>
      <dt>{t(lang, "allowance.models")}</dt>
      <dd className="allowance-models">
        {a.models.map((entry) => (
          <span className="allowance-model" key={entry.model}>
            <span>{entry.model}</span><b>{money(entry.value)}</b>
          </span>
        ))}
      </dd>
      {a.extraCredit && <><dt>{t(lang, "allowance.extra")}</dt><dd>{money(a.extraCredit.value)}</dd></>}
      <dt>{t(lang, "allowance.limits")}</dt>
      <dd className="allowance-copy">{a.limits[locale]}</dd>
      <dt>{t(lang, "allowance.basis")}</dt>
      <dd className="allowance-copy">{a.notes[locale]}</dd>
    </>
  );
}

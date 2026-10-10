import Link from "next/link";
import { DealCard } from "@/components/DealCard";
import { ListFilters, type TypeTab } from "@/components/ListFilters";
import { t, type Lang } from "@/lib/i18n/site";
import {
  countBy,
  groupByPlan,
  OBJECT_ORDER,
  objectLabel,
  sortForList,
  TYPE_ORDER,
  typeLabel,
  type Offer,
} from "@/lib/data";

/** 两级标签：一级对象走路由（可分享），二级类型在当前列表内即时筛选。 */
export function Browse({ all, lang, object }: { all: Offer[]; lang: Lang; object?: string | null }) {
  const objects = countBy(all, "appliesTo");
  const items = sortForList(object ? all.filter((o) => (o.appliesTo ?? []).includes(object)) : all);
  const typeCount = countBy(items, "promotionType");
  const tabs: TypeTab[] = TYPE_ORDER.filter(
    (x) => typeCount[x] || (object === "subscription" && x === "reset"),
  ).map((x) => ({
    type: x,
    label: typeLabel(lang, x),
    count: typeCount[x] ?? 0,
  }));
  const groups =
    object === "subscription"
      ? groupByPlan(items).map((g) => ({ kind: g.kind, label: g.label, items: g.items }))
      : [{ kind: "all", label: null as string | null, items }];

  return (
    <>
      <nav className="filters" aria-label={t(lang, "filters.objectAria")}>
        <span className="filter-label">{t(lang, "filters.object")}</span>
        <Link className={`chip${!object ? " on" : ""}`} href={`/${lang}/deals`}>
          {t(lang, "filters.objectAll")} <b>{all.length}</b>
        </Link>
        {OBJECT_ORDER.map((k) => (
          <Link key={k} className={`chip${object === k ? " on" : ""}`} href={`/${lang}/o/${k}`}>
            {objectLabel(lang, k)} <b>{objects[k] ?? 0}</b>
          </Link>
        ))}
      </nav>

      <ListFilters tabs={tabs} total={items.length} />

      {object === "subscription" && <p className="note">{t(lang, "sub.groupNote")}</p>}

      {groups.map((g) => (
        <section key={g.kind} data-group={g.kind}>
          {g.label && (
            <h2 className="group-title">
              {t(lang, `plan.${g.kind}` as never)} <b>{g.items.length}</b>
            </h2>
          )}
          {g.items.map((o) => (
            <DealCard key={o.offerKey} o={o} lang={lang} />
          ))}
        </section>
      ))}
      <p className="note" data-no-match style={{ display: "none" }}>
        {t(lang, "browse.empty")}
      </p>
    </>
  );
}

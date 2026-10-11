"use client";

import { useState } from "react";
import { useLang, useT } from "@/components/LangProvider";

export interface TypeTab {
  type: string;
  label: string;
  count: number;
}

const THRESHOLDS = [0, 100, 1_000, 10_000, 100_000, 1_000_000, 10_000_000];

/** 二级类型 + 额度阈值两把筛子，共同决定卡片可见性（与关系）。 */
export function ListFilters({ tabs, total }: { tabs: TypeTab[]; total: number }) {
  const lang = useLang();
  const tr = useT();
  const [type, setType] = useState<string | null>(null);
  const [min, setMin] = useState(0);

  const qtyLabel = (v: number) =>
    v === 0 ? tr("filters.qtyAll") : `≥ ${v.toLocaleString(lang === "en" ? "en-US" : "zh-CN")}`;

  const apply = (t: string | null, m: number) => {
    let shown = 0;
    for (const group of Array.from(document.querySelectorAll<HTMLElement>("[data-group]"))) {
      let any = false;
      let visibleCount = 0;
      for (const card of Array.from(group.querySelectorAll<HTMLElement>("[data-type]"))) {
        const qty = Number(card.dataset.qty || 0);
        const hide = (!!t && card.dataset.type !== t) || (m > 0 && !(qty >= m));
        card.style.display = hide ? "none" : "";
        if (!hide) {
          any = true;
          visibleCount += 1;
        }
      }
      group.style.display = any ? "" : "none";
      const count = group.querySelector<HTMLElement>(".group-title b");
      if (count) count.textContent = String(visibleCount);
      if (any) shown += 1;
    }
    const empty = document.querySelector<HTMLElement>("[data-no-match]");
    if (empty) empty.style.display = (t || m) && !shown ? "" : "none";
  };

  const pick = (t: string | null, m: number) => {
    // 美元计费用量不能沿用 Credits / Token 的数量阈值。
    if (t === "allowance") m = 0;
    setType(t);
    setMin(m);
    apply(t, m);
  };

  return (
    <>
      <nav className="filters" aria-label={tr("filters.typeAria")}>
        <span className="filter-label">{tr("filters.type")}</span>
        <button type="button" className={`chip${type === null ? " on" : ""}`} onClick={() => pick(null, min)}>
          {tr("filters.typeAll")} <b>{total}</b>
        </button>
        {tabs.map((t) => (
          <button
            key={t.type}
            type="button"
            className={`chip${type === t.type ? " on" : ""}`}
            onClick={() => pick(t.type, min)}
          >
            {t.label} <b>{t.count}</b>
          </button>
        ))}
      </nav>

      {type !== "allowance" && <nav className="filters" aria-label={tr("filters.qtyAria")}>
        <span className="filter-label">{tr("filters.qty")}</span>
        {THRESHOLDS.map((v) => (
          <button
            key={v}
            type="button"
            className={`chip${min === v ? " on" : ""}`}
            onClick={() => pick(type, v)}
          >
            {qtyLabel(v)}
          </button>
        ))}
        <span className="hint">{tr("filters.qtyHint")}</span>
      </nav>}
    </>
  );
}

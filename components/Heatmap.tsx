import { readFileSync } from "node:fs";
import { join } from "node:path";
import { t, type Lang } from "@/lib/i18n/site";

/** 一年热力图：按日格 × 周的 GitHub 式网格，数据来自 build-index 的 heat.json。 */
export function Heatmap({ lang }: { lang: Lang }) {
  const heat = Object.fromEntries(
    JSON.parse(readFileSync(join(process.cwd(), "data", "index", "heat.json"), "utf8")) as [
      string,
      number,
    ][],
  ) as Record<string, number>;

  const end = new Date();
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 370);
  start.setUTCDate(start.getUTCDate() - start.getUTCDay());

  const weeks: { day: string; n: number }[][] = [];
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const day = d.toISOString().slice(0, 10);
    const n = heat[day] ?? 0;
    if (!weeks.length || d.getUTCDay() === 0) weeks.push([]);
    weeks[weeks.length - 1].push({ day, n });
  }

  const level = (n: number) => (n === 0 ? 0 : n <= 2 ? 1 : n <= 5 ? 2 : 3);
  const total = Object.values(heat).reduce((a, b) => a + b, 0);

  return (
    <section className="heat">
      <h2 className="group-title">
        {t(lang, "heat.title")} <b>{total}</b>
      </h2>
      <div className="heat-grid" role="img" aria-label={t(lang, "heat.alt", { n: total })}>
        {weeks.map((w, i) => (
          <div className="heat-week" key={i}>
            {w.map((c) => (
              <span
                key={c.day}
                className={`heat-cell l${level(c.n)}`}
                title={t(lang, "heat.cell", { day: c.day, n: c.n })}
                aria-label={t(lang, "heat.cell", { day: c.day, n: c.n })}
              />
            ))}
          </div>
        ))}
      </div>
      <p className="heat-legend">
        <span className="heat-cell l0" /> {t(lang, "heat.legendNone")}
        <span className="heat-cell l1" /> 1–2
        <span className="heat-cell l2" /> 3–5
        <span className="heat-cell l3" /> 6+
        <small>{t(lang, "heat.legendNote")}</small>
      </p>
    </section>
  );
}

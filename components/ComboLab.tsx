"use client";

import { useMemo, useState } from "react";
import { useT } from "@/components/LangProvider";
import { comboData, composite, costIntelligenceFrontier, defaults, eligiblePairs, normalized,
  type Model, type Pair, type Settings, type SourceMode, type Structure } from "@/lib/combo/model";
import type { UIKey } from "@/lib/i18n/site";

const money = (value: number) => `$${value.toFixed(value < 1 ? 3 : 2)}`;
const one = (value: number | null) => value == null ? "—" : value.toFixed(1);
const RELATION: Record<Pair["relation"], UIKey> = {
  family: "combo.relationFamily", developer: "combo.relationDeveloper", cross: "combo.relationCross",
};

function Range({ label, value, min, max, onChange, unit = "" }: {
  label: string; value: number; min: number; max: number; unit?: string; onChange: (value: number) => void;
}) {
  return <label className="combo-range">
    <span><span>{label}</span><b>{value}{unit}</b></span>
    <input type="range" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} />
  </label>;
}

function pickModel(current: [string | null, string | null], id: string): [string | null, string | null] {
  const [decision, execution] = current;
  if (!decision || execution) return [id, null];
  return decision === id ? [null, null] : [decision, id];
}

export default function ComboLab() {
  const tr = useT();
  const [settings, setSettings] = useState<Settings>(defaults);
  const [selected, setSelected] = useState<[string | null, string | null]>([null, null]);
  const [sort, setSort] = useState<"score" | "intelligence" | "cost" | "speed" | "time">("score");
  const [ascending, setAscending] = useState(false);
  const models = comboData.models;
  const pairs = useMemo(() => eligiblePairs(settings), [settings]);
  const frontier = useMemo(costIntelligenceFrontier, []);
  const best = pairs[0];
  const selectedPair = pairs.find((pair) => pair.decision.id === selected[0] && pair.execution.id === selected[1]);
  const filteredPairs = pairs.filter((pair) => (!selected[0] || pair.decision.id === selected[0]) &&
    (!selected[1] || pair.execution.id === selected[1]));
  const patch = (next: Partial<Settings>) => setSettings((current) => ({ ...current, ...next }));
  const select = (id: string) => setSelected((current) => pickModel(current, id));

  const ranked = [...models].sort((a, b) => {
    const value = (m: Model) => sort === "score" ? composite(m, settings)
      : sort === "intelligence" ? m.intelligence
      : sort === "cost" ? m.costPerTaskUsd
      : sort === "speed" ? m.outputTokensPerSecond : m.endToEndSeconds;
    const av = value(a), bv = value(b);
    if (av == null) return bv == null ? 0 : 1;
    if (bv == null) return -1;
    return (av - bv) * (ascending ? 1 : -1);
  });
  const changeSort = (key: typeof sort) => {
    if (sort === key) setAscending(!ascending);
    else { setSort(key); setAscending(key === "cost" || key === "time"); }
  };

  const chartWidth = 920, chartHeight = 390;
  const xMin = Math.log10(Math.min(...models.map((m) => m.costPerTaskUsd))) - 0.15;
  const xMax = Math.log10(Math.max(...models.map((m) => m.costPerTaskUsd))) + 0.12;
  const iMin = Math.min(...models.map((m) => m.intelligence)) - 2;
  const iMax = Math.max(...models.map((m) => m.intelligence)) + 2;
  const x = (cost: number) => 54 + (Math.log10(cost) - xMin) / (xMax - xMin) * (chartWidth - 80);
  const y = (intelligence: number) => 20 + (iMax - intelligence) / (iMax - iMin) * (chartHeight - 62);
  const speedMax = Math.max(...models.flatMap((m) => m.outputTokensPerSecond == null ? [] : [m.outputTokensPerSecond]));
  const recommendation: [UIKey, Pair | undefined][] = [
    ["combo.lowCost", best],
    ["combo.lowLatency", [...pairs].filter((p) => p.seconds != null).sort((a, b) => (a.seconds ?? Infinity) - (b.seconds ?? Infinity))[0]],
    ["combo.highExecution", [...pairs].sort((a, b) => b.execution.intelligence - a.execution.intelligence || a.cost - b.cost)[0]],
    ["combo.highDecision", [...pairs].sort((a, b) => b.decision.intelligence - a.decision.intelligence || a.cost - b.cost)[0]],
  ];
  const ladder = models.filter((m) => ["astra", "sol", "glm", "grok"].includes(m.family))
    .sort((a, b) => a.family.localeCompare(b.family) || b.intelligence - a.intelligence);

  return <div className="combo-lab">
    <header className="combo-intro">
      <p className="hero-kicker">{tr("combo.kicker")}</p>
      <h1>{tr("combo.title")}</h1>
      <p>{tr("combo.intro")}</p>
      <div className="combo-provenance">
        <a href={comboData.source.url} target="_blank" rel="noopener noreferrer">{tr("combo.source")} · {comboData.source.name} ↗</a>
        <span>{tr("combo.asOf", { date: comboData.asOf })}</span>
        <span>{tr("combo.snapshot")}</span>
        {!!comboData.unavailableModels?.length && <span title={comboData.unavailableModels.map((m) => m.name).join(", ")}>{tr("combo.unavailable", { count: comboData.unavailableModels.length })}</span>}
      </div>
    </header>

    <div className="combo-layout">
      <aside className="combo-controls" aria-label={tr("combo.controls")}>
        <div className="combo-control-head"><span className="combo-stamp">R</span><div><b>{tr("combo.controls")}</b><small>ARTIFICIAL ANALYSIS · {comboData.asOf}</small></div></div>
        <div className="combo-control-group">
          <h2>{tr("combo.weights")} <small>{tr("combo.weightsHint")}</small></h2>
          <Range label={tr("combo.intelligence")} value={settings.intelligenceWeight} min={0} max={100} unit="%" onChange={(v) => patch({ intelligenceWeight: v })} />
          <Range label={tr("combo.cost")} value={settings.costWeight} min={0} max={100} unit="%" onChange={(v) => patch({ costWeight: v })} />
          <Range label={tr("combo.speed")} value={settings.speedWeight} min={0} max={100} unit="%" onChange={(v) => patch({ speedWeight: v })} />
        </div>
        <div className="combo-control-group">
          <h2>{tr("combo.sourceMode")}</h2>
          <div className="combo-segments">
            {(["any", "developer", "family"] as SourceMode[]).map((mode) => <button key={mode} type="button"
              aria-pressed={settings.sourceMode === mode} onClick={() => patch({ sourceMode: mode })}>{tr(`combo.${mode}` as UIKey)}</button>)}
          </div>
        </div>
        <div className="combo-control-group">
          <h2>{tr("combo.structure")}</h2>
          <div className="combo-segments">
            {(["split", "cascade"] as Structure[]).map((mode) => <button key={mode} type="button"
              aria-pressed={settings.structure === mode} onClick={() => patch({ structure: mode })}>{tr(`combo.${mode}` as UIKey)}</button>)}
          </div>
          {settings.structure === "split"
            ? <Range label={tr("combo.decisionShare")} value={settings.decisionShare} min={2} max={60} unit="%" onChange={(v) => patch({ decisionShare: v })} />
            : <Range label={tr("combo.escalationRate")} value={settings.escalationRate} min={0} max={60} unit="%" onChange={(v) => patch({ escalationRate: v })} />}
          <Range label={tr("combo.minGap")} value={settings.minGap} min={0} max={settings.maxGap} onChange={(v) => patch({ minGap: v })} />
          <Range label={tr("combo.maxGap")} value={settings.maxGap} min={Math.max(1, settings.minGap)} max={21} onChange={(v) => patch({ maxGap: v })} />
          <Range label={tr("combo.decisionFloor")} value={settings.decisionFloor} min={37} max={58} onChange={(v) => patch({ decisionFloor: v })} />
          <Range label={tr("combo.executionFloor")} value={settings.executionFloor} min={37} max={52} onChange={(v) => patch({ executionFloor: v })} />
        </div>
        <div className="combo-control-group">
          <h2>{tr("combo.selected")}</h2>
          <div className="combo-selection">
            <span>{models.find((m) => m.id === selected[0])?.name ?? tr("combo.selectDecision")}</span>
            <b>↓</b>
            <span>{models.find((m) => m.id === selected[1])?.name ?? tr("combo.selectExecution")}</span>
          </div>
          <p className="combo-small-note">{tr("combo.selectHint")}</p>
          {(selected[0] || selected[1]) && <button className="combo-text-button" type="button" onClick={() => setSelected([null, null])}>{tr("combo.clearSelection")}</button>}
          {selected[0] && selected[1] && <p className="combo-small-note">{selectedPair ? `${tr("combo.pairCost")}: ${money(selectedPair.cost)}` : tr("combo.noPairs")}</p>}
        </div>
        <button className="combo-reset" type="button" onClick={() => { setSettings(defaults); setSelected([null, null]); }}>{tr("combo.reset")}</button>
      </aside>

      <div className="combo-content">
        <div className="combo-hero" aria-live="polite">
          <p>{tr("combo.best")}</p>
          {best ? <>
            <strong>{money(best.cost)}</strong>
            <div className="combo-hero-pair"><span>{best.decision.name}</span><b>↓ {tr(RELATION[best.relation])}</b><span>{best.execution.name}</span></div>
            <small>{tr("combo.gap")} {best.gap} · {tr("combo.seconds")} {best.seconds == null ? tr("combo.unmeasured") : `${one(best.seconds)}s`}</small>
          </> : <div className="combo-empty">{tr("combo.noPairs")}</div>}
        </div>
        <div className="combo-kpis">
          <div><small>{tr("combo.models")}</small><b>{models.length}</b></div>
          <div><small>{tr("combo.developers")}</small><b>{new Set(models.map((m) => m.developer)).size}</b></div>
          <div><small>{tr("combo.open")}</small><b>{models.filter((m) => m.openWeights).length}</b></div>
          <div><small>{tr("combo.pairs")}</small><b>{pairs.length}</b></div>
        </div>

        <section className="combo-section">
          <div className="combo-section-head"><span>01</span><h2>{tr("combo.strategies")}</h2></div>
          <p className="combo-section-note">{tr("combo.strategiesNote")}</p>
          {pairs.length ? <div className="combo-recommendations">{recommendation.map(([label, pair]) => pair && <article key={label} className="combo-recommendation">
            <h3>{tr(label)}</h3><strong>{money(pair.cost)}</strong>
            <div><b>{pair.decision.name}</b><span>↓ {tr(RELATION[pair.relation])}</span><b>{pair.execution.name}</b></div>
            <footer>{tr("combo.gap")} {pair.gap} · {tr("combo.seconds")} {pair.seconds == null ? tr("combo.unmeasured") : `${one(pair.seconds)}s`}</footer>
          </article>)}</div> : <p className="combo-panel combo-empty">{tr("combo.noPairs")}</p>}
          <h3 className="combo-subhead">{tr("combo.pairs")}</h3>
          <p className="combo-section-note">{tr("combo.pairsNote")}</p>
          <div className="combo-panel combo-table-wrap"><table><thead><tr>
            <th>{tr("combo.decision")} → {tr("combo.execution")}</th><th>{tr("combo.sourceMode")}</th><th>{tr("combo.gap")}</th>
            <th>{tr("combo.pairCost")}</th><th>{tr("combo.seconds")}</th><th>{tr("combo.throughput")}</th>
          </tr></thead><tbody>{filteredPairs.map((pair) => <tr key={`${pair.decision.id}-${pair.execution.id}`}>
            <td><b>{pair.decision.name}</b><small>↳ {pair.execution.name}</small></td><td>{tr(RELATION[pair.relation])}</td>
            <td>{pair.gap}</td><td><b>{money(pair.cost)}</b></td><td>{pair.seconds == null ? "—" : `${one(pair.seconds)}s`}</td>
            <td>{pair.throughput == null ? "—" : `${Math.round(pair.throughput)} t/s`}</td>
          </tr>)}{filteredPairs.length === 0 && <tr><td colSpan={6}>{tr("combo.noPairs")}</td></tr>}</tbody></table></div>
        </section>

        <section className="combo-section">
          <div className="combo-section-head"><span>02</span><h2>{tr("combo.chartTitle")}</h2></div>
          <p className="combo-section-note">{tr("combo.chartNote")}</p>
          <div className="combo-panel combo-chart-wrap">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="group" aria-label={tr("combo.chartTitle")}>
              {[40, 45, 50, 55].map((v) => <g key={v}><line className="combo-gridline" x1="54" x2="894" y1={y(v)} y2={y(v)} /><text x="46" y={y(v) + 4} textAnchor="end">{v}</text></g>)}
              {[0.1, 0.25, 0.5, 1, 2, 5].map((v) => <g key={v}><line className="combo-gridline" x1={x(v)} x2={x(v)} y1="20" y2="348" /><text x={x(v)} y="367" textAnchor="middle">${v}</text></g>)}
              <polyline className="combo-frontier" points={frontier.map((m) => `${x(m.costPerTaskUsd)},${y(m.intelligence)}`).join(" ")} />
              {models.map((m) => {
                const cx = x(m.costPerTaskUsd), cy = y(m.intelligence);
                const active = selected.includes(m.id);
                return <g key={m.id} tabIndex={0} role="button" aria-label={`${m.name}: ${tr("combo.intelligence")} ${m.intelligence}, ${tr("combo.costPerTask")} ${money(m.costPerTaskUsd)}`}
                  onClick={() => select(m.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); select(m.id); } }}>
                  <circle className={`combo-dot${active ? " active" : ""}${m.openWeights ? " open" : ""}`} cx={cx} cy={cy}
                    r={m.outputTokensPerSecond == null ? 7 : 6 + Math.sqrt(m.outputTokensPerSecond / speedMax) * 12} />
                  <title>{m.name} · I {m.intelligence} · {money(m.costPerTaskUsd)} · {m.outputTokensPerSecond ?? tr("combo.unmeasured")} t/s</title>
                </g>;
              })}
            </svg>
            <p className="combo-chart-legend"><span className="combo-line-key" />{tr("combo.chartFrontier")} <span className="combo-open-key" />{tr("combo.open")}</p>
          </div>
        </section>

        <section className="combo-section">
          <div className="combo-section-head"><span>03</span><h2>{tr("combo.tableTitle")}</h2></div>
          <p className="combo-section-note">{tr("combo.tableNote")}</p>
          <div className="combo-panel combo-table-wrap"><table><thead><tr>
            <th>{tr("combo.models")}</th>
            {([ ["intelligence", "combo.intelligence"], ["cost", "combo.costPerTask"], ["speed", "combo.speed"], ["time", "combo.e2e"], ["score", "combo.composite"] ] as [typeof sort, UIKey][]).map(([key, label]) =>
              <th key={key} aria-sort={sort === key ? (ascending ? "ascending" : "descending") : undefined}><button type="button" onClick={() => changeSort(key)}>{tr(label)} {sort === key ? (ascending ? "↑" : "↓") : ""}</button></th>)}
          </tr></thead><tbody>{ranked.map((m) => {
            const score = composite(m, settings);
            return <tr key={m.id} className={selected.includes(m.id) ? "selected" : undefined}>
              <td><button className="combo-model-button" type="button" onClick={() => select(m.id)}>{m.name}</button><small>{m.developer} · {m.openWeights ? tr("combo.open") : m.family}</small></td>
              <td>{m.intelligence}</td><td>{money(m.costPerTaskUsd)}</td><td>{m.outputTokensPerSecond ?? "—"}</td>
              <td>{m.endToEndSeconds == null ? "—" : `${one(m.endToEndSeconds)}s`}</td>
              <td><b>{score == null ? "—" : one(score)}</b><small>{Object.values(normalized(m)).map((v) => v == null ? "—" : Math.round(v)).join(" / ")}</small></td>
            </tr>;
          })}</tbody></table></div>
        </section>

        <section className="combo-section">
          <div className="combo-section-head"><span>04</span><h2>{tr("combo.methodTitle")}</h2></div>
          <div className="combo-panel combo-method">
            <p>{tr("combo.methodCost")}</p><p>{tr("combo.methodSplit")}</p><p>{tr("combo.methodCascade")}</p>
            <p>{tr("combo.methodLimits")}</p>
          </div>
          <h3 className="combo-subhead">{tr("combo.ladderTitle")}</h3>
          <p className="combo-section-note">{tr("combo.ladderNote")}</p>
          <div className="combo-panel combo-table-wrap"><table><thead><tr><th>{tr("combo.familyLabel")} / {tr("combo.models")}</th>
            <th>{tr("combo.intelligence")}</th><th>{tr("combo.costPerTask")}</th><th>{tr("combo.speed")}</th>
            <th>{tr("combo.ttft")}</th><th>{tr("combo.e2e")}</th><th>{tr("combo.inputOutputPrice")}</th>
          </tr></thead><tbody>{ladder.map((m) => <tr key={m.id}><td><b>{m.name}</b><small>{m.family}</small></td>
            <td>{m.intelligence}</td><td>{money(m.costPerTaskUsd)}</td><td>{m.outputTokensPerSecond ?? "—"}</td>
            <td>{m.timeToFirstTokenSeconds == null ? "—" : `${one(m.timeToFirstTokenSeconds)}s`}</td>
            <td>{m.endToEndSeconds == null ? "—" : `${one(m.endToEndSeconds)}s`}</td>
            <td>${m.inputUsdPerMillion} / ${m.outputUsdPerMillion}</td></tr>)}</tbody></table></div>
        </section>
      </div>
    </div>
  </div>;
}

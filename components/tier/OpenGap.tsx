import { useState } from 'react'
import packData from '@data/tier/open-gap.json'
import { availabilityDate, openGapView, type FrontierPoint, type OpenGapPack } from '@/lib/tier/open-gap'
import type { Snapshot } from '@/lib/tier/types'
import { useT } from '@/lib/tier/i18n'
import { useBoxWidth } from './chart'

const pack = packData as OpenGapPack
const atDate = (curve: FrontierPoint[], date: string) => curve.filter((p) => p.date <= date).at(-1)
const timestamp = (date: string) => Date.parse(`${date}T00:00:00Z`)

export default function OpenGap({ snap }: { snap: Snapshot }) {
  const t = useT()
  const [chartRef, chartWidth] = useBoxWidth<HTMLDivElement>()
  const view = openGapView(pack, snap)
  const [selected, setSelected] = useState<string>(snap.as_of)
  if (!view) return <section className="block card empty-panel"><h2>{t('nav.openGap')}</h2><p>{t('openGap.empty', { date: pack.as_of })}</p></section>

  const { closed, open, closedCurve, openCurve, rows, scoreGap } = view
  const start = [closedCurve[0].date, openCurve[0].date].sort().at(-1)!
  const dates = [...new Set([start, ...closedCurve.map((p) => p.date), ...openCurve.map((p) => p.date), snap.as_of])]
    .filter((date) => date >= start).sort()
  const date = dates.includes(selected) ? selected : dates[dates.length - 1]
  const activeClosed = atDate(closedCurve, date)!, activeOpen = atDate(openCurve, date)!
  const maxScore = Math.ceil(Math.max(closed.score, open.score) / 10) * 10
  const minScore = Math.max(0, Math.floor(Math.min(atDate(closedCurve, start)!.score, openCurve[0].score) / 10) * 10 - 10)
  const W = Math.max(240, chartWidth || 820), H = W < 500 ? 240 : 300, left = 36, right = 30, top = 24, bottom = 42
  const x = (date: string) => left + (timestamp(date) - timestamp(start)) / Math.max(86400000, timestamp(snap.as_of) - timestamp(start)) * (W - left - right)
  const y = (score: number) => top + (maxScore - score) / (maxScore - minScore) * (H - top - bottom)
  const path = (curve: FrontierPoint[]) => {
    const first = atDate(curve, start)!
    return `M${x(start)} ${y(first.score)} ` + curve.filter((p) => p.date > start)
      .map((p) => `H${x(p.date)} V${y(p.score)}`).join(' ') + ` H${x(snap.as_of)}`
  }
  const tickCount = W < 500 ? 3 : 4
  const ticks = Array.from({ length: tickCount }, (_, i) => new Date(timestamp(start) + (timestamp(snap.as_of) - timestamp(start)) * i / (tickCount - 1)).toISOString().slice(0, 10))
  const leader = rows.find((r) => r.model === open.model)!

  return <section className="block card open-gap">
    <div className="open-gap-heading"><div><h2>{t('nav.openGap')}</h2><p className="company-lead">{t('openGap.lead')}</p></div><span className="open-gap-meta">{t('openGap.scope', { benchmark: snap.benchmark, date: snap.as_of })}</span></div>
    <div className="open-gap-summary">
      <div className="open-gap-stat closed"><span>{t('openGap.closed')}</span><strong>{closed.score}<small>{t('openGap.points')}</small></strong><a href={pack.models.find((m) => m.model === closed.model)!.source} target="_blank" rel="noreferrer">{closed.model}</a></div>
      <div className="open-gap-stat open"><span>{t('openGap.open')}</span><strong>{open.score}<small>{t('openGap.points')}</small></strong><a href={leader.source} target="_blank" rel="noreferrer">{open.model}</a></div>
      <div className="open-gap-stat"><span>{t('openGap.delta')}</span><strong>{scoreGap}<small>{t('openGap.points')}</small></strong><span>{t('openGap.deltaHint')}</span></div>
      <div className="open-gap-stat"><span>{t('openGap.time')}</span><strong>{leader.gap_days ?? '—'}<small>{leader.gap_days !== null && t('openGap.days')}</small></strong><span>{leader.gap_days !== null ? t('openGap.breakdown', { pacing: leader.pacing_days!, capability: leader.capability_days! }) : t('openGap.unavailable')}</span></div>
    </div>

    <div className="open-gap-chart-head"><h3>{t('openGap.chart')}</h3><div className="open-gap-legend"><span className="closed">{t('openGap.closed')}</span><span className="open">{t('openGap.open')}</span></div></div>
    <div className="open-gap-chart-scroll" ref={chartRef}>
      <svg className="open-gap-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t('openGap.chart')}>
        <title>{t('openGap.chart')}</title><desc>{t('openGap.chartHint')}</desc>
        {Array.from({ length: (maxScore - minScore) / 10 + 1 }, (_, i) => minScore + i * 10).map((score) => <g key={score}><line x1={left} x2={W - right} y1={y(score)} y2={y(score)} stroke="var(--line-soft)" strokeDasharray="3 5" /><text x={left - 10} y={y(score) + 4} textAnchor="end" className="ax">{score}</text></g>)}
        {ticks.map((d, i) => <text key={d} x={x(d)} y={H - 12} textAnchor={i === 0 ? 'start' : i === tickCount - 1 ? 'end' : 'middle'} className="ax">{d.slice(5)}</text>)}
        {[{ curve: closedCurve, color: 'var(--amber)' }, { curve: openCurve, color: 'var(--blue)' }].map(({ curve, color }) => <g key={color}>
          <path d={path(curve)} stroke={color} strokeWidth="2.5" fill="none" />
          {curve.filter((p) => p.date >= start).map((p) => <circle key={`${p.date}-${p.model}`} cx={x(p.date)} cy={y(p.score)} r="4" fill="var(--paper)" stroke={color} strokeWidth="2"><title>{p.date} · {p.model} · {p.score}</title></circle>)}
          <text x={W - right + 8} y={y(curve.at(-1)!.score) + 4} fill={color} className="ax">{curve.at(-1)!.score}</text>
        </g>)}
        <line x1={x(date)} x2={x(date)} y1={top} y2={H - bottom} stroke="var(--line-strong)" strokeDasharray="4 4" />
        <circle cx={x(date)} cy={y(activeClosed.score)} r="5" fill="var(--amber)" /><circle cx={x(date)} cy={y(activeOpen.score)} r="5" fill="var(--blue)" />
      </svg>
    </div>
    <div className="open-gap-scrubber">
      <label htmlFor="open-gap-date">{t('openGap.scrub')}</label>
      <input id="open-gap-date" type="range" min="0" max={dates.length - 1} value={dates.indexOf(date)} onChange={(e) => setSelected(dates[Number(e.target.value)])} aria-valuetext={date} />
      <output htmlFor="open-gap-date" aria-live="polite"><b>{t('openGap.node', { date, gap: activeClosed.score - activeOpen.score })}</b><span>{activeClosed.model} {activeClosed.score} ↔ {activeOpen.model} {activeOpen.score}</span></output>
    </div>
    <p className="hint">{t('openGap.chartHint')}</p>
    <p className="hint">{t('openGap.bound')}</p>

    <h3 className="open-gap-table-title">{t('openGap.ranking')}</h3>
    <div className="scroll"><table className="company-table open-gap-table"><thead><tr><th>{t('openGap.model')}</th><th>{t('openGap.score')}</th><th>{t('openGap.gap')}</th><th>{t('openGap.equivalent')}</th><th>{t('openGap.availability')}</th><th>{t('openGap.license')}</th></tr></thead><tbody>
      {rows.map((r) => <tr key={r.id}><td><b>{r.model}</b><span className="company-equivalent">{t(`co.${r.company_id}`)}</span></td><td className="num">{r.score}</td><td className="num">{r.score_gap}</td><td>{r.gap_days === null ? t('openGap.unavailable') : `${r.gap_days} ${t('openGap.days')}`}{r.extrapolated && <span className="tag">{t('openGap.extrapolated')}</span>}<span className="company-equivalent">{r.equivalent_date ?? '—'}</span></td><td><a href={r.availability_source} target="_blank" rel="noreferrer">{r.available_at ?? t('openGap.by', { date: r.available_by })}</a></td><td><a href={r.source} target="_blank" rel="noreferrer">{r.license}</a></td></tr>)}
    </tbody></table></div>
    <div className="open-gap-method"><h3>{t('openGap.method')}</h3><p>{t('openGap.definition', { open: rows.length, closed: pack.models.filter((m) => m.access === 'closed').length })}</p><p>{t('openGap.lagMethod')}</p><p>{t('openGap.coverage')}</p>
      <details><summary>{t('openGap.reference')}</summary><ul>{pack.models.filter((m) => m.access === 'closed').sort((a, b) => availabilityDate(a).localeCompare(availabilityDate(b))).map((m) => <li key={m.id}><a href={m.source} target="_blank" rel="noreferrer">{m.model}</a> · {availabilityDate(m)} · {m.score} {t('openGap.points')}</li>)}</ul></details>
    </div>
  </section>
}

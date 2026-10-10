import { EventStream, Index, Snapshot } from '@/lib/tier/types'

import { tierVar } from './DBar'
import { companyName, t, useT } from '@/lib/tier/i18n'

export default function Trend({
  index,
  snaps,
  eventStream,
}: {
  index: Index
  snaps: Record<string, Snapshot>
  eventStream: EventStream | null
}) {
  const t = useT()
  // 按 as_of 升序排列，保证 x 轴是时间顺序
  const order = [...index.snapshots].sort((a, b) => a.as_of.localeCompare(b.as_of))
  const xIndex = new Map(order.map((s, i) => [s.as_of, i]))

  const byName: Record<
    string,
    { as_of: string; d: number; tier: string; companyId: string; benchmark: string }[]
  > = {}
  for (const s of order) {
    const snap = snaps[s.as_of]
    if (!snap) continue
    for (const r of snap.rows) {
      ;(byName[r.name] ||= []).push({
        as_of: s.as_of,
        d: r.d,
        tier: r.tier,
        companyId: r.company_id ?? r.name,
        benchmark: s.benchmark,
      })
    }
  }
  const series = Object.entries(byName).filter(([, pts]) => pts.length >= 2)

  // 口径隔离（INT-06）：相邻两点若不在同一 AAII 版本，**不得连成趋势线**。
  // 不同版本分数不可比，连起来等于把口径变更读成能力变化。
  // 做法：按基准版本把每条序列切成若干段，每段单独画；跨版本处只留点，不画线。
  const segmentsOf = (pts: typeof series[number][1]) => {
    const segs: (typeof pts)[] = []
    for (const p of pts) {
      const last = segs[segs.length - 1]
      if (last && last[last.length - 1].benchmark === p.benchmark) last.push(p)
      else segs.push([p])
    }
    return segs
  }
  // 全局口径数：>1 说明这份历史里混了版本，需要在提示里点明
  const benchmarks = order
    .map((s) => snaps[s.as_of]?.benchmark)
    .filter((b): b is string => Boolean(b))
  const benchList = [...new Set(benchmarks)]

  // 事件标注（EXT-04）：把「曲线上的变动」拆成模型发布与评测版本变更两类。
  // 事件流按日期连续，而横轴是快照日期（离散），故把事件归到「其后最近的一期快照」，
  // 让标注贴在对应的日期刻度下——不是新增一条数据线。
  const eventsBySnap: Record<string, { d: number; b: number }> = {}
  for (const s of order) eventsBySnap[s.as_of] = { d: 0, b: 0 }
  for (const e of eventStream?.events ?? []) {
    const idx = order.findIndex((s) => s.as_of >= e.date)
    const slot = idx >= 0 ? order[idx].as_of : null
    if (!slot) continue
    if (e.type === 'model_release') eventsBySnap[slot].d += 1
    else if (e.type === 'benchmark_upgrade') eventsBySnap[slot].b += 1
  }
  // 口径变更对照：同一模型换版本 = 分数整体平移，与能力变化是两回事。
  // 用后端压好的「每家一行」结构，而不是把 22 条原始事件平铺出来。
  const benchMoves = eventStream?.benchmark_moves ?? []

  const W = 780
  const H = 400
  const padL = 52
  const padR = 140
  const padT = 18
  // 58 而非 40：底部要放日期轴、事件记号行、图例三层，40 会挤在一起
  const padB = 58
  const xs = order.map((s) => s.as_of)
  const maxD = Math.max(1, ...series.flatMap(([, pts]) => pts.map((p) => p.d)))
  const xAt = (asOf: string) => {
    const i = xIndex.get(asOf) ?? 0
    return padL + (xs.length <= 1 ? 0 : (i / (xs.length - 1)) * (W - padL - padR))
  }
  const yAt = (d: number) => padT + (d / maxD) * (H - padT - padB)

  // 每条线末端标签做纵向防重叠：按 y 排序后强制最小间距，超出底部整体上移
  const labels = series.map(([name, pts]) => {
    const last = pts[pts.length - 1]
    const ey = yAt(last.d)
    return { name, companyId: last.companyId, ey, y: ey, color: tierVar(last.tier) }
  })
  labels.sort((a, b) => a.y - b.y)
  const MIN_GAP = 15
  for (let i = 1; i < labels.length; i++) {
    if (labels[i].y - labels[i - 1].y < MIN_GAP) {
      labels[i].y = labels[i - 1].y + MIN_GAP
    }
  }
  const overflow = labels.length ? labels[labels.length - 1].y - (H - padB) : 0
  if (overflow > 0) for (const l of labels) l.y -= overflow

  return (
    <section className="block card">
      <h2>{t('nav.trend')}</h2>
      <svg viewBox={`0 0 ${W} ${H}`} className="trend" width="100%">
        <text x={4} y={12} className="ax" textAnchor="start">
          {t('trend.axisY')}
        </text>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const d = Math.round(maxD * t)
          const yy = yAt(d)
          return (
            <g key={t}>
              <line x1={padL} y1={yy} x2={W - padR} y2={yy} className="grid" />
              <text x={padL - 8} y={yy + 4} className="ax" textAnchor="end">
                {d}
              </text>
            </g>
          )
        })}
        {xs.map((xv) => (
          <text key={xv} x={xAt(xv)} y={H - padB + 20} className="ax" textAnchor="middle">
            {xv.slice(5)}
          </text>
        ))}
        {/* 事件标注（EXT-04）：贴在日期轴下方，是时间刻度上的记号，不是新增数据线。
            方块 = 该期间有模型发布，三角 = 有评测版本变更；两者都为 0 则不画。 */}
        {xs.map((xv) => {
          const c = eventsBySnap[xv]
          if (!c || (!c.d && !c.b)) return null
          const cx = xAt(xv)
          const y = H - padB + 29
          return (
            <g key={`ev-${xv}`}>
              {c.d > 0 && (
                <>
                  <rect x={cx - 4} y={y - 3.5} width={7} height={7} className="trend-ev-release" />
                  <text x={cx - 7} y={y + 4} className="ax" textAnchor="end">
                    {c.d}
                  </text>
                </>
              )}
              {c.b > 0 && (
                <>
                  <path d={`M${cx + 4} ${y - 4.5} L${cx + 10} ${y + 4} L${cx - 2} ${y + 4} Z`}
                        className="trend-ev-bench" />
                  <text x={cx + 13} y={y + 4} className="ax" textAnchor="start">
                    {c.b}
                  </text>
                </>
              )}
            </g>
          )
        })}
        <text x={padL} y={H - 3} className="ax" textAnchor="start">
          {t('trend.evLegend')}
        </text>
        {series.map(([name, pts]) => {
          const last = pts[pts.length - 1]
          const segs = segmentsOf(pts)
          return (
            <g key={name}>
              {/* 段内连线；段外（跨版本）不连——见上方 segmentsOf 说明 */}
              {segs.map((seg, si) => (
                <path
                  key={`s${si}`}
                  d={seg
                    .map((p, i) => `${i === 0 ? 'M' : 'L'}${xAt(p.as_of)} ${yAt(p.d)}`)
                    .join(' ')}
                  fill="none"
                  stroke={tierVar(last.tier)}
                  strokeWidth={1.5}
                />
              ))}
              {pts.map((p, i) => (
                <circle
                  key={i}
                  cx={xAt(p.as_of)}
                  cy={yAt(p.d)}
                  r={2.5}
                  fill={tierVar(p.tier)}
                />
              ))}
            </g>
          )
        })}
        {/* 末端标签放右侧留白列，带虚线连接到真实数据点，避免重叠误读 */}
        {labels.map((l) => (
          <g key={l.name}>
            <line
              x1={W - padR}
              y1={l.ey}
              x2={W - padR + 6}
              y2={l.y}
              stroke={l.color}
              strokeWidth={0.6}
              strokeDasharray="2 2"
              opacity={0.5}
            />
            <circle cx={W - padR + 6} cy={l.y} r={2.5} fill={l.color} />
            <text x={W - padR + 12} y={l.y + 3.5} className="ax">
              {companyName(l.name, l.companyId)}
            </text>
          </g>
        ))}
      </svg>
      {/* 可信度与口径标注（INT-06）：样本数、时间范围、口径是否混版本 */}
      <p className="hint">{t('trend.hint')}</p>
      <p className="hint">
        {t('trend.credibility', {
          n: order.length,
          from: order[0]?.as_of ?? '',
          to: order[order.length - 1]?.as_of ?? '',
          companies: series.length,
        })}
      </p>
      {benchList.length > 1 && (
        <p className="hint">
          {t('trend.benchmarkMix', { list: benchList.join(' / ') })}
        </p>
      )}

      {/* 口径变更清单（EXT-04）：这些变动让同一模型的分数整体平移，
          与「模型变强/变弱」是两回事，所以单列出来而不是并进趋势线。 */}
      {benchMoves.length > 0 && (
        <>
          <p className="hint">{t('trend.benchChanges')}</p>
          <ul className="trend-bench-list">
            {benchMoves.map((m) => (
              <li key={`${m.company_id}-${m.model}-${m.date}`}>
                <span className="trend-bench-company">{m.company}</span>
                <span className="muted">{m.model}</span>
                <span className="num">
                  {t('trend.benchShift', {
                    from: m.from_benchmark,
                    to: m.to_benchmark,
                  })}
                </span>
                <span className="num">
                  {m.from_score} → {m.to_score}
                  {m.delta !== null && `（${m.delta > 0 ? '+' : ''}${m.delta}）`}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

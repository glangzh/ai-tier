import { Index, Snapshot } from '../types'

import { tierVar } from './DBar'
import { companyName, t, useT } from '../i18n'

export default function Trend({
  index,
  snaps,
}: {
  index: Index
  snaps: Record<string, Snapshot>
}) {
  const t = useT()
  // 按 as_of 升序排列，保证 x 轴是时间顺序
  const order = [...index.snapshots].sort((a, b) => a.as_of.localeCompare(b.as_of))
  const xIndex = new Map(order.map((s, i) => [s.as_of, i]))

  const byName: Record<string, { as_of: string; d: number; tier: string; companyId: string }[]> = {}
  for (const s of order) {
    const snap = snaps[s.as_of]
    if (!snap) continue
    for (const r of snap.rows) {
      ;(byName[r.name] ||= []).push({
        as_of: s.as_of,
        d: r.d,
        tier: r.tier,
        companyId: r.company_id ?? r.name,
      })
    }
  }
  const series = Object.entries(byName).filter(([, pts]) => pts.length >= 2)

  const W = 780
  const H = 400
  const padL = 52
  const padR = 140
  const padT = 18
  const padB = 40
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
        {series.map(([name, pts]) => {
          const path = pts
            .map((p, i) => `${i === 0 ? 'M' : 'L'}${xAt(p.as_of)} ${yAt(p.d)}`)
            .join(' ')
          const last = pts[pts.length - 1]
          return (
            <g key={name}>
              <path
                d={path}
                fill="none"
                stroke={tierVar(last.tier)}
                strokeWidth={1.5}
              />
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
      <p className="hint">{t('trend.hint')}</p>
    </section>
  )
}

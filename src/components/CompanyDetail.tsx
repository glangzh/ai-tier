import { Snapshot, Row, CompanyReference } from '../types'
import { tierVar } from './DBar'
import { companyName, t, useT } from '../i18n'

/** 曲线上的一个点：分数 + 日期 */
interface Pt {
  model: string
  score: number
  date: string
  estimated?: boolean
}

/** 简易碰撞检测：把每个文字框当作矩形，逐个与已放置的矩形比对。 */
type Box = { x1: number; y1: number; x2: number; y2: number }
const overlaps = (a: Box, b: Box) =>
  a.x1 < b.x2 && a.x2 > b.x1 && a.y1 < b.y2 && a.y2 > b.y1

/** 中文按字宽、ASCII 按半宽估算像素宽度，用于占位计算。 */
const textWidth = (t: string) =>
  [...t].reduce((w, ch) => w + (ch.charCodeAt(0) > 0x2e80 ? 11 : 6.2), 0)

function placeLabel(
  text: string,
  px: number,
  py: number,
  used: Box[],
  bounds: { W: number; H: number; padL: number; padR: number; padT: number; padB: number },
) {
  const w = textWidth(text)
  const h = 13
  const cands = [
    { anchor: 'middle' as const, lx: px, ly: py - 10 },
    { anchor: 'middle' as const, lx: px, ly: py + 17 },
    { anchor: 'start' as const, lx: px + 9, ly: py + 4 },
    { anchor: 'end' as const, lx: px - 9, ly: py + 4 },
    { anchor: 'middle' as const, lx: px, ly: py - 26 },
    { anchor: 'middle' as const, lx: px, ly: py + 33 },
  ]
  for (const c of cands) {
    const x1 = c.anchor === 'middle' ? c.lx - w / 2 : c.anchor === 'start' ? c.lx : c.lx - w
    const box: Box = { x1, y1: c.ly - h + 3, x2: x1 + w, y2: c.ly + 3 }
    const inside =
      box.x1 >= bounds.padL - 6 &&
      box.x2 <= bounds.W - bounds.padR + 6 &&
      box.y1 >= bounds.padT - 6 &&
      box.y2 <= bounds.H - bounds.padB + 2
    if (!inside) continue
    if (used.some((u) => overlaps(u, box))) continue
    used.push(box)
    return c
  }
  return null
}

function days(a: string, b: string) {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86400000)
}

/** 公司能力曲线：自家历史模型 + 前沿模型曲线作参照 */
function CurveChart({ company, frontier }: { company: Pt[]; frontier: Pt[] }) {
  const W = 760
  const H = 320
  const padL = 44
  const padR = 40
  const padT = 16
  const padB = 44

  // 横轴用「自家点 + 前沿点」的共同时间范围，避免两家公司的两个点被拉满整幅宽度
  const all = [...company, ...frontier]
  const t0 = Math.min(...all.map((p) => Date.parse(p.date)))
  const t1 = Math.max(...all.map((p) => Date.parse(p.date)))
  const sMin = Math.min(...all.map((p) => p.score))
  const sMax = Math.max(...all.map((p) => p.score))
  const pad = (sMax - sMin) * 0.12 || 2
  const lo = Math.max(0, sMin - pad)
  const hi = sMax + pad

  const x = (d: string) =>
    padL + ((Date.parse(d) - t0) / Math.max(1, t1 - t0)) * (W - padL - padR)
  const y = (s: number) => padT + ((hi - s) / (hi - lo)) * (H - padT - padB)

  const line = (pts: Pt[]) =>
    [...pts]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.date).toFixed(1)} ${y(p.score).toFixed(1)}`)
      .join(' ')

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((r) => lo + (hi - lo) * r)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="trend" width="100%" role="img"
         aria-label={t('detail.curveAlt')}>
      {ticks.map((s) => (
        <g key={s}>
          <line x1={padL} y1={y(s)} x2={W - padR} y2={y(s)} className="grid" />
          <text x={padL - 8} y={y(s) + 4} className="ax" textAnchor="end">
            {Math.round(s)}
          </text>
        </g>
      ))}
      <text x={4} y={H - 5} className="ax" textAnchor="start">{t('col.score')}</text>

      {frontier.length > 1 && (
        <path d={line(frontier)} fill="none" stroke="var(--line-strong)" strokeWidth={1.5}
              strokeDasharray="4 3" />
      )}
      {company.length > 1 && (
        <path d={line(company)} fill="none" stroke="var(--accent)" strokeWidth={2} />
      )}

      {frontier.map((p) => (
        <circle key={'f' + p.date + p.score} cx={x(p.date)} cy={y(p.score)} r={2.5}
                fill="var(--line-strong)" />
      ))}
      {(() => {
        const used: Box[] = frontier.map((p) => ({
          x1: x(p.date) - 5,
          y1: y(p.score) - 5,
          x2: x(p.date) + 5,
          y2: y(p.score) + 5,
        }))
        const bounds = { W, H, padL, padR, padT, padB }
        const ordered = [...company].sort((a, b) => a.date.localeCompare(b.date))
        // 先给所有点的模型名占位，再放分数，避免先放的把后放的挤掉
        const nameLabels = ordered.map((p) =>
          placeLabel(p.model, x(p.date), y(p.score), used, bounds),
        )
        const scoreLabels = ordered.map((p) =>
          placeLabel(String(p.score), x(p.date), y(p.score), used, bounds),
        )
        return ordered.map((p, i) => (
          <g key={'c' + p.date + p.score}>
            <circle cx={x(p.date)} cy={y(p.score)} r={p.estimated ? 3 : 4}
                    fill={p.estimated ? 'var(--surface)' : 'var(--accent)'}
                    stroke="var(--accent)" strokeWidth={p.estimated ? 1.5 : 0} />
            {nameLabels[i] && (
              <text x={nameLabels[i]!.lx} y={nameLabels[i]!.ly} className="ax"
                    textAnchor={nameLabels[i]!.anchor}>
                {p.model.replace(/\s*\([^)]*\)$/, '')}
              </text>
            )}
            {scoreLabels[i] && (
              <text x={scoreLabels[i]!.lx} y={scoreLabels[i]!.ly} className="ax"
                    textAnchor={scoreLabels[i]!.anchor} fill="var(--accent)">
                {p.score}
              </text>
            )}
          </g>
        ))
      })()}

      {(() => {
        // 首尾日期太近时只保留一个，避免两个日期标签叠在一起（如两点相隔一个月）
        const sortedC = [...company].sort((a, b) => a.date.localeCompare(b.date))
        const first = sortedC[0]
        const last = sortedC[sortedC.length - 1]
        if (!first) return null
        // 两个日期都居中放在各自点位下方；若会与左侧日期重叠则只保留左侧一个
        const firstBox: Box = {
          x1: x(first.date) - textWidth(first.date) / 2,
          y1: 0,
          x2: x(first.date) + textWidth(first.date) / 2,
          y2: 1,
        }
        const lastBox: Box = {
          x1: x(last.date) - textWidth(last.date) / 2,
          y1: 0,
          x2: x(last.date) + textWidth(last.date) / 2,
          y2: 1,
        }
        const showLast = Boolean(
          last && last !== first && !overlaps(firstBox, lastBox) &&
          lastBox.x2 <= W - 4 && lastBox.x1 >= 0,
        )
        return (
          <>
            <text x={x(first.date)} y={H - padB + 18} className="ax" textAnchor="middle">
              {first.date}
            </text>
            {showLast && (
              <text x={x(last.date)} y={H - padB + 18} className="ax" textAnchor="middle">
                {last.date}
              </text>
            )}
          </>
        )
      })()}
    </svg>
  )
}

export default function CompanyDetail({
  row,
  reference,
  frontierName,
  frontier,
  onBack,
}: {
  row: Row
  reference?: CompanyReference
  frontierName: string
  frontier: Pt[]
  onBack: () => void
}) {
  const t = useT()
  const pts: Pt[] = reference?.points ?? []
  const sorted = [...pts].sort((a, b) => a.date.localeCompare(b.date))
  const months = Math.round(row.d / 30.4)

  return (
    <section className="block company-detail">
      <button className="back" onClick={onBack}>{t('detail.back')}</button>

      <h2>
        {t('detail.heading', {
          name: companyName(row.name, row.company_id),
          model: row.model,
        })}
      </h2>

      <div className="detail-stats">
        <span><b>{row.score.toFixed(1)}</b><i>{t('col.score')}</i></span>
        <span><b>{row.date}</b><i>{t('col.date')}</i></span>
        <span><b className={`tier ${row.tier}`}>{row.tier}</b><i>{t('col.tier')}</i></span>
        {row.d === 0 && <span><b>{t('tag.frontier')}</b><i>{t('tag.origin')}</i></span>}
        <span><b>{row.d}</b><i>{t('detail.frontierGap')}</i></span>
        {row.d > 0 && <span><b>{t('unit.months', { n: months })}</b><i>{t('detail.converted')}</i></span>}
        {row.estimated && <span className="muted"><b>{t('tag.estimated')}</b><i>{t('tag.notDirect')}</i></span>}
      </div>

      <h3>{t('detail.curve')}</h3>
      {sorted.length >= 2 ? (
        <>
          <CurveChart company={sorted} frontier={frontier} />
          <p className="hint">
            {t('detail.curveHint', { frontier: frontierName })}
          </p>
        </>
      ) : (
        <p className="hint">{t('detail.noCurve')}</p>
      )}

      <h3>{t('detail.iterations')}</h3>
      <div className="scroll">
        <table>
          <thead>
            <tr>
              <th>{t('col.modelShort')}</th>
              <th className="num">{t('col.score')}</th>
              <th>{t('col.date')}</th>
              <th className="num">{t('col.compare')}</th>
              <th>{t('col.dataKind')}</th>
            </tr>
          </thead>
          <tbody>
            {[...sorted].reverse().map((p, i, arr) => {
              const prev = arr[i + 1]
              const delta = prev
                ? t('detail.delta', {
                    sign: p.score - prev.score > 0 ? '+' : '',
                    delta: Math.round((p.score - prev.score) * 10) / 10,
                    days: days(prev.date, p.date),
                  })
                : '—'
              return (
                <tr key={p.model + p.date}>
                  <td className="name">{p.model}</td>
                  <td className="num">{p.score.toFixed(1)}</td>
                  <td className="date">{p.date}</td>
                  <td className="num">{delta}</td>
                  <td className="muted">{p.estimated ? t('tag.estimated') : t('tag.direct')}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

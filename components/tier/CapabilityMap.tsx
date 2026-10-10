import { DimCell, Dimensions } from '@/lib/tier/types'
import { useT } from '@/lib/tier/i18n'

/*
 * 能力时差地图（EXT-03）：一个厂商的七个能力维度 vs 前沿。
 *
 * 形态选择：七个维度是「多轴 × 单值」，用雷达图；同时给数值表兜底
 * ——图上的每个标签都直标名称与数值，不依赖悬停。
 *
 * 两条实测约束（写死在渲染里，不是排版偏好）：
 *   · 分数不全时只连已测量的轴。缺的维度**不画成 0 分**，而是留空并排除出连线圈，
 *     否则形状会假装该维度是 0 分。
 *   · 时间轴不成立的维度（分数随代次退步）**不给天数**，只在状态列标「无时间轴」。
 */

const W = 460
const H = 420
const CX = W / 2
const CY = H / 2 - 4
/** 数据环半径：0 分在圆心，100 分在这条环上 */
const R_DATA = 112
/** 标签环半径：标签固定在这一圈，各自只占一个角度，不进入图内 */
const R_LABEL = 152
/** 环上刻度 */
const TICKS = [25, 50, 75, 100]

const pt = (i: number, n: number, r: number) => {
  const a = (Math.PI * 2 * i) / n - Math.PI / 2
  return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a), a }
}

export default function CapabilityMap({
  dims,
  companyId,
  companyName,
}: {
  dims: Dimensions
  companyId: string
  companyName: string
}) {
  const t = useT()
  const own = dims.vendors.find((v) => v.company_id === companyId)
  const frontier = dims.vendors.find((v) => v.company_id === 'anthropic')
  const keys = dims.dimensions
  const n = keys.length

  const cell = (v: typeof own, k: string): DimCell | undefined => v?.dims[k]
  const val = (v: typeof own, k: string) => {
    const c = cell(v, k)
    return c && c.score !== null && c.status !== 'unmeasured' ? c.score : null
  }

  // 已测量的轴才连线：缺的维度留空，不装作 0 分
  const poly = (v: typeof own) =>
    keys
      .map((k, i) => {
        const s = val(v, k.key)
        return s === null ? null : pt(i, n, (s / 100) * R_DATA)
      })
      .filter(Boolean) as { x: number; y: number }[]

  const frontierPts = poly(frontier)
  const ownPts = poly(own)
  const path = (pts: { x: number; y: number }[]) =>
    pts.length < 2 ? '' : pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z'

  if (!own) {
    return (
      <section className="block cap">
        <h3>{t('cap.title')}</h3>
        <p className="hint">{t('cap.unmeasured')}</p>
      </section>
    )
  }

  return (
    <section className="block cap">
      <h3>{t('cap.title')}</h3>

      <svg viewBox={`0 0 ${W} ${H}`} className="cap-radar" width="100%" role="img"
           aria-label={t('cap.title')}>
        {/* 刻度环 */}
        {TICKS.map((v) => (
          <circle key={v} cx={CX} cy={CY} r={(v / 100) * R_DATA} className="cap-ring" />
        ))}
        {/* 轴 */}
        {keys.map((k, i) => {
          const p = pt(i, n, R_DATA)
          return <line key={k.key} x1={CX} y1={CY} x2={p.x} y2={p.y} className="cap-axis" />
        })}

        {/* 前沿 */}
        {frontierPts.length >= 2 && (
          <path d={path(frontierPts)} className="cap-frontier" />
        )}
        {/* 本家 */}
        {ownPts.length >= 2 && <path d={path(ownPts)} className="cap-own" />}
        {ownPts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3} className="cap-dot" />
        ))}

        {/* 标签环：每个标签只占一个角度，上下结构（名称在上、值在下） */}
        {keys.map((k, i) => {
          const p = pt(i, n, R_LABEL)
          const ownV = val(own, k.key)
          const cos = Math.cos(p.a)
          const anchor = Math.abs(cos) < 0.3 ? 'middle' : cos > 0 ? 'start' : 'end'
          const gap = cell(own, k.key)?.gap_days
          const beyond = cell(own, k.key)?.beyond_pool
          const tail =
            ownV === null
              ? t('cap.statusUnmeasured')
              : gap === null || gap === undefined
                ? ownV.toFixed(1)          // 无时间轴：只给分数，不显示占位的「— 天」
                : `${ownV.toFixed(1)} · ${gap}${beyond ? '↑' : ''}${t('unit.daysSuffix')}`
          return (
            <g key={k.key}>
              <text x={p.x} y={p.y - 5} className="cap-label" textAnchor={anchor}>
                {k.label}
              </text>
              <text x={p.x} y={p.y + 9} className="cap-value" textAnchor={anchor}>
                {tail}
              </text>
            </g>
          )
        })}
      </svg>

      {/* 数值表兜底：图上看不出的状态与口径，全在表里 */}
      <div className="scroll">
        <table className="cap-table">
          <thead>
            <tr>
              <th>{t('cap.thDim')}</th>
              <th className="num">{t('cap.thScore')}</th>
              <th className="num">{t('cap.thFrontier')}</th>
              <th className="num">{t('cap.thGap')}</th>
              <th>{t('cap.thStatus')}</th>
            </tr>
          </thead>
          <tbody>
            {keys.map((k) => {
              const c = cell(own, k.key)
              const f = cell(frontier, k.key)
              const ownV = val(own, k.key)
              const fwV = val(frontier, k.key)
              const status =
                c?.status === 'unmeasured'
                  ? t('cap.statusUnmeasured')
                  : c?.status === 'no_timeline'
                    ? t('cap.noTimeline')
                    : c?.status === 'estimated'
                      ? t('cap.statusEstimated')
                      : t('cap.statusMeasured')
              return (
                <tr key={k.key}>
                  <td>{k.label}</td>
                  <td className="num">{ownV === null ? '—' : ownV.toFixed(1)}</td>
                  <td className="num">{fwV === null ? '—' : fwV.toFixed(1)}</td>
                  <td className="num">
                    {c?.gap_days === null || c?.gap_days === undefined
                      ? '—'
                      : `${c.gap_days}${c.beyond_pool ? '↑' : ''}`}
                  </td>
                  <td className="muted">{status}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="hint">{t('cap.axisHint')}</p>
      <p className="hint">{t('cap.anchorNote')}</p>
      <p className="hint">{t('cap.noTimelineNote')}</p>
      <p className="hint">
        {t('cap.legendFrontier', { name: dims.meta.frontier.name })} ·{' '}
        {t('cap.legendThis', { name: companyName })}
      </p>
      <p className="hint muted">{dims.meta.note}</p>
    </section>
  )
}

import { companyName, useLang } from '../i18n'

/*
 * 斜率图：两个时点各占一条竖轴，每个实体一条连线。
 * 向下=追近前沿（绿），向上=被拉开（红），平=无变化（灰）。
 * 两端直接标厂商名，不依赖图例；数值明细由下方表格承担。
 */
export interface SlopeItem {
  key: string
  name: string
  companyId: string
  from: number
  to: number
  color: string
}

export default function SlopeChart({
  items,
  fromLabel,
  toLabel,
  ariaLabel,
}: {
  items: SlopeItem[]
  fromLabel: string
  toLabel: string
  ariaLabel?: string
}) {
  // 订阅语言：公司名按当前语言渲染（companyName 每次渲染时取语言）
  useLang()
  const max = Math.max(100, ...items.flatMap((i) => [i.from, i.to]))
  const axisMax = Math.ceil(max / 100) * 100
  const H = 340
  const padT = 30
  const padB = 26
  const y = (v: number) => padT + (v / axisMax) * (H - padT - padB)

  // 两端标签都做防重叠：按 y 排序后强制最小间距
  const spread = (get: (i: SlopeItem) => number) => {
    const list = items.map((i) => ({ i, y: y(get(i)) })).sort((a, b) => a.y - b.y)
    const MIN = 21
    for (let k = 1; k < list.length; k++) {
      if (list[k].y - list[k - 1].y < MIN) list[k].y = list[k - 1].y + MIN
    }
    const over = list.length ? list[list.length - 1].y - (H - padB) : 0
    if (over > 0) for (const l of list) l.y -= over
    return list
  }
  const left = spread((i) => i.from)
  const right = spread((i) => i.to)

  return (
    <div className="slope" role="img" aria-label={ariaLabel}>
      <svg viewBox={`0 0 720 ${H}`} preserveAspectRatio="none" className="slope-scale" aria-hidden="true">
        {[0, 0.25, 0.5, 0.75, 1].map((r) => (
          <line key={r} x1="0" y1={y(axisMax * r)} x2="720" y2={y(axisMax * r)} stroke="var(--line)" strokeWidth="1" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>

      <div className="slope-axis nums">
        {[0, 0.25, 0.5, 0.75, 1].map((r) => (
          <span key={r} style={{ top: y(axisMax * r) }}>
            {Math.round(axisMax * r)}
          </span>
        ))}
      </div>

      <div className="slope-head">
        <span className="slope-date num">{fromLabel}</span>
        <span className="slope-date num">{toLabel}</span>
      </div>

      <div className="slope-plot">
        <div className="slope-col">
          {left.map(({ i, y: yy }) => (
            <span className="slope-end left" key={i.key} style={{ top: yy }}>
              <b>{companyName(i.name, i.companyId)}</b>
              <i className="num">{i.from}</i>
              <em style={{ background: i.color }} />
            </span>
          ))}
        </div>

        <div className="slope-mid">
          <svg viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" aria-hidden="true">
            {items.map((i) => {
              const dd = i.to - i.from
              const stroke = dd < 0 ? 'var(--good)' : dd > 0 ? 'var(--bad)' : 'var(--line-strong)'
              return (
                <line
                  key={i.key}
                  x1="0"
                  y1={y(i.from)}
                  x2="100"
                  y2={y(i.to)}
                  stroke={stroke}
                  strokeWidth={dd === 0 ? 1 : 1.8}
                  strokeOpacity="0.8"
                  vectorEffect="non-scaling-stroke"
                />
              )
            })}
            {items.map((i) => (
              <g key={'d' + i.key}>
                <circle cx="0" cy={y(i.from)} r="3" fill="var(--surface)" stroke={i.color} strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
                <circle cx="100" cy={y(i.to)} r="3" fill={i.color} vectorEffect="non-scaling-stroke" />
              </g>
            ))}
          </svg>
        </div>

        <div className="slope-col">
          {right.map(({ i, y: yy }) => (
            <span className="slope-end right" key={i.key} style={{ top: yy }}>
              <em style={{ background: i.color }} />
              <i className="num">{i.to}</i>
              <b>{companyName(i.name, i.companyId)}</b>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

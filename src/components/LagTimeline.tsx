import { useT } from '../i18n'
import { HoverTip, TipInfo } from './HoverCard'

/*
 * 时差哑铃图：横轴是日期，每行一家厂商，两个端点分别是
 * 「自家旗舰发布日」与「能力等价于参考厂商的那一天」，连线长度即时差。
 * 参考厂商的模型发布日作为刻度，因此能直接看出对方落后了几代。
 * 数值明细由下方表格承担，两者并存不重复。
 */
export interface LagItem {
  key: string
  label: string
  color: string
  released: string
  equivalent: string | null
  gapDays: number | null
}

const ms = (d: string) => Date.parse(d)

export default function LagTimeline({
  items,
  markers,
  ariaLabel,
}: {
  items: LagItem[]
  markers: { date: string; label: string }[]
  ariaLabel?: string
}) {
  const t = useT()
  const dates = [
    ...items.flatMap((i) => [ms(i.released), i.equivalent ? ms(i.equivalent) : ms(i.released)]),
    ...markers.map((m) => ms(m.date)),
  ]
  const t0 = Math.min(...dates)
  const t1 = Math.max(...dates)
  const span = Math.max(t1 - t0, 1)
  const at = (d: string) => ((ms(d) - t0) / span) * 100

  // 只有相隔够远的刻度才标名字，避免文字互相压住
  const shown: number[] = []
  const labeled = markers
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .filter((m) => {
      const x = at(m.date)
      if (shown.some((s) => Math.abs(s - x) < 13)) return false
      shown.push(x)
      return true
    })

  return (
    <div className="lag" role="img" aria-label={ariaLabel}>
      <div className="lag-axis">
        {labeled.map((m) => {
          const x = at(m.date)
          // 贴两端的刻度把文字收回卡内，避免溢出
          const anchor = x > 88 ? 'end' : x < 12 ? 'start' : 'middle'
          return (
            <span className={'lag-tick ' + anchor} key={m.date} style={{ left: `${x}%` }}>
              <i />
              <b>{m.label}</b>
              <em className="num">{m.date.slice(5)}</em>
            </span>
          )
        })}
      </div>

      <div className="lag-rows">
        {items.map((it) => {
          const xr = at(it.released)
          const xe = it.equivalent ? at(it.equivalent) : xr
          const lo = Math.min(xr, xe)
          const hi = Math.max(xr, xe)
          return (
            <div className="lag-row" key={it.key}>
              <HoverTip
                content={
                  <TipInfo
                    name={it.label}
                    rows={it.equivalent ? [[t('col.date'), it.equivalent]] : undefined}
                  />
                }
              >
                <span className="lag-name">{it.label}</span>
              </HoverTip>
              <span className="lag-track">
                {it.equivalent && hi - lo > 0.2 && (
                  <span className="lag-link" style={{ left: `${lo}%`, width: `${hi - lo}%` }} />
                )}
                <HoverTip
                  content={<TipInfo name={it.label} rows={[[t('col.date'), it.equivalent ?? '—']]} />}
                >
                  <span className="lag-dot equiv" style={{ left: `${xe}%` }} />
                </HoverTip>
                <span className="lag-dot own" style={{ left: `${xr}%`, background: it.color }} />
              </span>
              <span className="lag-val num">{it.gapDays === null ? '—' : t('unit.days', { n: it.gapDays })}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

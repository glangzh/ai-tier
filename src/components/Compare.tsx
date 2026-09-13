import { useState } from 'react'
import { Index, Snapshot } from '../types'
import { companyName, t, useT } from '../i18n'
import { Select } from './Controls'
import SlopeChart, { SlopeItem } from './SlopeChart'
import { tierVar } from './DBar'

export default function Compare({
  index,
  snaps,
}: {
  index: Index
  snaps: Record<string, Snapshot>
}) {
  const t = useT()
  const asOfs = [...index.snapshots]
    .sort((a, b) => b.as_of.localeCompare(a.as_of))
    .map((s) => s.as_of)
  const [aOf, setAOf] = useState(asOfs[asOfs.length - 1] ?? '')
  const [bOf, setBOf] = useState(asOfs[0] ?? '')

  const A = aOf ? snaps[aOf] : null
  const B = bOf ? snaps[bOf] : null
  if (!A || !B) return <div className="loading">{t('compare.noData')}</div>

  const bMap = new Map(B.rows.map((r) => [r.name, r]))
  const rows = A.rows.filter((r) => bMap.has(r.name)).sort((x, y) => {
    const dx = bMap.get(x.name)?.d ?? 1e9
    const dy = bMap.get(y.name)?.d ?? 1e9
    return dx - dy
  })

  return (
    <section className="block card compare">
      <h2>{t('nav.compare')}</h2>
      <div className="cmp-pick">
        <label>
          {t('compare.earlier')}
          <Select
            value={aOf}
            onChange={setAOf}
            size="sm"
            ariaLabel={t('compare.earlier')}
            options={asOfs.map((a) => ({ value: a, label: a }))}
          />
        </label>
        <label>
          {t('compare.later')}
          <Select
            value={bOf}
            onChange={setBOf}
            size="sm"
            ariaLabel={t('compare.later')}
            options={asOfs.map((a) => ({ value: a, label: a }))}
          />
        </label>
      </div>
      {/* 斜率图：两个快照的位置变化，向下=追近 */}
      <div className="block-gap framed">
        <SlopeChart
          fromLabel={A.as_of.slice(5)}
          toLabel={B.as_of.slice(5)}
          ariaLabel={t('nav.compare')}
          items={rows.map<SlopeItem>((r) => {
            const b = bMap.get(r.name)!
            return {
              key: r.name,
              name: r.name,
              companyId: r.company_id ?? r.name,
              from: r.d,
              to: b.d,
              color: tierVar(b.tier),
            }
          })}
        />
      </div>

      <div className="scroll">
        <table className="cmp">
        <thead>
          <tr>
            <th>{t('col.company')}</th>
            <th className="num">{t('col.referenceGap', { date: A.as_of })}</th>
            <th className="num">{t('col.referenceGap', { date: B.as_of })}</th>
            <th className="num">{t('col.gapChange')}</th>
            <th>{t('col.tierChange')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const b = bMap.get(r.name)
            const dA = r.d
            const dB = b?.d ?? null
            const dd = dB === null ? null : dB - dA
            const tierChange = b && b.tier !== r.tier ? ` → ${b.tier}` : ''
            return (
              <tr key={r.name}>
                <td className="name">
                  {companyName(r.name, r.company_id)}
                  {b?.estimated && <span className="tag">{t('tag.estimated')}</span>}
                </td>
                <td className="num">{dA}</td>
                <td className="num">{dB === null ? '—' : dB}</td>
                <td
                  className={
                    'num ' + (dd === null ? '' : dd < 0 ? 'good' : dd > 0 ? 'bad' : '')
                  }
                >
                  {dd === null ? '—' : `${dd > 0 ? '+' : ''}${dd}`}
                </td>
                <td>
                  {r.tier}
                  {tierChange}
                </td>
              </tr>
            )
          })}
        </tbody>
        </table>
      </div>
      <p className="hint">{t('compare.hint')}</p>
    </section>
  )
}

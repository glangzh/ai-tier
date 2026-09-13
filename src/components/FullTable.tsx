import { Snapshot } from '../types'
import DBar, { tierBgVar, tierVar } from './DBar'
import { companyName, t, useT } from '../i18n'

export default function FullTable({
  snap,
  onOpen,
}: {
  snap: Snapshot
  onOpen: (companyId: string) => void
}) {
  const t = useT()
  const maxD = Math.max(...snap.rows.map((r) => r.d), 1)
  const rows = [...snap.rows].sort((a, b) => a.d - b.d)

  return (
    <section className="block">
      <h2>{t('table.title')}</h2>
      <div className="scroll">
        <table className="full">
          <thead>
            <tr>
              <th className="rank">{t('col.rank')}</th>
              <th>{t('col.company')}</th>
              <th>{t('col.model')}</th>
              <th className="num">{t('col.score')}</th>
              <th className="num">{t('col.dt')}</th>
              <th className="num">{t('col.g')}</th>
              <th className="bar">{t('col.total')}</th>
              <th>{t('col.tier')}</th>
              <th>{t('col.date')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={r.name}
                className={r.estimated ? 'est' : ''}
                data-tier={r.tier}
                onClick={() => onOpen(r.company_id ?? r.name)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onOpen(r.company_id ?? r.name)
                  }
                }}
                style={
                  {
                    '--tier-color': tierVar(r.tier),
                    '--tier-bg': tierBgVar(r.tier),
                  } as React.CSSProperties
                }
              >
                <td className="rank">{i + 1}</td>
                <td className="name">
                  <button className="link" onClick={() => onOpen(r.company_id ?? r.name)}>
                    {companyName(r.name, r.company_id)}
                  </button>
                  {r.estimated && <span className="tag">{t('tag.estimated')}</span>}
                  {r.overridden && <span className="tag">†</span>}
                  {r.up && <span className="tag">↑</span>}
                </td>
                <td className="model">{r.model}</td>
                <td className="num">{r.score.toFixed(1)}</td>
                <td className="num">{r.dt}</td>
                <td className="num">{r.g}</td>
                <td className="bar">
                  <DBar d={r.d} max={maxD} tier={r.tier} />
                </td>
                <td>
                  <span className={`tier ${r.tier}`}>{r.tier}</span>
                </td>
                <td className="date">{r.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="hint">{t('table.hint')}</p>
    </section>
  )
}

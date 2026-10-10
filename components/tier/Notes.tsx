import { Snapshot } from '@/lib/tier/types'
import { t, useT } from '@/lib/tier/i18n'

export default function Notes({ snap }: { snap: Snapshot }) {
  const t = useT()
  const benchmarks = snap.company_benchmarks
  const reference = benchmarks?.references.find((item) => item.id === benchmarks.default_id)
    ?? benchmarks?.references[0]
  const exampleRow = snap.rows.find((row) => row.company_id === 'deepseek' || row.name === 'DeepSeek')
  const exampleComparison = exampleRow && reference
    ? reference.comparisons.find((item) => item.company_id === exampleRow.company_id || item.company === exampleRow.name)
    : undefined
  const example = exampleRow && exampleComparison?.equivalent_date
    ? { row: exampleRow, comparison: exampleComparison, equivalentDate: exampleComparison.equivalent_date }
    : null
  const bandText = snap.tier_bands
    .map((b) => (b.hi === null
      ? `${b.label} ${t('band.over', { n: b.lo })}`
      : `${b.label} ${t('band.range', { lo: b.lo, hi: b.hi })}`))
    .join(' · ')

  return (
    <section className="block card">
      <h2>{t('nav.notes')}</h2>
      <div className="methodology">
        <section className="methodology-section">
          <h3>{t('notes.methodology.whatTitle')}</h3>
          <p>{t('notes.methodology.what')}</p>
        </section>

        <section className="methodology-section">
          <h3>{t('notes.methodology.referenceTitle')}</h3>
          <p>{t('notes.methodology.reference', { name: reference?.name ?? t('notes.frontier') })}</p>
          {reference && reference.points.length > 0 && (
            <div className="methodology-table-wrap">
              <table className="methodology-table">
                <thead>
                  <tr>
                    <th>{t('notes.methodology.model')}</th>
                    <th>{t('notes.methodology.date')}</th>
                    <th className="num">{t('notes.methodology.score')}</th>
                  </tr>
                </thead>
                <tbody>
                  {reference.points.map((point) => (
                    <tr key={`${point.date}-${point.model}`}>
                      <td>{point.model}</td>
                      <td className="date">{point.date}</td>
                      <td className="num">
                        {point.score}
                        {point.estimated && <span className="methodology-estimated"> · {t('tag.estimated')}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="methodology-section">
          <h3>{t('notes.methodology.calculationTitle')}</h3>
          <p>{t('notes.methodology.calculation')}</p>
        </section>

        {example && (
          <section className="methodology-section">
            <h3>{t('notes.methodology.exampleTitle')}</h3>
            <p>{t('notes.methodology.exampleLead', {
              company: example.row.name,
              model: example.row.model,
              score: example.row.score,
              releaseDate: example.row.date,
              equivalentDate: example.equivalentDate,
              frontierDate: snap.frontier.date,
            })}</p>
            <p>{t('notes.methodology.exampleResult', {
              pacing: example.row.dt,
              capability: example.row.g,
              total: example.row.d,
            })}</p>
          </section>
        )}

        <section className="methodology-section">
          <h3>{t('notes.methodology.companyTitle')}</h3>
          <p>{t('notes.methodology.company')}</p>
        </section>

        <section className="methodology-section">
          <h3>{t('notes.methodology.modelTitle')}</h3>
          <p>{t('notes.methodology.modelTiers')}</p>
        </section>

        <section className="methodology-section">
          <h3>{t('notes.methodology.limitsTitle')}</h3>
          <p>{t('notes.methodology.limits')}</p>
        </section>
      </div>

      <h3 className="methodology-subtitle">{t('notes.snapshotTitle')}</h3>
      <div className="notes">
        <div className="note">
          <b>{t('notes.totalLabel')}</b>
          <span>{t('notes.total')}</span>
        </div>
        <div className="note">
          <b>{t('notes.dtLabel')}</b>
          <span>{t('notes.dt')}</span>
        </div>
        <div className="note">
          <b>{t('notes.gLabel')}</b>
          <span>{t('notes.g')}</span>
        </div>
        <div className="note">
          <b>{t('notes.benchmark')}</b>
          <span>{snap.benchmark}</span>
        </div>
        <div className="note">
          <b>{t('notes.frontier')}</b>
          <span>
            {t('notes.frontierValue', {
              name: snap.frontier.name,
              score: snap.frontier.score,
              date: snap.frontier.date,
            })}
          </span>
        </div>
        <div className="note">
          <b>{t('notes.asOf')}</b>
          <span>{snap.as_of}</span>
        </div>
        <div className="note">
          <b>{t('notes.tier')}</b>
          <span>{bandText}</span>
        </div>
        <div className="note">
          <b>{t('tag.estimated')}</b>
          <span>{t('notes.estimated')}</span>
        </div>
      </div>
    </section>
  )
}

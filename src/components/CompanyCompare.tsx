import { useEffect, useState } from 'react'
import { CompanyComparison, CompanyReference, Snapshot } from '../types'
import { t, useT } from '../i18n'
import { Select } from './Controls'
import LagTimeline, { LagItem } from './LagTimeline'
import { tierVar } from './DBar'

function resultText(row: CompanyComparison) {
  if (row.status !== 'ok' || row.gap_days === null) {
    return t('company.noCurve')
  }
  if (row.direction === 'ahead') return t('company.ahead', { n: Math.abs(row.gap_days) })
  if (row.direction === 'behind') return t('company.behind', { n: row.gap_days })
  return t('company.sameDay')
}

function resultClass(row: CompanyComparison) {
  if (row.status !== 'ok') return 'muted'
  if (row.direction === 'ahead') return 'good'
  if (row.direction === 'behind') return 'bad'
  return ''
}

function compareRows(a: CompanyComparison, b: CompanyComparison) {
  if (a.status !== b.status) return a.status === 'ok' ? -1 : 1
  if (a.gap_days !== null && b.gap_days !== null && a.gap_days !== b.gap_days) {
    return a.gap_days - b.gap_days
  }
  return a.company.localeCompare(b.company)
}

function referenceStatus(ref: CompanyReference) {
  if (ref.status === 'insufficient') return t('company.insufficient')
  if (ref.status === 'incompatible') return t('company.incompatible')
  return ''
}

export default function CompanyCompare({ snap }: { snap: Snapshot }) {
  const t = useT()
  const group = snap.company_benchmarks
  const references = group?.references ?? []
  const [referenceId, setReferenceId] = useState(group?.default_id ?? references[0]?.id ?? '')
  const referenceKey = references.map((ref) => ref.id).join('|')

  useEffect(() => {
    const next = references.some((ref) => ref.id === referenceId)
      ? referenceId
      : group?.default_id ?? references[0]?.id ?? ''
    setReferenceId(next)
  }, [referenceKey, group?.default_id, referenceId])

  if (!group || references.length === 0) {
    return (
      <section className="block empty-panel">
        <h2>{t('nav.company')}</h2>
        <p>{t('company.empty')}</p>
      </section>
    )
  }

  const reference: CompanyReference =
    references.find((ref) => ref.id === referenceId) ?? references[0]
  const rows = [...reference.comparisons].sort(compareRows)

  return (
    <section className="block card company-compare">
      <div className="company-head">
        <div>
          <h2>{t('nav.company')}</h2>
          <p className="company-lead">{t('company.lead')}</p>
        </div>
        <label className="company-picker">
          <span>{t('company.picker')}</span>
          <Select
            value={reference.id}
            onChange={setReferenceId}
            size="sm"
            ariaLabel={t('company.picker')}
            options={references.map((ref) => ({
              value: ref.id,
              label: `${t(`co.${ref.id}`)}${ref.line_key ? ` · ${t(ref.line_key)}` : ''}`,
              hint: referenceStatus(ref),
            }))}
          />
      </label>
      </div>

      {reference.status !== 'ok' ? (
        <div className="empty-panel company-status">
          <h3>{t(`co.${reference.id}`)} · {reference.line_key ? t(reference.line_key) : t('company.line')}</h3>
          <p>{t('company.noCurve')}</p>
        </div>
      ) : (
        <>
          <div className="company-summary">
            <span>
              {t('company.range', { name: t(`co.${reference.id}`), start: reference.date_start ?? '', end: reference.date_end ?? '' })}
            </span>
          </div>

          {/* 时差哑铃图：自家发布日 ↔ 能力等价日，连线长度即时差 */}
          <div className="block-gap">
            {(() => {
              const items: LagItem[] = rows
                .filter((r) => r.status === 'ok')
                .map((r) => ({
                  key: r.company_id,
                  label: t(`co.${r.company_id}`),
                  color: tierVar(r.tier),
                  released: r.date,
                  equivalent: r.equivalent_date,
                  gapDays: r.gap_days,
                }))
              const markers = reference.points.map((p) => ({ date: p.date, label: p.model }))
              return items.length ? <LagTimeline items={items} markers={markers} ariaLabel={t('nav.company')} /> : null
            })()}
          </div>

          <div className="scroll">
            <table className="company-table">
              <thead>
                <tr>
                  <th>{t('col.companyShort')}</th>
                  <th>{t('col.modelShort')}</th>
                  <th className="num">{t('col.score')}</th>
                  <th>{t('col.date')}</th>
                  <th>{t('col.currentTier')}</th>
                  <th>{t('col.vsReference')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.company_id}>
                    <td className="name">
                      {t(`co.${row.company_id}`)}
                      {row.estimated && <span className="tag">{t('tag.estimated')}</span>}
                    </td>
                    <td className="model">{row.model}</td>
                    <td className="num">{row.score.toFixed(1)}</td>
                    <td className="date">{row.date}</td>
                    <td>
                      <span className={`tier ${row.tier}`}>{row.tier}</span>
                    </td>
                    <td className={resultClass(row)}>
                      {resultText(row)}
                      {row.equivalent_date && (
                        <span className="company-equivalent">{t('company.anchorDate', { date: row.equivalent_date })}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}

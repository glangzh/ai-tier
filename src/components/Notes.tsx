import { Snapshot } from '../types'
import { t, useT } from '../i18n'

export default function Notes({ snap }: { snap: Snapshot }) {
  const t = useT()
  const bandText = snap.tier_bands
    .map((b) => (b.hi === null
      ? `${b.label} ${t('band.over', { n: b.lo })}`
      : `${b.label} ${t('band.range', { lo: b.lo, hi: b.hi })}`))
    .join(' · ')

  return (
    <section className="block card">
      <h2>{t('nav.notes')}</h2>
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

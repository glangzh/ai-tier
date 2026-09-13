import { Snapshot } from '../types'
import { companyName, useLang, useT } from '../i18n'
import { HoverTip, TipInfo } from './HoverCard'
import { tierBgVar, tierName, tierVar } from './DBar'

/*
 * 分档带：一排一个梯队，排内是该档的厂商。
 * 只表达「谁在哪一档」，不出现天数——天数是概览刻度尺的职责。
 * 档内顺序按厂商显示名，不按任何数值排序，避免退化成排名。
 */
export default function TierBands({
  snap,
  onOpen,
}: {
  snap: Snapshot
  onOpen: (companyId: string) => void
}) {
  const t = useT()
  const lang = useLang()
  return (
    <section className="block bands shell" aria-label={t('bands.title')}>
      <h2>{t('bands.title')}</h2>
      <div className="band-list">
        {snap.tier_bands.map((b) => {
        const rows = snap.rows
          .filter((r) => r.tier === b.label)
          .sort((a, x) => companyName(a.name, a.company_id).localeCompare(companyName(x.name, x.company_id)))
        return (
          <div
            className={'band' + (rows.length === 0 ? ' empty' : '')}
            key={b.label}
            style={{ '--tier-color': tierVar(b.label), '--tier-bg': tierBgVar(b.label) } as React.CSSProperties}
          >
            <div className="band-head">
              {/* 主：梯队名；次：括号内为代号与区间注释 */}
              <span className="band-name" style={{ color: tierVar(b.label) }}>
                {tierName(b.label, lang)}
              </span>
              <span className="band-note num">
                {t('band.bracket', {
                  x: `${b.label}${lang === 'en' ? ': ' : '：'}${
                    b.hi === null
                      ? t('band.overShort', { n: b.lo })
                      : t('band.rangeShort', { lo: b.lo, hi: b.hi })
                  }`,
                })}
              </span>
            </div>
            <ul className="chips">
              {rows.map((r) => (
                <HoverTip
                  key={r.name}
                  content={
                    <TipInfo
                      name={companyName(r.name, r.company_id)}
                      rows={[
                        [t('col.model'), r.model],
                        [t('col.score'), String(r.score)],
                        [t('col.toFrontier'), t('unit.days', { n: r.d })],
                      ]}
                    />
                  }
                >
                  <li
                    className="chip"
                    tabIndex={0}
                    onClick={() => onOpen(r.company_id ?? r.name)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onOpen(r.company_id ?? r.name)
                      }
                    }}
                  >
                    {companyName(r.name, r.company_id)}
                  </li>
                </HoverTip>
              ))}
              {rows.length === 0 && <li className="chip empty">{t('ladder.empty')}</li>}
            </ul>
          </div>
          )
        })}
      </div>
    </section>
  )
}

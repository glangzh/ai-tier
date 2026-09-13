import { Snapshot, ModelTierEntry } from '../types'
import { useState } from 'react'
import * as ToggleGroup from '@radix-ui/react-toggle-group'
import { companyName, shortModelName, useT } from '../i18n'
import { HoverTip, TipInfo } from './HoverCard'
import { tierBgVar, tierVar } from './DBar'
import ScoreTierScatter, { ScatterItem } from './ModelScatter'

/*
 * 模型梯队：把公司档位的天数分界反解到分数轴，之后按分数比较归位。
 * 与公司梯队同源（都来自前沿曲线），但判据不同：
 *   公司档位 = 当前旗舰的 D（时间差）；模型档位 = 模型分数（能力水平）。
 * 分界与每个模型的归属都在快照里算好，页面只读不算。
 *
 * 分布图是散点图：横轴分数、纵轴梯队等级。
 * 同一梯队内分数相近的模型会挤在一起，故在梯队带内做纵向抖动错开（不跨带）。
 */
const AXIS_MIN = 15
const AXIS_MAX = 55
const ROW_H = 96 // 每个梯队带的高度
const PAD = { l: 54, r: 22, t: 26, b: 30 }

export default function ModelTiers({ snap }: { snap: Snapshot }) {
  const t = useT()
  const block = snap.model_tiers

  if (!block || block.models.length === 0) {
    return (
      <section className="block model-tiers">
        <h2>{t('nav.models')}</h2>
        <p className="hint">{t('compare.noData')}</p>
      </section>
    )
  }

  const bands = snap.tier_bands
  const models = block.models
  const cuts = [...block.cuts].sort((a, b) => a.score - b.score) // 升序 20 / 33 / 42
  // 散点图横轴是分数：档位的天数边界（100/200/300）由快照反解到分轴上
  const cutMarks = cuts.map((c) => ({ at: c.score, key: c.days }))

  /** 每档分数判据。cuts 升序；第 i 档的下界 cuts[n-i-1]，上界 cuts[n-i]。
   *  T1: 分 > 42   T2: 33 < 分 ≤ 42   T3: 20 < 分 ≤ 33   T4: 分 ≤ 20 */
  const ruleOf = (label: string) => {
    const i = bands.findIndex((b) => b.label === label)
    const n = cuts.length
    if (i === 0) return t('mtier.ruleOpen', { n: cuts[n - 1].score })
    if (i === n) return t('mtier.ruleLow', { n: cuts[0].score })
    return t('mtier.ruleTop', { lo: cuts[n - i - 1].score, hi: cuts[n - i].score })
  }

  // 筛选：默认全开；AA 的做法是一排可点开关，不是下拉框
  const [offTiers, setOffTiers] = useState<string[]>([])
  const [offCos, setOffCos] = useState<string[]>([])
  const companies = [...new Map(models.map((m) => [m.company_id, m.company])).entries()]
  const shown = models.filter((m) => !offTiers.includes(m.tier) && !offCos.includes(m.company_id))

  return (
    <>
      {/* ① 分档带：哪些模型在哪一档 */}
      <section className="block bands" aria-label={t('nav.models')}>
        <h2>{t('nav.models')}</h2>
        <div className="band-list">
          {bands.map((b) => {
            const rows = models.filter((m) => m.tier === b.label).sort((a, b) => b.score - a.score)
            return (
              <div
                className={'band' + (rows.length === 0 ? ' empty' : '')}
                key={b.label}
                style={{ '--tier-color': tierVar(b.label), '--tier-bg': tierBgVar(b.label) } as React.CSSProperties}
              >
                <div className="band-head">
                  <span className="band-name" style={{ color: tierVar(b.label) }}>
                    {t(`mtier.${b.label}`)}
                  </span>
                  <span className="band-note num">{t('band.bracket', { x: ruleOf(b.label) })}</span>
                </div>
                <ul className="chips">
                  {rows.map((m) => (
                    <HoverTip
                      key={`${m.company_id}-${m.model}`}
                      content={
                        <TipInfo
                          name={m.model}
                          rows={[
                            [t('mtier.filterCompany'), companyName(m.company, m.company_id)],
                            [t('col.score'), String(m.score)],
                            [t('mtier.yAxis'), t(`mtier.${m.tier}`)],
                          ]}
                        />
                      }
                    >
                      {/* 芯片上只留模型名与分数：厂商留给 hover 详情，
                          否则芯片已经写了厂商，提示里再显示一遍就没有意义 */}
                      <li className="chip">
                        <span className="chip-mo">{shortModelName(m.model)}</span>
                        <span className="chip-sc num">{m.score}</span>
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

      {/* ② 散点图：横轴分数、纵轴梯队等级 */}
      <section className="block ruler" aria-label={t('mtier.plotTitle')}>
        <h2>{t('mtier.plotTitle')}</h2>
        <div className="mt-filters">
          <span className="mt-filter-label">{t('mtier.filterTier')}</span>
          <span className="mt-filter-group">
            <button type="button" className={'mt-chip' + (offTiers.length === 0 ? ' on' : '')} onClick={() => setOffTiers([])}>
              {t('mtier.all')}
            </button>
            <ToggleGroup.Root
              type="multiple"
              className="mt-filter-group"
              aria-label={t('mtier.filterTier')}
              value={bands.filter((b) => !offTiers.includes(b.label)).map((b) => b.label)}
              onValueChange={(on) => setOffTiers(bands.filter((b) => !on.includes(b.label)).map((b) => b.label))}
            >
              {bands.map((b) => (
                <ToggleGroup.Item
                  key={b.label}
                  value={b.label}
                  className="mt-chip"
                  style={{ '--tier-color': tierVar(b.label) } as React.CSSProperties}
                >
                  {t(`mtier.${b.label}`)}
                </ToggleGroup.Item>
              ))}
            </ToggleGroup.Root>
          </span>
          <span className="mt-filter-label">{t('mtier.filterCompany')}</span>
          <span className="mt-filter-group">
            <button type="button" className={'mt-chip' + (offCos.length === 0 ? ' on' : '')} onClick={() => setOffCos([])}>
              {t('mtier.all')}
            </button>
            <ToggleGroup.Root
              type="multiple"
              className="mt-filter-group"
              aria-label={t('mtier.filterCompany')}
              value={companies.filter(([id]) => !offCos.includes(id)).map(([id]) => id)}
              onValueChange={(on) => setOffCos(companies.filter(([id]) => !on.includes(id)).map(([id]) => id))}
            >
              {companies.map(([id, name]) => (
                <ToggleGroup.Item key={id} value={id} className="mt-chip">
                  {companyName(name, id)}
                </ToggleGroup.Item>
              ))}
            </ToggleGroup.Root>
          </span>
          <span className="mt-count num">{t('mtier.shown', { n: shown.length, total: models.length })}</span>
        </div>
        <div className="ruler-body">
          {shown.length > 0 ? (
            <ScoreTierScatter
              bands={bands}
              cuts={cutMarks}
              tierLabel={(tier) => t(`mtier.${tier}`)}
              xLabel={t('mtier.xAxis')}
              items={shown.map<ScatterItem>((m) => ({
                key: `${m.company_id}-${m.model}`,
                label: shortModelName(m.model),
                x: m.score,
                score: m.score,
                tier: m.tier,
                company: m.company,
                companyId: m.company_id,
              }))}
            />
          ) : (
            <p className="hint">{t('mtier.none')}</p>
          )}
        </div>
      </section>
    </>
  )
}

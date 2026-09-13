import { Snapshot } from '../types'
import { companyName, useT } from '../i18n'
import ScoreTierScatter, { ScatterItem } from './ModelScatter'

/*
 * 概览的分布图：散点图，横轴分数、纵轴梯队等级。
 * 与「模型梯队」页共用 ScoreTierScatter——同一类数据（分数 + 档位）用同一张图，
 * 不因为对象是公司还是模型就换一种画法。
 *
 * 分界虚线用快照里的 model_tiers.cuts：那是「档位天数边界反解到分数轴」的位置，
 * 公司档位与模型档位共用同一组天数边界（100 / 200 / 300），所以分数切点相同。
 * 旧快照（schema ≤ 4）没有这个字段，取空数组即可。
 */
export default function TierRuler({
  snap,
  onOpen,
}: {
  snap: Snapshot
  onOpen: (companyId: string) => void
}) {
  const t = useT()
  const rows = [...snap.rows].sort((a, b) => a.d - b.d)
  const bands = snap.tier_bands
  // 公司图的横轴是「距前沿天数」，档位边界本身就是天数（0~100 / 100~200 / …），
  // 直接画在天数轴上；模型榜才需要把天数边界反解到分轴上。
  const cuts = snap.tier_bands
    .filter((b) => b.hi !== null)
    .map((b) => ({ at: b.hi as number, key: b.label }))

  return (
    <section className="block ruler" aria-label={t('ruler.title')}>
      <h2>{t('ruler.title')}</h2>
      <div className="ruler-body">
        <ScoreTierScatter
          bands={bands}
          cuts={cuts}
          tierLabel={(tier: string) => t(`tier.${tier}`)}
          xLabel={t('ruler.xAxis')}
          /* 20 天一格：100/200/300 仍是 20 的倍数，档位分界线自然落在刻度上；
             写 100 会把下界拽到 -100（用户反馈「-100 太多，-20 就够了」）。 */
          tickStep={20}
          items={rows.map<ScatterItem>((r) => ({
            key: r.company_id ?? r.name,
            label: companyName(r.name, r.company_id),
            x: r.d,
            score: r.score,
            tier: r.tier,
            company: r.name,
            companyId: r.company_id,
            model: r.model,
            distance: r.d,
            onPick: () => onOpen(r.company_id ?? r.name),
          }))}
        />
      </div>
    </section>
  )
}

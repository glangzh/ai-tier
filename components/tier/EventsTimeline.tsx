import { EventStream, ModelEvent } from '@/lib/tier/types'
import { t, useT } from '@/lib/tier/i18n'

/*
 * 模型家族与事件轴（EXT-05）。
 *
 * 形态选择：事件是「单实体 × 多个时点 × 带类型」，用**时间轴列表**。
 * 刻意**不叠加到能力曲线上**——那条曲线的纵轴是分数，而
 * 「评测版本变更」这类事件在曲线上并不表现为分数增减，
 * 叠上去会把两种不同含义的东西画在同一根轴上（AGENTS 第 5 条）。
 *
 * 按日期分组、组内按类型排序，让「同日发布 + 同日开放」读起来是一件事。
 */

const TYPE_KEY: Record<string, string> = {
  model_release: 'evt.typeRelease',
  benchmark_upgrade: 'evt.typeBenchmark',
  score_revision: 'evt.typeRevision',
  availability_change: 'evt.typeAvailability',
  model_renamed: 'evt.typeRevision',
  model_retired: 'evt.typeAvailability',
}

const STAGE_KEY: Record<string, string> = {
  preview: 'evt.stagePreview',
  official: 'evt.stageOfficial',
  api: 'evt.stageApi',
  general: 'evt.stageGeneral',
}

// 排序：先按日期升序，同日把「发布」放前（先有发布才有后续可用性变化）
const TYPE_ORDER: Record<string, number> = {
  model_release: 0,
  benchmark_upgrade: 1,
  score_revision: 2,
  availability_change: 3,
}

export default function EventsTimeline({
  stream,
  companyId,
}: {
  stream: EventStream | null
  companyId: string
}) {
  const t2 = useT()
  if (!stream) return null
  const mine = stream.events
    .filter((e) => e.company_id === companyId)
    .sort((a, b) =>
      a.date === b.date
        ? (TYPE_ORDER[a.type] ?? 9) - (TYPE_ORDER[b.type] ?? 9)
        : a.date.localeCompare(b.date),
    )
  if (!mine.length) {
    return (
      <section className="block evt">
        <h3>{t('evt.title')}</h3>
        <p className="hint">{t('evt.none')}</p>
      </section>
    )
  }

  const counts = stream.counts_by_company[companyId] ?? {}
  const total = mine.length
  const releases = counts.model_release ?? 0
  const bench = counts.benchmark_upgrade ?? 0

  // 按日期分组
  const groups: { date: string; items: ModelEvent[] }[] = []
  for (const e of mine) {
    const last = groups[groups.length - 1]
    if (last && last.date === e.date) last.items.push(e)
    else groups.push({ date: e.date, items: [e] })
  }

  return (
    <section className="block evt">
      <h3>{t('evt.title')}</h3>
      <p className="hint">{t('evt.desc')}</p>
      <p className="hint num">
        {t2('evt.summary', { total, release: releases, bench })}
      </p>

      <ol className="evt-list">
        {groups.map((g) => (
          <li className="evt-day" key={g.date}>
            <span className="evt-date num">{g.date}</span>
            <ul className="evt-items">
              {g.items.map((e) => (
                <li className={`evt-item ${e.type}`} key={e.id}>
                  <span className="evt-type">{t(TYPE_KEY[e.type] ?? e.type)}</span>
                  <span className="evt-model">{e.model}</span>
                  {e.benchmark && <span className="evt-bench num">{e.benchmark}</span>}
                  {typeof e.score === 'number' && (
                    <span className="evt-score num">
                      {t2('evt.scoreAt', { score: e.score })}
                    </span>
                  )}
                  {e.stage && (
                    <span className="evt-stage">{t(STAGE_KEY[e.stage] ?? e.stage)}</span>
                  )}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      <p className="hint">{t('evt.benchmarkNote')}</p>
    </section>
  )
}

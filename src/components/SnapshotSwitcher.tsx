import { Index } from '../types'
import { t, useT } from '../i18n'
import { Select } from './Controls'

export default function SnapshotSwitcher({
  index,
  value,
  onPick,
}: {
  index: Index
  value: string
  onPick: (asOf: string) => void
}) {
  const t = useT()
  // 按更新时间（数据截止日 as_of）倒序，最新在前
  const items = [...index.snapshots].sort((a, b) => b.as_of.localeCompare(a.as_of))
  const cur = items.find((s) => s.as_of === value)
  return (
    <div className="snap-switch shell">
      <label className="snap-label" htmlFor="snap-select">
        {t('snapshot.label')}
      </label>
      <Select
        value={value}
        onChange={onPick}
        ariaLabel={t('snapshot.label')}
        options={items.map((s) => ({
          value: s.as_of,
          label: `${s.as_of}${s.latest ? t('snapshot.latest') : ''}`,
          hint: s.benchmark,
        }))}
      />
      {cur && <span className="snap-meta">{t(cur.rows === 1 ? 'snapshot.rowOne' : 'snapshot.rows', { n: cur.rows })}</span>}
    </div>
  )
}

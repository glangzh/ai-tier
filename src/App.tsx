import { useEffect, useRef, useState } from 'react'
import { loadIndex, loadSnapshot } from './data'
import { Index, Snapshot } from './types'
import SnapshotSwitcher from './components/SnapshotSwitcher'
import TierBands from './components/TierBands'
import TierRuler from './components/TierRuler'
import FullTable from './components/FullTable'
import Notes from './components/Notes'
import Compare from './components/Compare'
import Trend from './components/Trend'
import CompanyCompare from './components/CompanyCompare'
import ModelTiers from './components/ModelTiers'
import CompanyDetail from './components/CompanyDetail'
import ThemeToggle from './components/ThemeToggle'
import LanguageToggle from './components/LanguageToggle'
import { t, useLang } from './i18n'

type Tab = 'overview' | 'compare' | 'trend' | 'company' | 'models' | 'notes'

export default function App() {
  const lang = useLang()
  const [index, setIndex] = useState<Index | null>(null)
  const [snaps, setSnaps] = useState<Record<string, Snapshot>>({})
  const [tab, setTab] = useState<Tab>('overview')
  const [detailId, setDetailId] = useState<string>('')
  const [viewAsOf, setViewAsOf] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)
  const headerRef = useRef<HTMLElement | null>(null)

  // 页头实际高度随字号/换行变化，写死会在侧栏吸顶时露出缝
  useEffect(() => {
    const el = headerRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const sync = () =>
      document.documentElement.style.setProperty('--header-h', `${el.offsetHeight}px`)
    sync()
    const ro = new ResizeObserver(sync)
    ro.observe(el)
    return () => ro.disconnect()
  }, [lang, loading])

  useEffect(() => {
    document.title = t('app.title')
    document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN'
  }, [lang])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    setIndex(null)
    setSnaps({})
    setViewAsOf('')

    loadIndex()
      .then(async (idx) => {
        const latest = idx.snapshots.find((s) => s.latest) ?? idx.snapshots[0]
        if (!latest) throw new Error(t('app.noSnapshot'))

        const map: Record<string, Snapshot> = {}
        await Promise.all(
          idx.snapshots.map(async (s) => {
            map[s.as_of] = await loadSnapshot(s.file)
          }),
        )

        if (!active) return
        setIndex(idx)
        setViewAsOf(latest.as_of)
        setSnaps(map)
      })
      .catch((e) => {
        if (!active) return
        setError(e instanceof Error ? e.message : '数据加载失败')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [retry])

  const view = viewAsOf ? snaps[viewAsOf] : null

  if (error) {
    return (
      <div className="load-state error" role="alert">
        <p>{t('app.loadFailedDetail', { error })}</p>
        <button className="retry" onClick={() => setRetry((n) => n + 1)}>
          {t('app.retry')}
        </button>
      </div>
    )
  }

  if (loading || !index || !view) {
    return (
      <div className="loading" role="status" aria-live="polite">
        {t('app.loading')}
      </div>
    )
  }

  return (
    <div className="app">
      <header className="top" ref={headerRef}>
        <div className="shell top-bar">
          <div className="brand">
            <h1>{t('app.title')}</h1>
          </div>
          <div className="top-actions">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <SnapshotSwitcher
        index={index}
        value={viewAsOf}
        onPick={(v) => {
          setViewAsOf(v)
          setDetailId('')
        }}
      />

      <TierBands snap={view} onOpen={(id) => { setTab('overview'); setDetailId(id) }} />

      <div className="layout shell">
        <nav className="sidenav" aria-label={t('app.navLabel')}>
          {([
            ['overview', 'nav.overview'],
            ['compare', 'nav.compare'],
            ['trend', 'nav.trend'],
            ['company', 'nav.company'],
            ['models', 'nav.models'],
            ['notes', 'nav.notes'],
          ] as [Tab, string][]).map(([key, label]) => (
            <button
              key={key}
              className={tab === key ? 'on' : ''}
              aria-current={tab === key ? 'page' : undefined}
              onClick={() => {
                setTab(key)
                setDetailId('')
              }}
            >
              {t(label)}
            </button>
          ))}
        </nav>

        <main className="content">
          {tab === 'overview' && !detailId && (
            <>
              <TierRuler snap={view} onOpen={setDetailId} />
              <FullTable snap={view} onOpen={setDetailId} />
            </>
          )}
          {tab === 'notes' && <Notes snap={view} />}
          {tab === 'overview' && detailId && (
            <CompanyDetail
              row={
                view.rows.find(
                  (r) => r.company_id === detailId || r.name === detailId,
                ) ?? view.rows[0]
              }
              reference={view.company_benchmarks?.references.find(
                (r) => r.id === detailId || r.name === detailId,
              )}
              frontierName={view.frontier.name}
              frontier={Object.entries(view.pools.main ?? {}).map(([model, [score, date]]) => ({
                model,
                score,
                date,
              }))}
              onBack={() => setDetailId('')}
            />
          )}
          {tab === 'compare' && <Compare index={index} snaps={snaps} />}
          {tab === 'trend' && <Trend index={index} snaps={snaps} />}
          {tab === 'company' && <CompanyCompare snap={view} />}
          {tab === 'models' && <ModelTiers snap={view} />}
        </main>
      </div>

      <footer className="foot shell">{t('app.footer')}</footer>
    </div>
  )
}

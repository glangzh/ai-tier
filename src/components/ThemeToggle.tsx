import { useEffect, useState } from 'react'
import { IconMoon, IconSun } from './icons'
import { t, useLang } from '../i18n'
import { SegGroup } from './Controls'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'tier-theme'

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
}

function readTheme(): Theme {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'dark' || saved === 'light') return saved
  // 首访按系统偏好定一次，之后由用户显式选择，不再跟随
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** 主题切换：两态图标按钮（浅色 / 深色），不做「跟随系统」。 */
export default function ThemeToggle() {
  const lang = useLang()
  const [theme, setTheme] = useState<Theme>(() => readTheme())

  useEffect(() => {
    applyTheme(theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const options: { key: Theme; title: string; icon: JSX.Element }[] = [
    { key: 'light', title: t('theme.sunTitle'), icon: <IconSun /> },
    { key: 'dark', title: t('theme.moonTitle'), icon: <IconMoon /> },
  ]

  return (
    <div data-lang={lang}>
      <SegGroup
        ariaLabel={t('theme.label')}
        value={theme}
        onChange={(v) => setTheme(v)}
        options={options.map((o) => ({ value: o.key, label: o.icon, tip: o.title }))}
      />
    </div>
  )
}

import { switchLang, useLang } from '../i18n'
import { SegGroup } from './Controls'

/** 语言切换：单图标 + 双字母，紧凑且不需要解释。单选分段控件交给 Radix ToggleGroup。 */
export default function LanguageToggle() {
  const lang = useLang()
  return (
    <SegGroup
      ariaLabel="Language"
      value={lang}
      onChange={(v) => switchLang(v)}
      options={[
        { value: 'zh', label: '中', tip: '中文' },
        { value: 'en', label: 'EN', tip: 'English' },
      ]}
    />
  )
}

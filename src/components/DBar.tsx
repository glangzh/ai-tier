import { getLang, translate } from '../i18n'

// 颜色统一取自令牌层，随主题切换；组件内不再出现具体色值。
// 档位色只用于「档位」这一语义；图表与进度条用强调色，避免五套色相互打架。
export const TIER_VAR: Record<string, string> = {
  T1: 'var(--t1)',
  T2: 'var(--t2)',
  T3: 'var(--t3)',
  T4: 'var(--t4)',
}

export const tierVar = (tier: string) => TIER_VAR[tier] ?? 'var(--ink-3)'

/** 档位浅底（卡片/徽标外环用） */
export const tierBgVar = (tier: string) => `var(--${tier.toLowerCase()}-bg)`

/** 梯队名：T1-T4 是通用代号，名称用于阅读。
 *  与 companyName 一样必须显式传当前语言——缺省是 zh，会让英文界面残留中文。 */
export const tierName = (tier: string, lang?: 'zh' | 'en') => translate(`tier.${tier}`, undefined, lang ?? getLang())

export default function DBar({ d, max, tier }: { d: number; max: number; tier: string }) {
  const pct = Math.max(0, Math.min(100, (d / Math.max(max, 1)) * 100))
  // 进度条统一用强调色；档位色只出现在徽标与行首竖条，避免同屏五套色
  const color = 'var(--accent)'
  return (
    <div className="dbar">
      <span className="dbar-track">
        <span className="dbar-fill" style={{ width: `${pct}%`, background: color }} />
      </span>
      <span className="dbar-val">{d}</span>
    </div>
  )
}

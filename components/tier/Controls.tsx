import { ReactNode } from 'react'
import * as RSelect from '@radix-ui/react-select'
import * as ToggleGroup from '@radix-ui/react-toggle-group'

/*
 * 两个共享控件：Radix 原语负责行为与可访问性，本文件只上站内样式。
 *
 * - Select：替换原生 <select>。原生下拉的弹层样式各浏览器不同、无法与站内统一
 *   （快照选择、公司对比的参照公司、快照对比的两端都用它）。
 * - SegGroup：单选分段控件，替换手写的「一组 button + aria-pressed」
 *   （语言切换、主题切换）。Radix 负责 roving tabindex 与方向键。
 */
export type Opt = { value: string; label: string; hint?: string }

export function Select({
  value,
  onChange,
  options,
  ariaLabel,
  size = 'md',
}: {
  value: string
  onChange: (v: string) => void
  options: Opt[]
  ariaLabel?: string
  size?: 'sm' | 'md'
}) {
  const current = options.find((o) => o.value === value)
  return (
    <RSelect.Root value={value} onValueChange={onChange}>
      <RSelect.Trigger className={`sel sel-${size}`} aria-label={ariaLabel}>
        <RSelect.Value>
          <span className="sel-label">{current?.label ?? value}</span>
          {current?.hint && <span className="sel-hint">{current.hint}</span>}
        </RSelect.Value>
        <RSelect.Icon className="sel-caret" aria-hidden="true">
          <svg width="10" height="10" viewBox="0 0 10 10">
            <path d="M1 3.5 5 7.5 9 3.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </RSelect.Icon>
      </RSelect.Trigger>
      <RSelect.Portal>
        <RSelect.Content className="sel-menu" position="popper" sideOffset={6} collisionPadding={12}>
          <RSelect.Viewport className="sel-viewport">
            {options.map((o) => (
              <RSelect.Item key={o.value} value={o.value} className="sel-item">
                <RSelect.ItemIndicator className="sel-tick" aria-hidden="true">
                  <svg width="11" height="11" viewBox="0 0 12 12">
                    <path d="M2 6.4 4.6 9 10 3.2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </RSelect.ItemIndicator>
                <RSelect.ItemText>
                  <span className="sel-label">{o.label}</span>
                  {o.hint && <span className="sel-hint">{o.hint}</span>}
                </RSelect.ItemText>
              </RSelect.Item>
            ))}
          </RSelect.Viewport>
        </RSelect.Content>
      </RSelect.Portal>
    </RSelect.Root>
  )
}

export function SegGroup<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: ReactNode; tip?: string }[]
  ariaLabel: string
}) {
  return (
    <ToggleGroup.Root
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v as T)}
      className="seg"
      aria-label={ariaLabel}
    >
      {options.map((o) => (
        <ToggleGroup.Item key={o.value} value={o.value} className="seg-item" aria-label={o.tip}>
          {o.label}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  )
}

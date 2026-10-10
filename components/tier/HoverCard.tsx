import { ReactNode } from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'

/*
 * 悬停提示：用 Radix Tooltip 原语，不自己写定位/翻转/延迟逻辑。
 *
 * 分工：
 *  - Radix 负责行为：指针与键盘焦点触发、延迟、碰撞检测与自动翻转、portal、关闭动画
 *  - 本文件只负责外观：用站内的 --surface / --line-strong / --r-md / --fs-* / --shadow-2 上样式，
 *    与卡片、按钮、芯片同一套视觉语言
 *
 * 为什么不用原生 title：字体、圆角、留白、换行全由浏览器决定，与站内设计体系脱节。
 */
export function TooltipHost({ children }: { children: ReactNode }) {
  return (
    <Tooltip.Provider delayDuration={160} skipDelayDuration={300}>
      {children}
    </Tooltip.Provider>
  )
}

export function HoverTip({
  content,
  children,
  side = 'top',
}: {
  content: ReactNode
  children: ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
}) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content className="tip" side={side} sideOffset={8} collisionPadding={12}>
          {content}
          <Tooltip.Arrow className="tip-arrow" width={12} height={6} />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}

/** 提示内容：主行（名称）+ 若干「键 / 值」行。各处统一用它，提示框结构才一致。 */
export function TipInfo({ name, rows }: { name: string; rows?: [string, string | number][] }) {
  return (
    <>
      <span className="tip-name">{name}</span>
      {rows && rows.length > 0 && (
        <span className="tip-rows">
          {rows.flatMap(([k, v]) => [
            <span className="tip-key" key={`k:${k}`}>
              {k}
            </span>,
            <span className="tip-val" key={`v:${k}`}>
              {v}
            </span>,
          ])}
        </span>
      )}
    </>
  )
}

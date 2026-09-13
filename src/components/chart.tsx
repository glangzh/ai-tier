import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * 容器宽度侦测：SVG 用 viewBox 定几何，
 * 宽度变化时在宽/窄两套布局之间切换，避免整图缩放把字号压小。
 */
export function useBoxWidth<T extends HTMLElement>(opts?: { converge?: boolean }) {
  const ref = useRef<T | null>(null)
  const [width, setWidth] = useState(0)
  const converge = opts?.converge === true
  const frame = useRef(0)

  const read = useCallback(
    () => {
      const el = ref.current
      return el ? Math.round(el.getBoundingClientRect().width) : 0
    },
    [],
  )

  useEffect(() => {
    // 只在宽度真的变化时写 state，避免每帧 setState 触发无限渲染
    const sync = () => setWidth((prev) => (prev === read() ? prev : read()))
    sync()

    if (!converge) {
      window.addEventListener('resize', sync)
      if (typeof ResizeObserver === 'undefined') {
        return () => window.removeEventListener('resize', sync)
      }
      const el = ref.current
      const ro = new ResizeObserver(sync)
      if (el) ro.observe(el)
      return () => {
        window.removeEventListener('resize', sync)
        ro.disconnect()
      }
    }

    // 收敛模式：视口刚变化时读到的宽度可能是旧值，连续两帧一致才认为稳定。
    // 依赖方在收敛前隐藏内容，用户看不到中间态。
    let alive = true
    let last = -1
    let tries = 0
    const step = () => {
      if (!alive) return
      const w = read()
      setWidth((prev) => (prev === w ? prev : w))
      tries += 1
      if (w === last || tries >= 12) return
      last = w
      frame.current = requestAnimationFrame(step)
    }
    frame.current = requestAnimationFrame(step)
    return () => {
      alive = false
      cancelAnimationFrame(frame.current)
    }
  }, [converge, read])

  return [ref, width] as const
}

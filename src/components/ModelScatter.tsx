import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { Snapshot } from '../types'
import { companyName, useT } from '../i18n'
import { tierVar } from './DBar'
import { HoverTip, TipInfo } from './HoverCard'

/*
 * 散点图：横轴由调用方给（模型页=分数，公司页=距前沿天数），纵轴梯队等级。
 *
 * 量纲必须跟着数据走：模型用「分数」衡量（模型没有「距前沿多少天」这个量），
 * 公司用「距前沿天数」衡量（档位定义本身就是天数区间 0~100 / 100~200 / …）。
 * 这张图曾复用到公司页时仍按分数定位，于是横轴是分、纵轴档位是天数，
 * 两套量纲混在一张图上（用户发现的 bug）。
 *
 * 布局（每条都是踩坑后定下的）：
 *  1) 点与标签用 HTML 绝对定位——SVG 的 viewBox 会整体缩放，窄屏字被压小。
 *  2) 两遍布局：先量标签**真实宽度**，再定位与分层；靠估会在英文长名下叠字。
 *  3) 轴范围**跟随数据**（两端各留 1 分）：写死 15~55 时数据只占横向 67%，两侧留白过多。
 *  4) 分层判据是「标签 + 点」作为一个整体的实测区间；同层不重叠。
 *  5) 网格区（plotL→plotR）几乎占满整幅：左侧只让出带名列（边距 6 + 最宽带名 + 间隙 6），
 *     右侧只让刻度数字的半宽（10）。**不按标签宽度预留**——那是死区：按最宽标签全宽
 *     会让网格区左移 108px，按端点标签半宽也会在两端各空 40~50px（用户两次反馈「两边空间太大」）。
 *     端点标签会伸进边距（左端伸到带名列下方、右端伸到图外），由外层裁掉。
 *  6) 纵带名贴带首行左对齐（原来带内垂直居中，名字离自己的点很远）。
 *  7) 点钳制在网格区内；标签允许伸进边距，由外层裁掉。
 *  8) 标签名去掉配置后缀（max/high/…）后再上图：短名同层能多放，图才不至于又高又窄；
 *     完整名（含厂商、配置、分数）走 hover 的 title。
 */
/* 轴两端各留几分。写 1 分时轴范围顶到数据最大值，端点标签只能靠内移硬塞，
   实测右侧要内移 20px 才不出框；留 3 分（≈100px）后端点标签自然放得下。 */
const AXIS_PAD = 3
const MIN_PLOT_W = 420
const BAND_TOP = 16 // 带顶：带名贴在这里，点从名称下面开始
const BAND_PAD = 12 // 带底留白：带与带之间靠它分开
const NAME_MAX_W = 146 // 与 .mscatter-name 的 max-width 一致；单行放不下才省略，hover 看全名
const NAME_COL_GAP = 14 // 带名列与网格区的间隙
const PAD_L = 10 // 网格区左端到图左缘
const PAD_R = 14 // 网格区右端到图右缘（刻度是居中的，要留数字半宽）
const EDGE_KEEP = 12 // 标签整块留在图内：距图左右缘至少留这么多
const LABEL_GAP = 8 // 同层相邻标签的最小间距（小于 8px 就糊成一片）
const TICK_LEN = 6 // 刻度线
const AXIS_GAP = 8 // 刻度线到刻度数字
const AXIS_TITLE_GAP = 22 // 刻度数字顶到轴标题顶
const NAME_LINE_H = 15 // 单行文字高（12px × 1.25）
const DOT_H = 9
const DOT_GAP = 2
const LEVEL_GAP = 1 // 层与层之间
const DOT_RING = 2 // 点的描边环外扩（box-shadow 不占布局，但会压到邻居）
/* 单行标签：层高固定 = 文字 + 间隙 + 点 + 环余量。
   标签一旦允许折行，层高就要翻倍，34 个标签足以把图撑到一屏放不下（实测 1394px）。 */
const levelH = () => NAME_LINE_H + DOT_GAP + DOT_H + DOT_RING

export interface ScatterItem {
  key: string
  label: string
  /** 横轴定位用的值：模型页传分数，公司页传距前沿天数 */
  x: number
  tier: string
  company?: string
  companyId?: string
  model?: string
  /** 距前沿天数（公司点才有；模型榜的横轴就是它） */
  distance?: number
  /** AA 分（公司点按天数定位，但详情里仍值得给出分数） */
  score?: number
  onPick?: () => void
}

function textWidth(text: string, font: string) {
  const holder = textWidth as unknown as { ctx?: CanvasRenderingContext2D }
  if (!holder.ctx) holder.ctx = document.createElement('canvas').getContext('2d') ?? undefined
  const ctx = holder.ctx
  if (!ctx) return text.length * 8
  ctx.font = font
  return ctx.measureText(text).width
}

export default function ScoreTierScatter({
  items,
  bands,
  cuts,
  tierLabel,
  xLabel,
  tickStep: tickStepProp,
}: {
  items: ScatterItem[]
  bands: Snapshot['tier_bands']
  /** 分界线在横轴上的位置 */
  cuts: { at: number; key?: string | number }[]
  tierLabel: (tier: string) => string
  /** 横轴名称（模型页=分数；公司页=距前沿天数），单位写在这里，刻度只留数字 */
  xLabel: string
  tickStep?: number
}) {
  const t = useT()
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const labelRefs = useRef<Record<string, HTMLElement | null>>({})
  const [geom, setGeom] = useState<{ w: number; widths: Record<string, number>; dx: Record<string, number>; lines: Record<string, number> }>(
    { w: 0, widths: {}, dx: {}, lines: {} },
  )

  const measure = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    // 用外层可视宽：在滚动容器内部测会读到滚动内容宽，形成自反馈
    const w = Math.round(el.clientWidth)
    const widths: Record<string, number> = {}
    const dx: Record<string, number> = {}
    const lines: Record<string, number> = {}
    for (const [key, node] of Object.entries(labelRefs.current)) {
      if (!node) continue
      const box = node.getBoundingClientRect()
      widths[key] = box.width
      // 真实换行几何：Range 的每个矩形是一行文字，行宽 = 墨迹宽，行盒中线 = 墨迹中线。
      // 布局必须用这个，不能用 canvas 估算——估算与渲染一旦不同源，层判定就会错位（实测重叠）。
      const rng = document.createRange()
      rng.selectNodeContents(node)
      const rects = [...rng.getClientRects()]
      if (!rects.length) {
        dx[key] = 0
        lines[key] = 1
        continue
      }
      lines[key] = rects.length
      const l = Math.min(...rects.map((r) => r.left))
      const r = Math.max(...rects.map((x) => x.right))
      widths[key] = r - l
      dx[key] = (l + r) / 2 - (box.left + box.width / 2)
    }
    setGeom((prev) => {
      const keys = Object.keys(widths)
      const same =
        prev.w === w &&
        keys.length === Object.keys(prev.widths).length &&
        keys.every(
          (k) =>
            Math.abs((prev.widths[k] ?? -1) - widths[k]) < 0.5 &&
            Math.abs((prev.dx[k] ?? 0) - dx[k]) < 0.5 &&
            prev.lines[k] === lines[k],
        )
      return same ? prev : { w, widths, dx, lines }
    })
  }, [])

  useLayoutEffect(() => {
    let alive = true
    let tries = 0
    const step = () => {
      if (!alive) return
      measure()
      if (++tries < 6) requestAnimationFrame(step)
    }
    step()
    window.addEventListener('resize', step)
    return () => {
      alive = false
      window.removeEventListener('resize', step)
    }
  }, [measure, items])

  const W = Math.max(geom.w || 1000, MIN_PLOT_W)
  const nameFont = '600 12px -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif'
  const labelFont = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif'
  const widestName = bands.reduce((m, b) => Math.max(m, textWidth(tierLabel(b.label), nameFont)), 0)
  // 每个标签按换行后的**实际渲染宽度**参与布局（不是被 max-width 钳到的 108）
  // 单行显示：宽度 = min(文字实测宽, max-width)，行数恒为 1。
  // 首帧还没有实测值时用 canvas 估算兜一下。
  const labelW: Record<string, number> = {}
  for (const m of items) {
    const text = m.label
    labelW[m.key] = Math.min(geom.widths[m.key] ?? textWidth(text, labelFont), NAME_MAX_W, W)
  }

  // 轴范围：数据范围两端各留 AXIS_PAD，再**向外取整到刻度步长的整数倍**。
  // 这是站内既有的技巧（AGENTS.md「轴范围不要顶到数据最大值」）：
  //   · 顶到数据最大值 → 端点标签没有落点，只能被迫内移或顶出图框；
  //   · 取整到步长倍数 → 两端自动有呼吸位，且每个刻度都是整数、与网格线对齐。
  // 先按整数尺度的 pad 估步长（避免用取整后的范围反过来把步长撑大）。
  const xs = [...items.map((m) => m.x), ...cuts.map((c) => c.at)]
  const dataLo = Math.min(...xs)
  const dataHi = Math.max(...xs)
  // 刻度步长：优先用调用方给的（天数轴 20），否则按可读格数自适应。
  // 判据用「取整后还剩几格」而不是「原始范围几格」——取整会把轴拉长，
  // 用原始范围判会选出偏小的步长（实测选出 2，得到 5/10/15 这种刻度）。
  const rough = (dataHi - dataLo + AXIS_PAD * 2)
  const roughStep = tickStepProp ?? [10, 5, 2, 1].find((st) => Math.ceil(rough / st) <= 5) ?? 1
  // 两端向外取整到步长倍数；若取整后余量不足**半格**，再外扩一格。
  // （「不足半格」才扩，不是「不够一格就扩」——后者会无条件 +1 格：
  //   19~53 分取整到 10~60 本来就够，再 +1 格变 70，数据只剩 52% 图宽。）
  const snapLo = (v: number) => {
    const x = Math.floor((v - AXIS_PAD) / roughStep) * roughStep
    return dataLo - x < roughStep / 2 ? x - roughStep : x
  }
  const snapHi = (v: number) => {
    const x = Math.ceil((v + AXIS_PAD) / roughStep) * roughStep
    return x - dataHi < roughStep / 2 ? x + roughStep : x
  }
  const axisLo = snapLo(dataLo)
  const axisHi = snapHi(dataHi)
  // 网格区几乎占满整幅：左侧只让出带名列，右侧只让刻度数字的半宽。
  // 不再按端点标签的半宽预留——那会在两端各空出 40~50px 死区（用户反馈「两边空间太大」）。
  const plotL = PAD_L + widestName + NAME_COL_GAP
  const plotR = W - PAD_R
  const xOf = (v: number) => plotL + ((v - axisLo) / (axisHi - axisLo)) * (plotR - plotL)
  const tickStep = roughStep
  const ticks: number[] = []
  for (let i = 0; ; i++) {
    const v = axisLo + i * tickStep
    if (v > axisHi + 1e-9) break
    ticks.push(Number(v.toFixed(6)))
  }

  // 分层 + 定层高，一趟算完。
  // 层高按**该层实际内容**（含折行），层序按下标——不能先只按横向冲突分层、
  // 再回头按层号算高度：那样中间会留出空层，每层白占 NAME_LINE_H 高度的空档，
  // 实测把图从 692px 撑到 1559px（Math.max(...[]) 是 -Infinity，被兜底值掩盖了）。
  const rows = bands.map((b) => {
    const list = items.filter((m) => m.tier === b.label).sort((a, c) => a.x - c.x)
    const levels: { l: number; r: number; h: number }[][] = []
    const placed = list.map((m) => {
      const w = labelW[m.key]
      const h = levelH() // 单行标签，层高固定
      // 点在分数上的位置（钳在网格区内）
      const cx0 = Math.min(Math.max(xOf(m.x), plotL), plotR)
      // 标签整块必须留在图内：文字不能被图框切掉（用户明确要求）。
      // 夹取要用**外框宽**：折行标签的外框等于 NAME_MAX_W，比实测墨迹宽最多 17px，
      // 只按墨迹夹的话外框仍会越界（实测仍有 1 个标签被裁）。
      const boxW = Math.max(w, geom.widths[m.key] ?? 0)
      const cx = Math.min(Math.max(cx0 - (geom.dx[m.key] ?? 0), EDGE_KEEP + boxW / 2), W - EDGE_KEEP - boxW / 2)
      const labelCx = cx + (geom.dx[m.key] ?? 0)
      // 冲突判据用**墨迹**左右端（盒宽对折行标签会多算 20px+，把本可同层的推开）
      const l = labelCx - w / 2
      const r = labelCx + w / 2
      // 装箱：在**所有**能放下的层里选「留下的空档最小」的那层，而不是第一个放得下的。
      // 首个放得下会让后面的项无处可去（实测平均每层只有 1.48 个标签）。
      let idx = -1
      let bestWaste = Infinity
      for (let i = 0; i < levels.length; i++) {
        const mem = levels[i]
        let ok = true
        for (const sp of mem) if (!(r + LABEL_GAP <= sp.l || l >= sp.r + LABEL_GAP)) { ok = false; break }
        if (!ok) continue
        const waste = mem.reduce((a, sp) => a + Math.max(0, Math.min(sp.r, r) - Math.max(sp.l, l)), 0)
        if (waste < bestWaste) { bestWaste = waste; idx = i }
      }
      if (idx === -1) {
        idx = levels.length
        levels.push([])
      }
      levels[idx].push({ l, r, h })
      return { ...m, cx, level: idx, w, h, y: 0 }
    })
    // 同层内按左端排序，从左往右把间距推到 LABEL_GAP；
    // 只做“向右让”，不改变点的位置（点的 x 已定，标签的墨水中心会随 cx 一起移动）。
    const byLevel = new Map<number, typeof placed>()
    for (const p of placed) {
      const arr = byLevel.get(p.level) ?? []
      arr.push(p)
      byLevel.set(p.level, arr)
    }
    for (const arr of byLevel.values()) {
      arr.sort((a, b) => a.cx - a.w / 2 - (b.cx - b.w / 2))
      for (let i = 1; i < arr.length; i++) {
        const prev = arr[i - 1]
        const cur = arr[i]
        const prevR = prev.cx - prev.w / 2 + prev.w
        const curL = cur.cx - cur.w / 2
        const need = prevR + LABEL_GAP - curL
        if (need > 0) cur.cx += need
      }
      // 右端若被推出图框，整体左移回来
      const last = arr[arr.length - 1]
      const over = last.cx + last.w / 2 - (W - EDGE_KEEP)
      if (over > 0) for (const p of arr) p.cx -= over
      const first = arr[0]
      const under = EDGE_KEEP - (first.cx - first.w / 2)
      if (under > 0) for (const p of arr) p.cx += under
    }
    return { band: b, placed, levels }
  })

  const rowTops: number[] = []
  const rowHeights: number[] = []
  let acc = 0
  for (const r of rows) {
    const levelY: number[] = []
    let ly = BAND_TOP
    for (const mem of r.levels) {
      levelY.push(ly)
      ly += Math.max(...mem.map((x) => x.h), levelH()) + LEVEL_GAP
    }
    r.placed.forEach((p) => {
      p.y = levelY[p.level] + p.h / 2
    })
    rowTops.push(acc)
    const h = ly - LEVEL_GAP + BAND_PAD
    rowHeights.push(h)
    acc += h
  }
  const plotBottom = acc
  const axisBlock = AXIS_GAP + TICK_LEN + 12 + AXIS_TITLE_GAP + 14
  const totalH = plotBottom + axisBlock
  const ready = geom.w > 0 && rows.every((r) => r.placed.every((p) => geom.widths[p.key] !== undefined))

  return (
    <div className="mscatter-scroll" ref={scrollRef}>
      <div className="mscatter" style={{ width: W, height: totalH, visibility: ready ? 'visible' : 'hidden' }}>
        <svg className="mscatter-bg" width="100%" height={totalH} viewBox={`0 0 ${W} ${totalH}`} preserveAspectRatio="none" aria-hidden="true">
          {ticks.map((v) => (
            <line key={`g${v}`} x1={xOf(v)} y1={0} x2={xOf(v)} y2={plotBottom} stroke="var(--line)" strokeWidth="1" strokeDasharray="2 4" />
          ))}
          {rows.map((r, i) => {
            const top = rowTops[i]
            const h = rowHeights[i]
            return (
              <g key={r.band.label}>
                <rect x={plotL} y={top} width={Math.max(plotR - plotL, 0)} height={Math.max(h - 1, 0)} fill={tierVar(r.band.label)} opacity="0.05" />
                <text x={8} y={top + 13} fontSize="12" fontWeight="600" fill={tierVar(r.band.label)} textAnchor="start">
                  {tierLabel(r.band.label)}
                </text>
              </g>
            )
          })}
          {cuts.map((c) => (
            <line key={c.key ?? c.at} x1={xOf(c.at)} y1={0} x2={xOf(c.at)} y2={plotBottom} stroke="var(--line-strong)" strokeWidth="1" strokeDasharray="4 4" />
          ))}
          <line x1={plotL} y1={plotBottom + AXIS_GAP} x2={plotR} y2={plotBottom + AXIS_GAP} stroke="var(--line-strong)" strokeWidth="1" />
          {ticks.map((v) => (
            <g key={`t${v}`}>
              <line x1={xOf(v)} y1={plotBottom + AXIS_GAP} x2={xOf(v)} y2={plotBottom + AXIS_GAP + TICK_LEN} stroke="var(--line-strong)" strokeWidth="1" />
              <text x={xOf(v)} y={plotBottom + AXIS_GAP + TICK_LEN + 12} fontSize="11" fill="var(--muted)" textAnchor="middle" className="num">
                {v}
              </text>
            </g>
          ))}
          <text
            x={(plotL + plotR) / 2}
            y={plotBottom + AXIS_GAP + TICK_LEN + 12 + AXIS_TITLE_GAP}
            fontSize="11"
            fill="var(--muted)"
            textAnchor="middle"
          >
            {xLabel}
          </text>
        </svg>

        {rows.map((r, i) =>
          r.placed.map((p) => (
            <HoverTip
              content={
                <TipInfo
                  name={p.label}
                  rows={[
                    [t('mtier.filterCompany'), companyName(p.company ?? '', p.companyId)],
                    ...(p.model ? ([[t('col.model'), p.model]] as [string, string][]) : []),
                    ...(typeof p.distance === 'number'
                      ? ([[t('col.toFrontier'), t('unit.days', { n: p.distance })]] as [string, string][])
                      : []),
                    ...(typeof p.score === 'number'
                      ? ([[t('col.score'), String(p.score)]] as [string, string][])
                      : []),
                    [t('mtier.yAxis'), tierLabel(p.tier)],
                  ]}
                />
              }
            >
              <span
                className={'mscatter-pt' + (p.onPick ? ' clickable' : '')}
              key={p.key}
              ref={(node) => {
                labelRefs.current[p.key] = node
              }}
              style={{ left: p.cx, top: rowTops[i] + p.y }}
              onClick={p.onPick}
              role={p.onPick ? 'button' : undefined}
              tabIndex={p.onPick ? 0 : undefined}
              onKeyDown={
                p.onPick
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        p.onPick?.()
                      }
                    }
                  : undefined
              }
            >
                <span className="mscatter-name">{p.label}</span>
                <i className="mscatter-dot" style={{ background: tierVar(p.tier) }} />
              </span>
            </HoverTip>
          )),
        )}

      </div>
    </div>
  )
}

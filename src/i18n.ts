/* ==============================================================================
   消息目录
   ------------------------------------------------------------------------------
   界面上出现的每一句话都必须来自这里。
   规则：
     · key 用 区块.用途，不用句子的英文翻译当 key；
     · 中文版本是当前唯一真相源，改动会直接体现在界面上；
     · 每条都必须同时有 zh 与 en——缺 en 由构建期校验拦下（第 4 阶段启用）；
     · 参数用 {name} 占位，由 t(key, params) 替换。
   ============================================================================== */

import { useEffect, useState } from 'react'
import { dataMessages } from './i18n.data'

export interface Message {
  zh: string
  en: string
}

export const messages: Record<string, Message> = {
  // ---- 导航与页头 ----
  'app.title': { zh: 'AI 公司发展格局', en: 'AI Company Landscape' },
  'app.navLabel': { zh: '页面导航', en: 'Sections' },
  'nav.overview': { zh: '概览', en: 'Overview' },
  'company.landscape': { zh: 'AI 公司梯队', en: 'AI company tiers' },
  'nav.compare': { zh: '快照对比', en: 'Snapshot comparison' },
  'nav.trend': { zh: '追赶趋势', en: 'Catch-up trend' },
  'nav.company': { zh: '公司对比', en: 'Company comparison' },
  'nav.models': { zh: '模型梯队', en: 'Model tiers' },
  'nav.notes': { zh: '说明', en: 'About' },
  'app.footer': { zh: '数据来源 Artificial Analysis', en: 'Source: Artificial Analysis' },
  'app.loading': { zh: '加载中…', en: 'Loading…' },
  'app.loadFailed': { zh: '数据加载失败', en: 'Failed to load data' },
  'app.loadFailedDetail': { zh: '数据加载失败：{error}', en: 'Failed to load data: {error}' },
  'app.noSnapshot': { zh: '没有可用的历史快照', en: 'No snapshot available' },
  'app.retry': { zh: '重试', en: 'Retry' },

  // ---- 主题 ----
  'theme.label': { zh: '主题', en: 'Theme' },
  'theme.light': { zh: '浅色', en: 'Light' },
  'theme.dark': { zh: '深色', en: 'Dark' },
  'lang.label': { zh: '语言', en: 'Language' },
  'lang.zh': { zh: '中文', en: '中文' },
  'lang.en': { zh: 'EN', en: 'EN' },
  'theme.sunTitle': { zh: '切换到浅色', en: 'Switch to light' },
  'theme.moonTitle': { zh: '切换到深色', en: 'Switch to dark' },

  // ---- 快照切换 ----
  'snapshot.label': { zh: '历史快照', en: 'Snapshot' },
  'snapshot.latest': { zh: '· 最新', en: '· latest' },
  'snapshot.rows': { zh: '{n} 家', en: '{n} companies' },
  'snapshot.rowOne': { zh: '{n} 家', en: '{n} company' },

  // ---- 表格表头 ----
  'col.company': { zh: '厂商', en: 'Company' },
  'col.model': { zh: '旗舰模型', en: 'Flagship model' },
  'col.modelShort': { zh: '模型', en: 'Model' },
  'col.companyShort': { zh: '公司', en: 'Company' },
  'col.score': { zh: 'AA 分', en: 'AA score' },
  'col.dt': { zh: '节奏差（天）', en: 'Pacing gap (days)' },
  'col.g': { zh: '能力差（天）', en: 'Capability gap (days)' },
  'col.total': { zh: '总差距（天）', en: 'Total gap (days)' },
  /** 悬停提示里的“距前沿”：与表头 col.total 同一个量，但提示里不写单位后缀 */
  'col.toFrontier': { zh: '距前沿', en: 'To frontier' },
  'col.tier': { zh: '档位', en: 'Tier' },
  'col.date': { zh: '发布日', en: 'Released' },
  'col.currentTier': { zh: '当前梯队', en: 'Tier' },
  'col.vsReference': { zh: '相对参照公司', en: 'vs. reference' },
  'col.referenceGap': { zh: '{date} 差距', en: 'Gap {date}' },
  'col.gapChange': { zh: '差距变化', en: 'Gap change' },
  'col.tierChange': { zh: '档位变化', en: 'Tier change' },
  'col.compare': { zh: '较上一代', en: 'vs. previous' },
  'col.dataKind': { zh: '数据', en: 'Data' },
  'col.rank': { zh: '#', en: '#' },

  // ---- 单位与量词 ----
  'unit.days': { zh: '{n} 天', en: '{n} d' },
  'unit.daysRange': { zh: '{lo}~{hi} 天', en: '{lo}–{hi} d' },
  'unit.months': { zh: '约 {n} 个月', en: 'about {n} months' },
  'unit.tierRange': { zh: '{lo}~{hi}（天）', en: '{lo}–{hi} d' },
  'unit.tierRangeOpen': { zh: '大于 {lo}（天）', en: 'over {lo} d' },
  'unit.companies': { zh: '{n} 家', en: '{n} companies' },
  'unit.companyOne': { zh: '{n} 家', en: '{n} company' },
  // 梯队名：T1-T4 是图表与表格的通用代号，名称用于阅读
  'tier.T1': { zh: '前沿', en: 'Frontier' },
  'tier.T2': { zh: '领先', en: 'Leading' },
  'tier.T3': { zh: '跟随', en: 'Following' },
  'tier.T4': { zh: '追赶', en: 'Catching up' },
  // 模型档位名：按能力水平分级，与公司档位（时间差）分开命名
  'mtier.T1': { zh: '前沿', en: 'Frontier' },
  'mtier.T2': { zh: '旗舰', en: 'Flagship' },
  'mtier.T3': { zh: '优秀', en: 'Strong' },
  'mtier.T4': { zh: '及格', en: 'Fair' },
  // 模型分档带头部：名称 +（分数判据）
  'mtier.title': { zh: '{name}（分数 {op} {n}）', en: '{name} (score {op} {n})' },
  'mtier.titleOpen': { zh: '{name}（分数 {op} {n}）', en: '{name} (score {op} {n})' },
  'mtier.plotTitle': { zh: '模型分布', en: 'Model distribution' },
  'mtier.yAxis': { zh: '梯队', en: 'Tier' },
  'mtier.filterTier': { zh: '梯队', en: 'Tier' },
  'mtier.filterCompany': { zh: '厂商', en: 'Company' },
  'mtier.all': { zh: '全部', en: 'All' },
  'mtier.none': { zh: '没有符合筛选的模型', en: 'No models match the filter' },
  'mtier.shown': { zh: '显示 {n} / {total} 个模型', en: 'Showing {n} of {total} models' },
  'mtier.xAxis': { zh: '分数', en: 'Score' },
  /** 公司图的横轴是距前沿天数（档位边界就是天数），不是分数 */
  'ruler.xAxis': { zh: '距前沿（天）', en: 'Distance to frontier (days)' },
  // 分数判据模板：中文用「分」，英文用 score；比较符号沿用数学记号
  'mtier.ruleOpen': { zh: '分 > {n}', en: 'score > {n}' },
  'mtier.ruleTop': { zh: '{lo} < 分 ≤ {hi}', en: '{lo} < score ≤ {hi}' },
  'mtier.ruleLow': { zh: '分 ≤ {n}', en: 'score ≤ {n}' },
  // 分档带头部：名称（代号：区间）
  'band.title': { zh: '{name}（{tier}：{lo}~{hi}）', en: '{name} ({tier}: {lo}–{hi})' },
  'band.titleOver': { zh: '{name}（{tier}：{lo}+）', en: '{name} ({tier}: {lo}+)' },
  // 括号形式随语言：中文用全角，英文用半角
  'band.bracket': { zh: '（{x}）', en: '({x})' },
  // 分档带头部用的短区间（不带单位，单位由区块标题体现）
  'band.rangeShort': { zh: '{lo}~{hi}', en: '{lo}–{hi}' },
  'band.overShort': { zh: '{n}+', en: '{n}+' },
  'band.range': { zh: '{lo}~{hi} 天', en: '{lo}–{hi} d' },
  'band.over': { zh: '大于 {n} 天', en: 'over {n} d' },

  // ---- 标记 ----
  'tag.estimated': { zh: '估算', en: 'est.' },
  'tag.direct': { zh: '直接收录', en: 'measured' },
  'tag.notDirect': { zh: '分数非直接收录', en: 'score is estimated' },
  'tag.frontier': { zh: '前沿', en: 'Frontier' },
  'tag.origin': { zh: '坐标系原点', en: 'origin of the scale' },

  // ---- 概览 ----
  'bands.title': { zh: 'AI 公司梯队', en: 'AI company tiers' },
  'ladder.title': { zh: '梯队总览', en: 'Tier overview' },
  'ruler.title': { zh: 'AI 公司梯队', en: 'AI company tiers' },
  'chart.axis': { zh: '天', en: 'days' },
  'ladder.empty': { zh: '（空）', en: '(none)' },
  'table.title': { zh: '完整数据', en: 'Full data' },
  'table.hint': {
    zh: '估算：该分数非直接收录。节奏差：做出与前沿同等的能力，但比前沿晚交付多少天。能力差：交付时能力仍未追上前沿，这段差距折算成多少天。',
    en: 'est.: the score is not directly benchmarked. Pacing gap: how many days later this vendor delivered what the frontier already had. Capability gap: the remaining shortfall at delivery, converted into days.',
  },

  // ---- 说明页 ----
  'notes.total': {
    zh: '与前沿模型的距离，单位天，越小越接近前沿。',
    en: 'Distance to the frontier model, in days; lower is closer.',
  },
  'notes.dt': {
    zh: '做得和前沿一样好，但比前沿晚交付多少天。',
    en: 'How many days later this vendor delivered what the frontier already had.',
  },
  'notes.g': {
    zh: '能力还没追上前沿，这一段差距折算成多少天。',
    en: 'The remaining capability shortfall, converted into days.',
  },
  'notes.totalLabel': { zh: '总差距', en: 'Total gap' },
  'notes.dtLabel': { zh: '节奏差', en: 'Pacing gap' },
  'notes.gLabel': { zh: '能力差', en: 'Capability gap' },
  'notes.benchmark': { zh: '基准', en: 'Benchmark' },
  'notes.frontier': { zh: '前沿模型', en: 'Frontier model' },
  'notes.frontierValue': {
    zh: '{name}（{score} 分，{date}）',
    en: '{name} ({score}, {date})',
  },
  'notes.asOf': { zh: '数据截止', en: 'Data as of' },
  'notes.tier': { zh: '档位', en: 'Tiers' },
  'notes.estimated': {
    zh: '该厂商分数为估算值，非评测直接收录。',
    en: 'This vendor’s score is estimated, not directly benchmarked.',
  },

  // ---- 对比页 ----
  'compare.earlier': { zh: '较早', en: 'Earlier' },
  'compare.later': { zh: '较新', en: 'Later' },
  'compare.hint': {
    zh: '变化为负 = 差距缩小，为正 = 差距扩大。',
    en: 'A negative change means the gap narrowed; positive means it widened.',
  },
  'compare.noData': { zh: '数据不足，无法对比', en: 'Not enough data to compare' },

  // ---- 趋势页 ----
  'trend.hint': { zh: '曲线向下 = 正在追近前沿。', en: 'A falling line means closing in.' },
  'trend.axisY': { zh: '差距（天）', en: 'Gap (days)' },

  // ---- 公司对标 ----
  'company.lead': {
    zh: '选一家参照公司，比较各厂商达到同等能力的时间先后。',
    en: 'Pick a reference company and compare when each vendor reached the same capability.',
  },
  'company.picker': { zh: '参照公司', en: 'Reference' },
  'company.line': { zh: '公开模型曲线', en: 'public model curve' },
  'company.range': {
    zh: '{name} · 参照模型范围：{start} 至 {end}',
    en: '{name} · reference models: {start} to {end}',
  },
  'company.noCurve': { zh: '数据不足', en: 'Not enough data' },
  'company.empty': { zh: '当前历史快照没有公司对标数据。', en: 'This snapshot has no benchmark data.' },
  'company.insufficient': { zh: '（待补曲线）', en: ' (no curve yet)' },
  'company.incompatible': { zh: '（口径不一致）', en: ' (different benchmark)' },
  'company.sameDay': { zh: '同等能力同日', en: 'Same day' },
  'company.ahead': { zh: '领先 {n} 天', en: 'Ahead by {n} d' },
  'company.behind': { zh: '落后 {n} 天', en: 'Behind by {n} d' },
  'company.anchorDate': { zh: '对标日期 {date}', en: 'Benchmark date {date}' },

  // ---- 公司详情 ----
  'detail.back': { zh: '← 返回榜单', en: '← Back to board' },
  'detail.heading': { zh: '{name} · 当前旗舰 {model}', en: '{name} · current flagship {model}' },
  'detail.curve': { zh: '能力曲线', en: 'Capability curve' },
  'detail.curveAlt': {
    zh: '公司能力曲线，叠加前沿模型曲线作参照',
    en: 'Company capability curve with the frontier curve for reference',
  },
  'detail.curveHint': {
    zh: '实心点 = 评测直接收录；空心点 = 估算值。虚线为前沿模型 {frontier} 的曲线。',
    en: 'Filled dots are measured; hollow dots are estimates. The dashed line is the frontier model {frontier}.',
  },
  'detail.noCurve': { zh: '该快照没有这家公司的历史模型数据。', en: 'No model history for this company in this snapshot.' },
  'detail.iterations': { zh: '模型迭代', en: 'Model history' },
  'detail.delta': { zh: '{sign}{delta} 分 · {days} 天', en: '{sign}{delta} pts · {days} d' },
  'detail.frontierGap': { zh: '落后前沿（天）', en: 'Gap to frontier (d)' },
  'detail.converted': { zh: '折算', en: 'In months' },
}

/** UI 文案与数据层文案合并后的总目录（key 不重叠，见构建期校验） */
const allMessages: Record<string, Message> = { ...messages, ...dataMessages }

/** 旧快照只带中文厂名、没有 company_id：用中文名反查 id 再取译文 */
const NAME_TO_ID: Record<string, string> = (() => {
  const map: Record<string, string> = {}
  for (const key of Object.keys(allMessages)) {
    if (key.startsWith('co.')) map[allMessages[key].zh] = key.slice(3)
  }
  return map
})()

/** 厂商显示名。
 *
 * 旧快照没有 company_id 字段，调用方常写成 `r.company_id ?? r.name`，
 * 于是传进来的是「中文名」。所以不能只判断 companyId 是否真值——
 * 必须先确认它真的是一个有效的 co.* 键，否则回退到按中文名反查。
 * （曾因此让英文界面的月之暗面/智谱漏成中文。）
 */
export function companyName(name: string, companyId?: string): string {
  const byId = companyId && allMessages[`co.${companyId}`] ? companyId : undefined
  const id = byId ?? NAME_TO_ID[name]
  // 必须显式传当前语言：缺省是 zh，会让英文界面残留中文厂名
  return id && allMessages[`co.${id}`] ? translate(`co.${id}`, undefined, getLang()) : name
}

/*
 * 图上的模型名去掉配置后缀（max / high / xhigh / medium / low / Reasoning / 日期括注）。
 * 按 AA 的做法：图上只留型号，配置、厂商、分数放进 hover 详情（title）。
 * 后缀占了名字约四分之一宽度，去掉后同一层能多放几个标签，图才不至于又高又窄。
 * 只作用于展示：数据层与详情里的名字保持完整。已核对去后缀后 34 个模型无重名。
 */
export function shortModelName(name: string): string {
  const base = name
    .replace(/\s*\((?:max|high|xhigh|medium|low|reasoning|thinking|non-thinking)\)\s*$/i, '')
    .replace(/\s*\([A-Z][a-z]{2} \d{4}\)\s*$/, '')
    // 尾部的日期串（Qwen3.8-Max-0902 的 0902）在图上没信息量，去掉后单行放得下
    .replace(/-(\d{4})$/, '')
    .trim()
  // 不做词表缩写：会得到 Gm 3.5 Fl / DS V4 Fl 0731 这种读不出来的名字。
  // 缩短靠「去配置后缀 + 去尾部日期」，再不够就由 CSS 省略号 + hover 详情兜。
  return base
}

/** 取值并替换 {name} 占位；缺 key 时返回 key 本身，便于发现漏配。 */
export function translate(
  key: string,
  params?: Record<string, string | number>,
  lang: 'zh' | 'en' = 'zh',
): string {
  const entry = allMessages[key]
  let out = entry ? entry[lang] : key
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      out = out.split(`{${k}}`).join(String(v))
    }
  }
  return out
}

// ---- 当前语言（第 3 阶段仅中文；第 4 阶段接入切换） ----
export type Lang = 'zh' | 'en'
const LANG_KEY = 'tier-lang'

export function getLang(): Lang {
  try {
    const v = localStorage.getItem(LANG_KEY)
    return v === 'en' ? 'en' : 'zh'
  } catch {
    return 'zh'
  }
}

export function setLang(lang: Lang) {
  try {
    localStorage.setItem(LANG_KEY, lang)
    document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN'
  } catch {
    /* 忽略隐私模式下的存储失败 */
  }
}

/** 组件内简写：t('col.company', { n: 3 }) */
export function t(key: string, params?: Record<string, string | number>): string {
  return translate(key, params, getLang())
}

const LANG_EVENT = 'tier-lang-change'

/** 语言切换（写 localStorage 并广播，组件用 useLang 订阅） */
export function switchLang(lang: Lang) {
  setLang(lang)
  window.dispatchEvent(new CustomEvent(LANG_EVENT, { detail: lang }))
}

/** 组件里最常用：const t = useT() —— 语言切换时自动重渲染 */
export function useT() {
  const lang = useLang()
  return (key: string, params?: Record<string, string | number>) =>
    translate(key, params, lang)
}

/** 订阅当前语言；语言切换时组件自动重渲染 */
export function useLang(): Lang {
  const [lang, setLangState] = useState<Lang>(() => getLang())
  useEffect(() => {
    const onChange = (e: Event) => {
      const next = (e as CustomEvent).detail
      if (next === 'zh' || next === 'en') setLangState(next)
    }
    window.addEventListener(LANG_EVENT, onChange)
    return () => window.removeEventListener(LANG_EVENT, onChange)
  }, [])
  return lang
}

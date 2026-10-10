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
  'nav.openGap': { zh: '开源差距', en: 'Open-weight gap' },
  'openGap.lead': { zh: '最强开放权重模型，距离闭源前沿还有多远？', en: 'How far are the strongest open weights from the proprietary frontier?' },
  'openGap.scope': { zh: '{benchmark} · 截至 {date}', en: '{benchmark} · As of {date}' },
  'openGap.closed': { zh: '闭源前沿', en: 'Proprietary frontier' },
  'openGap.open': { zh: '开源前沿', en: 'Open-weight frontier' },
  'openGap.points': { zh: '分', en: 'points' },
  'openGap.days': { zh: '天', en: 'days' },
  'openGap.delta': { zh: '当前分差', en: 'Current score gap' },
  'openGap.deltaHint': { zh: '闭源最高分 − 开源最高分', en: 'Proprietary best − open-weight best' },
  'openGap.time': { zh: '距前沿时差', en: 'Gap to frontier' },
  'openGap.breakdown': { zh: '节奏差 {pacing} 天 + 能力差 {capability} 天', en: 'Pacing {pacing} days + capability {capability} days' },
  'openGap.unavailable': { zh: '无法折算', en: 'Not calculable' },
  'openGap.empty': { zh: '该日期暂无开源模型对比数据。请选择 {date}。', en: 'No open-weight comparison data is available for this date. Please select {date}.' },
  'openGap.chart': { zh: '双前沿 · 发布历程', en: 'Two frontiers · release history' },
  'openGap.chartHint': { zh: '历史模型统一采用本期评测版本的分数，并按公开日期排列。前沿代表对比范围内的最高分；新模型超过此前最高分时，曲线向上移动。', en: 'Historical models use scores from the current benchmark version, ordered by public availability. Each frontier is the highest score within the comparison set and rises when a new model exceeds it.' },
  'openGap.scrub': { zh: '查看历史节点', en: 'Explore a historical milestone' },
  'openGap.node': { zh: '{date} · 分差 {gap} 分', en: '{date} · {gap}-point gap' },
  'openGap.ranking': { zh: '开源追赶榜', en: 'Open-weight contenders' },
  'openGap.model': { zh: '模型 / 厂商', en: 'Model / company' },
  'openGap.score': { zh: '指数', en: 'Index' },
  'openGap.gap': { zh: '距闭源分差', en: 'Score gap' },
  'openGap.equivalent': { zh: '距前沿 / 同分日期', en: 'Total lag / equivalent date' },
  'openGap.extrapolated': { zh: '外推估算', en: 'Extrapolated estimate' },
  'openGap.availability': { zh: '权重公开', en: 'Weights available' },
  'openGap.by': { zh: '不晚于 {date}', en: 'By {date}' },
  'openGap.license': { zh: '许可证 / 来源', en: 'License / source' },
  'openGap.method': { zh: '数据说明', en: 'About the data' },
  'openGap.definition': { zh: '“开源”指模型权重已公开，商用权限以各模型许可证为准。本期对比 {open} 个开放权重模型与 {closed} 个闭源模型，未覆盖所有模型。', en: '“Open” means publicly available model weights; commercial permissions depend on each license. This comparison covers {open} open-weight and {closed} proprietary models, not all models.' },
  'openGap.lagMethod': { zh: '总时差 = 节奏差 + 能力差。节奏差是模型发布日期与闭源参照模型达到同等分数日期之间的间隔；能力差是该同分日期与当前前沿模型发布日期之间的间隔。同分日期按历史分数估算，各项天数独立取整，外推结果单独标注。', en: 'Total lag = pacing gap + capability gap. Pacing is the interval between a model’s release and the date when proprietary reference models reached the same score. Capability is the interval from that equivalent date to the current frontier model’s release. Equivalent dates are estimated from historical scores; day counts are rounded independently and extrapolated results are marked.' },
  'openGap.bound': { zh: '模型发布与权重公开可能不是同一天；日期均按北京时间显示。', en: 'Model release and weight publication may occur on different dates. All dates use Beijing time.' },
  'openGap.coverage': { zh: '仅统计已公开权重的模型，尚未发布权重的开源预告不计入。', en: 'Only published model weights are included; announcements of future open weights are excluded.' },
  'openGap.reference': { zh: '查看闭源参照模型与来源', en: 'Proprietary reference models and sources' },
  'nav.models': { zh: '模型梯队', en: 'Model tiers' },
  'nav.notes': { zh: '方法论', en: 'Methodology' },
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
  'unit.daysSuffix': { zh: ' 天', en: ' d' },
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

  // ---- 方法论页 ----
  'notes.methodology.whatTitle': { zh: '这张榜在比较什么', en: 'What this board compares' },
  'notes.methodology.what': {
    zh: '分数回答“当前测得有多强”，但不能说明达到前沿曾经达到的水平要晚多久，也不能区分差距来自发布较晚还是能力未追上。本榜把能力差转换成时间差，用“距离前沿多少天”表示相对位置。它不是未来预测，也不是公司综合实力排名。',
    en: 'A score shows how strong a model measures today, but not how long it took to reach a level the frontier had already reached. This board converts that difference into time. It is not a forecast or an overall company ranking.',
  },
  'notes.methodology.referenceTitle': { zh: '前沿参照线是什么', en: 'What the frontier reference line is' },
  'notes.methodology.reference': {
    zh: '它不是预测模型或抽象指数，而是一组真实记录：前沿旗舰模型、发布日期、同一评测版本下的分数。按时间排列后，它回答“前沿在什么时候达到过什么分数”。当前快照的参照线是 {name}。',
    en: 'It is not a forecast or an abstract index. It is a dated record of frontier flagship models and their scores under one benchmark. Ordered by date, it shows when the frontier reached each score. This snapshot uses {name}.',
  },
  'notes.methodology.model': { zh: '模型', en: 'Model' },
  'notes.methodology.date': { zh: '发布日期', en: 'Release date' },
  'notes.methodology.score': { zh: '分数', en: 'Score' },
  'notes.methodology.calculationTitle': { zh: '三个数字怎么算', en: 'How the three numbers are calculated' },
  'notes.methodology.calculation': {
    zh: '先找出参照线达到同一分数的日期，再计算：节奏差 = 实际发布日期 − 同分日期；能力差 = 当前前沿日期 − 同分日期；总差距 = 节奏差 + 能力差。',
    en: 'First find the date when the reference line reached the same score. Then: pacing gap = release date − same-score date; capability gap = current frontier date − same-score date; total gap = pacing gap + capability gap.',
  },
  'notes.methodology.exampleTitle': { zh: '例子', en: 'Example' },
  'notes.methodology.exampleLead': {
    zh: '当前快照中，{company} {model} 得分 {score} 分，发布日期为 {releaseDate}；参照线在 {equivalentDate} 左右达到同分，当前前沿点为 {frontierDate}。',
    en: 'In this snapshot, {company} {model} scores {score}. It was released on {releaseDate}; the reference line reached the same score around {equivalentDate}, while its latest frontier point is {frontierDate}.',
  },
  'notes.methodology.exampleResult': {
    zh: '因此节奏差为 {pacing} 天，能力差为 {capability} 天，总差距为 {total} 天。它不是“晚发布 {total} 天”，而是两部分差距相加。',
    en: 'So the pacing gap is {pacing} days, the capability gap is {capability} days, and the total gap is {total} days. It is not simply “released {total} days late”; the two gaps are added together.',
  },
  'notes.methodology.companyTitle': { zh: '公司梯队怎么读', en: 'How to read company tiers' },
  'notes.methodology.company': {
    zh: '公司梯队按总差距划分：T1 前沿（0~100 天）、T2 领先（100~200 天）、T3 跟随（200~300 天）、T4 追赶（300 天以上）。它表示距离前沿的时间位置，不代表市场份额或产品体验排名。',
    en: 'Company tiers use the total gap: T1 Frontier (0–100 days), T2 Leading (100–200), T3 Following (200–300), and T4 Catching up (over 300). They show time distance from the frontier, not market share or product experience.',
  },
  'notes.methodology.modelTitle': { zh: '公司梯队和模型梯队不是一回事', en: 'Company tiers and model tiers are different' },
  'notes.methodology.modelTiers': {
    zh: '公司梯队按天数，模型梯队按分数；前者看发布与追赶位置，后者看当前能力档位，两者不能混用。',
    en: 'Company tiers use days; model tiers use scores. The first describes release and catch-up position, while the second describes current capability. Do not mix them.',
  },
  'notes.methodology.limitsTitle': { zh: '怎么看待结果', en: 'How to interpret the results' },
  'notes.methodology.limits': {
    zh: '只比较同一评测版本；版本变化造成的分数平移不等于能力变化。估算和外推会单独标注；能力时差地图与主表不是同一数据源，不能直接相加。',
    en: 'Only scores from the same benchmark version are compared. A score shift caused by a version change is not a capability change. Estimates and extrapolations are marked separately. The capability-gap map and the main table use different sources and should not be added together.',
  },
  'notes.snapshotTitle': { zh: '当前快照字段', en: 'Current snapshot fields' },
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
  'trend.credibility': {
    zh: '共 {n} 期快照（{from} ~ {to}），{companies} 家有至少两期可比。样本越少，趋势越不足为凭。',
    en: 'Based on {n} snapshots ({from} – {to}); {companies} companies have at least two. Fewer samples means a weaker trend.',
  },
  'trend.benchmarkMix': {
    zh: '注意：这批历史跨 {list} 多个评测版本，分数不可比，因此跨版本的相邻两点之间不连线。',
    en: 'Note: this history spans {list}, which are not comparable — so points across versions are not joined.',
  },
  'trend.evLegend': {
    zh: '■ 模型发布数　▲ 评测版本变更数　（贴在日期刻度上）',
    en: '■ releases　▲ benchmark changes　(on the date ticks)',
  },
  'trend.benchChanges': {
    zh: '历次评测版本变更（同一模型换版本 = 分数整体平移，不是能力变化）：',
    en: 'Benchmark version changes so far (same model, new yardstick — a shift, not a capability change):',
  },
  'trend.scoreAt': { zh: '当时 {score}', en: 'then {score}' },
  'trend.benchShift': { zh: '{from} → {to}', en: '{from} → {to}' },

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

  // ---- 差距说明（EXT-02）----
  'gap.why': { zh: '为什么落后这么多', en: 'Why the gap' },
  'gap.leadPace': {
    zh: '这 {d} 天里，有 {v} 天来自发布节奏——达到同等能力的时间比前沿更晚；'
      + '其余 {rest} 天是能力代际的差距。',
    en: 'Of these {d} days, {v} come from release pacing — the same capability level arrived later. '
      + 'The remaining {rest} days are generational capability gap.',
  },
  'gap.leadCapability': {
    zh: '这 {d} 天里，有 {v} 天来自能力代际——前沿在这项能力上又往前走了；'
      + '其余 {rest} 天是发布节奏的差距。',
    en: 'Of these {d} days, {v} come from the capability generation — the frontier moved further ahead. '
      + 'The remaining {rest} days are release pacing.',
  },
  'gap.balanced': {
    zh: '这 {d} 天里，发布节奏与能力代际各占约一半（{v} 天 / {rest} 天），没有单一主因。',
    en: 'Of these {d} days, release pacing and capability gap contribute about equally ({v} d / {rest} d).',
  },
  'gap.sumNote': {
    zh: '两者相加即为总差距，不做加权、也不合成第二个分数。',
    en: 'The two add up to the total gap; they are not weighted into a second score.',
  },
  'gap.stateMeasured': { zh: '实测分数', en: 'measured score' },
  'gap.stateEstimated': { zh: '估算分数（区间见数据表）', en: 'estimated score (see range in the table)' },
  'gap.anchorNote': {
    zh: '判定依据：{anchor}，基准 {benchmark}{override}',
    en: 'Basis: {anchor}, benchmark {benchmark}{override}',
  },
  'gap.overrideNote': { zh: '；档位经政策调整，测得值未改动', en: '; tier adjusted by policy, measured value untouched' },

  // ---- 能力时差地图（EXT-03）----
  'cap.title': { zh: '能力时差地图', en: 'Capability gap map' },
  'cap.legendFrontier': { zh: '前沿（{name}）', en: 'Frontier ({name})' },
  'cap.legendThis': { zh: '{name}', en: '{name}' },
  'cap.axisHint': {
    zh: '七轴 = 七个能力维度，刻度 0~100 分，取自 AA 分项（AAII v4.3）。',
    en: 'Seven axes, one per capability dimension, 0–100 from AA sub-scores (AAII v4.3).',
  },
  'cap.thDim': { zh: '维度', en: 'Dimension' },
  'cap.thScore': { zh: '本家', en: 'Model' },
  'cap.thFrontier': { zh: '前沿', en: 'Frontier' },
  'cap.thGap': { zh: '时差', en: 'Gap' },
  'cap.thStatus': { zh: '状态', en: 'Status' },
  'cap.statusMeasured': { zh: 'AA 实测', en: 'AA measured' },
  'cap.statusEstimated': { zh: '含估算', en: 'partly estimated' },
  'cap.statusUnmeasured': { zh: '未测量', en: 'not measured' },
  'cap.noTimeline': { zh: '无时间轴', en: 'no timeline' },
  'cap.beyondPool': { zh: '池外外推', en: 'extrapolated' },
  'cap.noTimelineNote': {
    zh: '带「无时间轴」的维度：其分数在 Claude 旗舰线上会随代次退步（例如抗幻觉越新越爱猜），'
      + '「越晚发布分越低」会让插值失去意义，因此只给分数、不给时差。',
    en: 'Dimensions marked “no timeline”: their scores regress across Claude flagship generations '
      + '(hallucination resistance got worse), so a time axis is not meaningful — score only, no days.',
  },
  'cap.anchorNote': {
    zh: '时差锚点：各维度取 Claude 旗舰线该维度分，代数 3~7 代不等；'
      + '标注「池外外推」的结果外推距离已超过锚点池宽度，只能看方向。',
    en: 'Gap anchors use the Claude flagship line per dimension (3–7 generations). '
      + '“Extrapolated” means the distance exceeds the anchor span — direction only.',
  },
  'cap.unmeasured': { zh: '该厂商在 AA 无对应条目，未测量。', en: 'No AA entry for this company — not measured.' },

  // ---- 模型家族与事件轴（EXT-05）----
  'evt.title': { zh: '模型家族与事件轴', en: 'Model family and event timeline' },
  'evt.desc': {
    zh: '把「能力曲线的跳变」拆开：哪些来自模型换代，哪些来自评测版本变更。',
    en: 'Separating what drives the curve: new model generations versus benchmark version changes.',
  },
  'evt.typeRelease': { zh: '发布', en: 'Release' },
  'evt.typeBenchmark': { zh: '评测版本变更', en: 'Benchmark change' },
  'evt.typeRevision': { zh: '评分修订', en: 'Score revision' },
  'evt.typeAvailability': { zh: '可用性变化', en: 'Availability' },
  'evt.stagePreview': { zh: '预览版', en: 'preview' },
  'evt.stageOfficial': { zh: '正式发布', en: 'official' },
  'evt.stageApi': { zh: 'API 可用', en: 'API' },
  'evt.stageGeneral': { zh: '全面开放', en: 'general' },
  'evt.benchmarkNote': {
    zh: '评测版本变更会让同一模型的分数整体平移（口径变了），'
      + '不是能力变化——这正是「分数跳变」最容易被误读的地方。',
    en: 'A benchmark version change shifts the same model’s score (the yardstick changed), '
      + 'which is not a capability change — the most commonly misread kind of jump.',
  },
  'evt.summary': {
    zh: '本家共 {total} 条事件：发布 {release}、评测版本变更 {bench}。',
    en: '{total} events: {release} releases, {bench} benchmark changes.',
  },
  'evt.none': { zh: '该快照没有这家公司的事件记录。', en: 'No events for this company in this snapshot.' },
  'evt.scoreAt': { zh: '当时分数 {score}', en: 'score then {score}' },
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

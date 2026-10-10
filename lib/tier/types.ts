export interface TierBand {
  label: string
  lo: number
  hi: number | null
}

export interface Row {
  name: string
  company_id?: string
  model: string
  score: number
  date: string
  dt: number
  g: number
  d: number
  anchor: string
  tier: string
  up: boolean
  overridden: boolean
  estimated: boolean
}

export interface CompanyCurvePoint {
  model: string
  score: number
  date: string
  estimated?: boolean
  note?: string
}

export interface CompanyComparison {
  company_id: string
  company: string
  model: string
  score: number
  date: string
  tier: string
  estimated: boolean
  equivalent_date: string | null
  gap_days: number | null
  status: 'ok' | 'out_of_range' | 'unavailable'
  direction: 'ahead' | 'behind' | 'same' | null
  reason: string
}

export interface CompanyReference {
  id: string
  name: string
  line_key: string
  benchmark: string
  status: 'ok' | 'insufficient' | 'incompatible'
  date_start: string | null
  date_end: string | null
  points: CompanyCurvePoint[]
  comparisons: CompanyComparison[]
  below_range_count?: number
}

export interface CompanyBenchmarks {
  default_id: string | null
  references: CompanyReference[]
}

export interface ModelTierCut {
  days: number
  score: number
}

export interface ModelTierEntry {
  company_id: string
  company: string
  model: string
  score: number
  date: string
  kind: 'anchor' | 'company'
  tier: string
}

export interface ModelTiers {
  cuts: ModelTierCut[]
  rule: string
  models: ModelTierEntry[]
}

export interface SelfCheck {
  item: string
  ok: boolean
  detail: string
}

export interface Snapshot {
  schema_version: number
  as_of: string
  benchmark: string
  generated_at: string
  frontier: { name: string; score: number; date: string }
  tier_bands: TierBand[]
  /** 公开快照只带 main 锚点池（wide 是算法内部备用池，不公开） */
  pools: { main?: Record<string, [number, string]> }
  rows: Row[]
  company_benchmarks?: CompanyBenchmarks
  model_tiers?: ModelTiers
  self_check: SelfCheck[]
}

export interface IndexEntry {
  as_of: string
  benchmark: string
  file: string
  generated_at: string
  latest: boolean
  rows: number
  verified: boolean
}

export interface Index {
  snapshots: IndexEntry[]
}

export interface TierChange {
  company: string
  company_id?: string
  fromTier: string
  toTier: string
  fromAsOf: string
  asOf: string
}

/** ---- 模型家族与事件轴（EXT-05）：独立数据包 ---- */
export type EventType =
  | 'model_release'
  | 'benchmark_upgrade'
  | 'score_revision'
  | 'availability_change'
  | 'model_renamed'
  | 'model_retired'

export interface ModelEvent {
  id: string
  date: string
  type: EventType
  company_id: string
  model: string
  stage?: 'preview' | 'official' | 'api' | 'general'
  benchmark?: string
  score?: number
}

export interface EventCounts {
  model_release: number
  benchmark_upgrade: number
  score_revision: number
  availability_change: number
}

/** 评测版本变更的前后对照：同一模型换版本后分数平移了多少 */
export interface BenchmarkMove {
  company_id: string
  company: string
  model: string
  date: string
  from_benchmark: string
  to_benchmark: string
  from_score: number | null
  to_score: number | null
  delta: number | null
}

export interface EventStream {
  meta: { as_of: string; benchmark: string; note: string }
  counts_by_company: Record<string, Partial<EventCounts>>
  benchmark_moves: BenchmarkMove[]
  events: ModelEvent[]
}

/** ---- 能力时差地图（EXT-03）：独立数据包，不属于快照 ---- */
export type DimStatus = 'measured' | 'estimated' | 'unmeasured' | 'no_timeline'

export interface DimCell {
  score: number | null
  status: DimStatus
  gap_days: number | null
  beyond_pool: boolean
  anchor_gens: number | null
}

export interface DimMeta {
  key: string
  label: string
  /** 时间轴是否成立：分数随代次退步的维度为 false，只给分不给天数 */
  timeline_ok: boolean
  anchor_gens: number
  anchor_span_days: number
}

export interface DimVendor {
  company_id: string
  name: string
  model: string
  dims: Record<string, DimCell>
}

export interface Dimensions {
  meta: {
    as_of: string
    benchmark: string
    frontier: { name: string; date: string }
    note: string
  }
  dimensions: DimMeta[]
  vendors: DimVendor[]
}

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

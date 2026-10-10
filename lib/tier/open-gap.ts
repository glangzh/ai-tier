import type { Snapshot } from './types'

export interface GapModel {
  id: string
  company_id: string
  model: string
  score: number
  access: 'open' | 'closed'
  released_at: string
  /** Exact public availability date, distinct from API/model announcement. */
  available_at: string | null
  /** Conservative bound when the exact weight publication date is unknown. */
  available_by: string
  license: string | null
  source: string
  availability_source: string
}

export interface OpenGapPack {
  as_of: string
  benchmark: string
  score_source: string
  models: GapModel[]
}

export interface FrontierPoint { date: string; score: number; model: string }
const day = (date: string) => Date.parse(`${date}T00:00:00Z`)
export const availabilityDate = (model: GapModel) => model.available_at ?? model.available_by

/** Strictly improving envelope; equal scores retain the first public model. */
export function frontierCurve(models: GapModel[], asOf: string): FrontierPoint[] {
  const sorted = models.filter((m) => availabilityDate(m) <= asOf)
    .sort((a, b) => availabilityDate(a).localeCompare(availabilityDate(b)) || b.score - a.score || a.id.localeCompare(b.id))
  const curve: FrontierPoint[] = []
  for (const m of sorted) {
    if (!curve.length || m.score > curve[curve.length - 1].score) {
      curve.push({ date: availabilityDate(m), score: m.score, model: m.model })
    }
  }
  return curve
}

/** Main-pool same-score date; extrapolation requires an explicit main-board result. */
export function equivalentDate(score: number, curve: FrontierPoint[], extrapolate = false): string | null {
  const exact = curve.find((p) => p.score === score)
  if (exact) return exact.date
  const interpolate = (a: FrontierPoint, b: FrontierPoint) => {
    const days = Math.round(((score - a.score) / (b.score - a.score)) * ((day(b.date) - day(a.date)) / 86400000))
    return new Date(day(a.date) + days * 86400000).toISOString().slice(0, 10)
  }
  for (let i = 1; i < curve.length; i++) {
    const a = curve[i - 1], b = curve[i]
    if (score > a.score && score < b.score) {
      return interpolate(a, b)
    }
  }
  if (extrapolate && curve.length >= 2) {
    if (score < curve[0].score) return interpolate(curve[0], curve[1])
    if (score > curve[curve.length - 1].score) return interpolate(curve[curve.length - 2], curve[curve.length - 1])
  }
  return null
}

export function openGapView(pack: OpenGapPack, snap: Snapshot) {
  const { as_of: asOf, benchmark } = snap
  // A frozen pack is valid only for its own snapshot: no backdating current metadata/scores.
  if (pack.as_of !== asOf || pack.benchmark !== benchmark) return null
  const models = pack.models.filter((m) => availabilityDate(m) <= asOf)
  const closedCurve = frontierCurve(models.filter((m) => m.access === 'closed'), asOf)
  const openCurve = frontierCurve(models.filter((m) => m.access === 'open'), asOf)
  const closed = closedCurve.at(-1), open = openCurve.at(-1)
  if (!closed || !open) return null
  const mainCurve = Object.entries(snap.pools.main ?? {})
    .map(([model, [score, date]]) => ({ model, score, date })).sort((a, b) => a.score - b.score)
  const rows = models.filter((m) => m.access === 'open').sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)).map((m) => {
    // D is rounded after combining the unrounded components. Re-adding dt and g
    // (already rounded individually) can differ by one day from the main board.
    const main = snap.rows.find((r) => r.company_id === m.company_id && r.model === m.model && r.score === m.score && r.date === m.released_at)
    const extrapolated = Boolean(main && mainCurve.length && (m.score < mainCurve[0].score || m.score > mainCurve.at(-1)!.score))
    const equivalent = main ? equivalentDate(m.score, mainCurve, extrapolated) : null
    return { ...m, score_gap: closed.score - m.score, equivalent_date: equivalent,
      gap_days: main?.d ?? null, pacing_days: main?.dt ?? null, capability_days: main?.g ?? null, extrapolated }
  })
  return { closed, open, closedCurve, openCurve, rows, scoreGap: closed.score - open.score }
}

import snapshot from "@data/combo/models-2026-09-30.json";
import { pairCost, type Structure } from "./cost";
export type { Structure } from "./cost";

export type Model = {
  id: string;
  name: string;
  developer: string;
  family: string;
  openWeights: boolean;
  intelligence: number;
  costPerTaskUsd: number;
  outputTokensPerSecond: number | null;
  timeToFirstTokenSeconds: number | null;
  endToEndSeconds: number | null;
  inputUsdPerMillion: number;
  outputUsdPerMillion: number;
};

export const comboData = snapshot as { asOf: string; source: { name: string; url: string; costDefinition: string }; models: Model[] };

export type SourceMode = "any" | "developer" | "family";
export type Settings = {
  intelligenceWeight: number;
  costWeight: number;
  speedWeight: number;
  sourceMode: SourceMode;
  structure: Structure;
  decisionShare: number;
  escalationRate: number;
  minGap: number;
  maxGap: number;
  decisionFloor: number;
  executionFloor: number;
};

export const defaults: Settings = {
  intelligenceWeight: 50,
  costWeight: 25,
  speedWeight: 25,
  sourceMode: "developer",
  structure: "split",
  decisionShare: 20,
  escalationRate: 15,
  minGap: 3,
  maxGap: 12,
  decisionFloor: 46,
  executionFloor: 40,
};

export type Pair = {
  decision: Model;
  execution: Model;
  relation: "family" | "developer" | "cross";
  gap: number;
  cost: number;
  seconds: number | null;
  throughput: number | null;
};

const models = comboData.models;
const extent = (values: number[]) => [Math.min(...values), Math.max(...values)] as const;
const intelligenceRange = extent(models.map((m) => m.intelligence));
const costRange = extent(models.map((m) => Math.log(m.costPerTaskUsd)));
const speedRange = extent(models.flatMap((m) => m.outputTokensPerSecond == null ? [] : [m.outputTokensPerSecond]));
const scale = (value: number, [min, max]: readonly [number, number]) => max === min ? 50 : (value - min) / (max - min) * 100;

export function normalized(model: Model) {
  return {
    intelligence: scale(model.intelligence, intelligenceRange),
    cost: 100 - scale(Math.log(model.costPerTaskUsd), costRange),
    speed: model.outputTokensPerSecond == null ? null : scale(model.outputTokensPerSecond, speedRange),
  };
}

/** A missing speed measurement does not receive an invented three-axis score. */
export function composite(model: Model, settings: Settings): number | null {
  const n = normalized(model);
  if (n.speed == null && settings.speedWeight > 0) return null;
  const sum = settings.intelligenceWeight + settings.costWeight + settings.speedWeight;
  if (sum === 0) return 0;
  return (n.intelligence * settings.intelligenceWeight + n.cost * settings.costWeight +
    (n.speed ?? 0) * settings.speedWeight) / sum;
}

/** Two-dimensional frontier: higher intelligence and lower AA cost per task. */
export function costIntelligenceFrontier(): Model[] {
  return models.filter((m) => !models.some((other) =>
    other.intelligence >= m.intelligence && other.costPerTaskUsd <= m.costPerTaskUsd &&
    (other.intelligence > m.intelligence || other.costPerTaskUsd < m.costPerTaskUsd),
  )).sort((a, b) => a.costPerTaskUsd - b.costPerTaskUsd);
}

function relation(decision: Model, execution: Model): Pair["relation"] {
  if (decision.developer !== execution.developer) return "cross";
  return decision.family === execution.family ? "family" : "developer";
}

export function eligiblePairs(settings: Settings): Pair[] {
  const pairs: Pair[] = [];
  for (const decision of models) for (const execution of models) {
    const gap = decision.intelligence - execution.intelligence;
    if (decision.id === execution.id || gap < settings.minGap || gap > settings.maxGap || gap <= 0 ||
      decision.intelligence < settings.decisionFloor || execution.intelligence < settings.executionFloor ||
      execution.costPerTaskUsd >= decision.costPerTaskUsd) continue;
    const link = relation(decision, execution);
    if (settings.sourceMode === "family" && link !== "family") continue;
    if (settings.sourceMode === "developer" && link === "cross") continue;

    const share = settings.decisionShare / 100;
    const escalation = settings.escalationRate / 100;
    const cost = pairCost(decision.costPerTaskUsd, execution.costPerTaskUsd,
      settings.structure, settings.decisionShare, settings.escalationRate);
    // These are scenario estimates from AA measurements, not measured pair performance.
    const seconds = decision.endToEndSeconds == null || execution.endToEndSeconds == null ? null
      : settings.structure === "split"
        ? share * decision.endToEndSeconds + (1 - share) * execution.endToEndSeconds
        : execution.endToEndSeconds + escalation * decision.endToEndSeconds;
    const throughput = decision.outputTokensPerSecond == null || execution.outputTokensPerSecond == null ? null
      : settings.structure === "split"
        ? 1 / (share / decision.outputTokensPerSecond + (1 - share) / execution.outputTokensPerSecond)
        : 1 / (escalation / decision.outputTokensPerSecond + (1 - escalation) / execution.outputTokensPerSecond);
    pairs.push({ decision, execution, relation: link, gap, cost, seconds, throughput });
  }
  return pairs.sort((a, b) => a.cost - b.cost);
}

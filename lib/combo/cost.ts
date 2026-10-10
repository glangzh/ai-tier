export type Structure = "split" | "cascade";

/** Weighted AA benchmark-task scenario; AA's measured costs already include cached input. */
export function pairCost(decisionCost: number, executionCost: number, structure: Structure,
  decisionShare: number, escalationRate: number): number {
  return structure === "split"
    ? decisionShare / 100 * decisionCost + (1 - decisionShare / 100) * executionCost
    : executionCost + escalationRate / 100 * decisionCost;
}

import snapshot0 from "@data/tier/history/2026-10-13.json";
import snapshot1 from "@data/tier/history/2026-10-12.json";
import snapshot2 from "@data/tier/history/2026-10-11.json";
import snapshot3 from "@data/tier/history/2026-10-10.json";
import snapshot4 from "@data/tier/history/2026-09-27.json";
import snapshot5 from "@data/tier/history/2026-09-12.json";
import snapshot6 from "@data/tier/history/2026-09-08.json";
import snapshot7 from "@data/tier/history/2026-09-04.json";
import snapshot8 from "@data/tier/history/2026-09-03.json";
import type { Dimensions, EventStream, Index, Snapshot, TierChange } from "@/lib/tier/types";
import historyIndex from "@data/tier/history_index.json";
import dimensionPack from "@data/tier/dimensions.json";
import eventPack from "@data/tier/events.json";

/**
 * 榜的数据在构建期静态打包：没有运行时 fetch，也就没有 BASE_URL 与加载失败分支。
 * history_index.json 是公开数据协议；快照在构建期静态打包，避免运行时请求。
 */
const SNAPSHOTS: Record<string, Snapshot> = {
  "history/2026-10-13.json": snapshot0 as unknown as Snapshot,
  "history/2026-10-12.json": snapshot1 as unknown as Snapshot,
  "history/2026-10-11.json": snapshot2 as unknown as Snapshot,
  "history/2026-10-10.json": snapshot3 as unknown as Snapshot,
  "history/2026-09-27.json": snapshot4 as unknown as Snapshot,
  "history/2026-09-12.json": snapshot5 as unknown as Snapshot,
  "history/2026-09-08.json": snapshot6 as unknown as Snapshot,
  "history/2026-09-04.json": snapshot7 as unknown as Snapshot,
  "history/2026-09-03.json": snapshot8 as unknown as Snapshot,
};

export async function loadIndex(): Promise<Index> {
  return historyIndex as unknown as Index;
}

export async function loadSnapshot(file: string): Promise<Snapshot> {
  const snap = SNAPSHOTS[file];
  if (!snap) throw new Error(`内置数据缺少快照：${file}`);
  return snap;
}

/** 维度数据包（能力时差地图）。缺失时返回 null —— 增强项不该拖垮整页。 */
export async function loadDimensions(): Promise<Dimensions | null> {
  return dimensionPack as unknown as Dimensions;
}

/** 事件流数据包（事件轴）。同样允许缺失。 */
export async function loadEvents(): Promise<EventStream | null> {
  return eventPack as unknown as EventStream;
}

/**
 * 取最近一组有实际档位变化的快照差异。
 * 旧快照没有 company_id，所以按厂商名做回退，避免 DeepSeek 这类跨版本记录断开。
 */
export function recentTierChanges(index: Index, snaps: Record<string, Snapshot>): TierChange[] {
  const order = [...index.snapshots].sort((a, b) => a.as_of.localeCompare(b.as_of));
  let latest: TierChange[] = [];
  const rowKey = (row: Snapshot["rows"][number]) => (row.company_id ?? row.name).trim().toLocaleLowerCase();

  for (let i = 1; i < order.length; i += 1) {
    const from = snaps[order[i - 1].as_of];
    const to = snaps[order[i].as_of];
    if (!from || !to) continue;

    const fromRows = new Map(from.rows.map((row) => [rowKey(row), row]));
    const changes = to.rows
      .flatMap((row) => {
        const previous = fromRows.get(rowKey(row));
        if (!previous || previous.tier === row.tier) return [];
        return [{
          company: row.name,
          company_id: row.company_id,
          fromTier: previous.tier,
          toTier: row.tier,
          fromAsOf: from.as_of,
          asOf: to.as_of,
        }];
      })
      .sort((a, b) => a.company.localeCompare(b.company));

    if (changes.length > 0) latest = changes;
  }

  return latest;
}

import { NextResponse } from "next/server";
import { readAll } from "@/lib/events";
import { guard } from "@/lib/http";
import { PETS, petView } from "@/lib/pets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 全站共享的宠物状态：由 feed 事件重放聚合，禁缓存、限速、不含个体信息。 */
export async function GET(req: Request) {
  const blocked = guard(req, 60);
  if (blocked) return blocked;
  const evs = await readAll<{ petId: string; counted?: boolean }>("feed/");
  const today = new Date().toISOString().slice(0, 10);
  const total = new Map<string, number>();
  const todayCount = new Map<string, number>();
  for (const e of evs) {
    if (e.data.counted === false) continue; // 超上限的投喂只留痕，不推进成长
    total.set(e.data.petId, (total.get(e.data.petId) ?? 0) + 1);
    if (e.at.slice(0, 10) === today) todayCount.set(e.data.petId, (todayCount.get(e.data.petId) ?? 0) + 1);
  }
  return NextResponse.json(
    {
      date: today,
      fedToday: [...todayCount.values()].reduce((a, b) => a + b, 0),
      pets: PETS.map((p) => petView(p.id, total.get(p.id) ?? 0, todayCount.get(p.id) ?? 0)),
    },
    { headers: { "cache-control": "no-store" } },
  );
}

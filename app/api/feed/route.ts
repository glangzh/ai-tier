import { NextResponse } from "next/server";
import { appendOnce, hash, readAll, same, withEventLock } from "@/lib/events";
import { PET_IDS } from "@/lib/pets";
import { body, guard } from "@/lib/http";

export const runtime = "nodejs";

/** 全站每日投喂上限：超限的仍然记录，但不再推进成长——刷喂刷不出满级。 */
const GLOBAL_FEEDS_PER_DAY = 2000;

/** 投喂必须指定喂给池里哪一只；token 一次性，用过即废，不撤销不退还。 */
export async function POST(req: Request) {
  const blocked = guard(req, 30);
  if (blocked) return blocked;
  const j = await body(req);
  const token = j?.foodToken, petId = j?.petId;
  if (typeof token !== "string" || !PET_IDS.includes(petId as string))
    return NextResponse.json({ error: "需要 foodToken 与池内的 petId" }, { status: 400 });
  const day = new Date().toISOString().slice(0, 10);
  const result = await withEventLock("feed:global", async () => {
    const evs = await readAll<{ tokenHash: string; petId?: string }>("claim/");
    const fed = await readAll<{ day?: string; counted?: boolean; tokenHash?: string }>("feed/");
    const tokenHash = hash(token);
    const grant = evs.find((e) => e.type === "claim.grant" && same(e.data.tokenHash, tokenHash));
    if (!grant) return { status: 400 as const, error: "bad token" };
    if (
      evs.some((e) => e.type === "claim.used" && e.data.tokenHash === grant.data.tokenHash) ||
      fed.some((e) => e.data.tokenHash === grant.data.tokenHash)
    )
      return { status: 409 as const, error: "这份食物已经用过了" };

    const counted = fed.filter((e) => e.data.day === day && e.data.counted !== false).length < GLOBAL_FEEDS_PER_DAY;
    const snack = counted && Math.random() < 0.1;
    const created = await appendOnce("feed", `food:${grant.data.tokenHash}`, {
      tokenHash: grant.data.tokenHash, petId, snack, day, counted, at: new Date().toISOString(),
    });
    if (!created) return { status: 409 as const, error: "这份食物已经用过了" };
    await appendOnce("claim.used", `food-used:${grant.data.tokenHash}`, {
      tokenHash: grant.data.tokenHash, petId, at: new Date().toISOString(),
    });
    return { status: 200 as const, ok: true, petId, snack, counted };
  });
  return NextResponse.json(result.status === 200 ? result : { error: result.error }, { status: result.status });
}

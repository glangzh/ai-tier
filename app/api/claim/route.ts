import { NextResponse } from "next/server";
import { appendOnce, hash, newToken, readAll, withEventLock } from "@/lib/events";
import { body, guard, ipDayHash } from "@/lib/http";

export const runtime = "nodejs";

/** 单浏览器会话对同一活动只发一份；同一 IP 每日最多 5 枚。 */
const PER_IP_PER_DAY = 5;

/**
 * 打卡"我领到了"：发放一次性 foodToken。会话 id 与 IP 都只留当日加盐哈希，
 * 不落任何个体信息。
 */
export async function POST(req: Request) {
  const blocked = guard(req, 30);
  if (blocked) return blocked;
  const j = await body(req);
  const offerKey = j?.offerKey, session = j?.session;
  if (typeof offerKey !== "string" || typeof session !== "string" || !session)
    return NextResponse.json({ error: "需要 offerKey 与 session" }, { status: 400 });
  const day = new Date().toISOString().slice(0, 10);
  const claimHash = hash(`${offerKey}:${session}`);
  const ipDay = ipDayHash(req, day);
  const result = await withEventLock("claim:global", async () => {
    const prev = await readAll<{ claimHash?: string; ipDay?: string; offerKey?: string; source?: string }>("claim/");
    const cardClaims = prev.filter((e) => e.type === "claim.grant" && e.data.source !== "visit");
    const sameIpSameOffer = cardClaims.some(
      (e) => e.type === "claim.grant" && e.data.offerKey === offerKey && e.data.ipDay === ipDay,
    );
    if (cardClaims.some((e) => e.data.claimHash === claimHash) || sameIpSameOffer)
      return { status: 409 as const, error: "这条已经领过了" };
    const mintedToday = cardClaims.filter((e) => e.data.ipDay === ipDay).length;
    if (mintedToday >= PER_IP_PER_DAY)
      return { status: 429 as const, error: `今天已经打了 ${PER_IP_PER_DAY} 次卡，明天再来` };

    const token = newToken();
    const created = await appendOnce("claim.grant", `claim:${ipDay}:${offerKey}`, {
      offerKey, claimHash, ipDay, day,
      tokenHash: hash(token), at: new Date().toISOString(),
    });
    if (!created) return { status: 409 as const, error: "这条已经领过了" };
    return { status: 200 as const, foodToken: token };
  });
  return NextResponse.json(result.status === 200 ? { foodToken: result.foodToken } : { error: result.error }, { status: result.status });
}

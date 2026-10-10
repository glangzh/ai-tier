import { NextResponse } from "next/server";
import { appendOnce, hash, newToken, readAll, withEventLock } from "@/lib/events";
import { guard, ipDayHash } from "@/lib/http";

export const runtime = "nodejs";

const VISIT_COOKIE = "airadar-visit";

function cookieValue(req: Request, name: string) {
  const prefix = `${name}=`;
  const item = (req.headers.get("cookie") ?? "")
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));
  return item ? item.slice(prefix.length) : null;
}

/**
 * 首次浏览当前会话自动发一份食物。会话 cookie 不设 Max-Age，关闭浏览器后自然失效；
 * 事件里只保留哈希，token 仍只在响应和浏览器本地短暂持有。
 */
export async function POST(req: Request) {
  const blocked = guard(req, 30);
  if (blocked) return blocked;

  const existingVisit = cookieValue(req, VISIT_COOKIE);
  const visitId = existingVisit || newToken();
  const visitHash = hash(visitId);
  const day = new Date().toISOString().slice(0, 10);
  const ipDay = ipDayHash(req, day);

  const result = await withEventLock("visit:global", async () => {
    const prev = await readAll<{ source?: string; visitHash?: string }>("claim/");
    if (prev.some((e) => e.type === "claim.grant" && e.data.source === "visit" && e.data.visitHash === visitHash))
      return { granted: false as const };

    const token = newToken();
    const created = await appendOnce("claim.grant", `visit:${visitHash}`, {
      source: "visit",
      visitHash,
      ipDay,
      day,
      tokenHash: hash(token),
      at: new Date().toISOString(),
    });
    return created ? { granted: true as const, foodToken: token } : { granted: false as const };
  });

  const response = NextResponse.json(result);
  if (!existingVisit) {
    response.cookies.set(VISIT_COOKIE, visitId, {
      httpOnly: true,
      sameSite: "lax",
      secure: new URL(req.url).protocol === "https:",
      path: "/",
    });
  }
  return response;
}

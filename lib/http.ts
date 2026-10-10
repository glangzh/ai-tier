import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

const hits = new Map<string, { n: number; t: number }>();

export const clientIp = (req: Request) =>
  req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";

/** 按天加盐哈希客户端 IP：用于日上限，不留可回溯的原始地址。 */
export const ipDayHash = (req: Request, day: string) =>
  createHash("sha256").update(`${process.env.EVENT_SALT ?? ""}|${day}|${clientIp(req)}`).digest("hex").slice(0, 16);

/** 无鉴权接口共用的两道闸：请求体大小与按 IP 的频次。 */
export function guard(req: Request, limit = 20): NextResponse | null {
  const ip = clientIp(req);
  const now = Date.now();
  const w = hits.get(ip) ?? { n: 0, t: now };
  if (now - w.t > 60_000) Object.assign(w, { n: 0, t: now });
  w.n += 1;
  hits.set(ip, w);
  if (w.n > limit) return NextResponse.json({ error: "too many requests" }, { status: 429 });
  return null;
}

export async function body(req: Request, max = 4096): Promise<Record<string, unknown> | null> {
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > max) return null;
  try {
    const j = await req.text();
    if (j.length > max) return null;
    return JSON.parse(j || "{}");
  } catch {
    return null;
  }
}

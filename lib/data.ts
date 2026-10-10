import { readFileSync } from "node:fs";
import { join } from "node:path";

const DATA = join(process.cwd(), "data");

export interface Offer {
  schemaVersion: number;
  offerKey: string;
  occurredAt: string;
  publishedAt: string;
  verification: string;
  category: string;
  promotionType?: string;
  appliesTo?: string[];
  planKind?: string | null;
  quantity?: { value: number; unit: string; raw: string } | null;
  vendor: string;
  entity?: string;
  amount?: string | null;
  eligibility?: string | null;
  baseline?: string | null;
  howToClaim?: string | null;
  startsAt?: string | null;
  startsAtText?: string | null;
  expiresAt?: string | null;
  expiresAtText?: string | null;
  window?: string | null;
  region?: string | null;
  restrictions?: string | null;
  claimUrl?: string | null;
  sourceId: string;
  facts: { quote: string; url: string; snapshot: string }[];
  corroboration?: { sourceId: string; quote: string; snapshot: string }[];
  supersedes?: string | null;
  withdrawn?: { reason: string; at: string | null } | null;
}

/**
 * 卡片只呈现一个可追溯入口：facts 按证据优先级排列，第一条 HTTP(S) URL 即主数据源。
 * 多条官方证据仍保留在详情页，避免列表卡片被多个外链打散。
 */
export function primarySourceUrl(o: Pick<Offer, "facts">): string {
  const fact = o.facts.find((item) => /^https?:\/\//i.test(item.url));
  if (!fact) throw new Error("公开优惠缺少可用的数据源链接");
  return fact.url;
}

import { OBJECT_LABEL, PROMOTION_LABEL, PLAN_KIND_LABEL, CLAIM_LABEL, EN_OBJECT_LABEL, EN_PROMOTION_LABEL, EN_PLAN_KIND_LABEL, EN_CLAIM_LABEL } from "./i18n/data-labels.js";

const read = <T,>(rel: string): T =>
  JSON.parse(readFileSync(join(DATA, rel), "utf8")) as T;



/** 一级：对象。other 只在真有内容时才上标签行。 */
export const OBJECT_ORDER = ["model", "agent", "subscription", "apiCredit"];



const resetStamp = (x: Offer) => x.occurredAt || x.publishedAt;

/** 纯函数：按 vendor+entity 取最近一次一次性限额重置事件。 */
export function latestResets(items: Offer[]) {
  const by = new Map<string, Offer>();
  for (const o of items.filter((x) => x.promotionType === "reset")) {
    const k = `${o.vendor}|${o.entity ?? ""}`;
    const prev = by.get(k);
    if (!prev || resetStamp(o) > resetStamp(prev)) by.set(k, o);
  }
  return by;
}

/** 每个实体最近一次已知的一次性限额重置事件。 */
export function resetIndex() {
  return latestResets([...deals(), ...safeRead("index/expired.json")]);
}

/** 二级：优惠类型。顺序与卡片排序一致，reset 最优先。 */
export const TYPE_ORDER = ["reset", "newcomer", "free", "discount", "bonus", "trial", "referral"];

/** 订阅子轴：判据是权益是否绑定厂商自家 Agent/harness。 */


export const PLAN_KIND_ORDER = ["toolPlan", "accountPlan", "codingPlan", "tokenPlan"];

export function planLabel(v?: string | null) {
  if (!v) return null;
  return (PLAN_KIND_LABEL as Record<string, string>)[v] ?? v;
}

/** 语言感知的标签访问器：中文沿用旧映射，其他语言走双语句表。 */
export function objectLabel(lang: "zh-CN" | "en", k: string) {
  return lang === "en" ? EN_OBJECT_LABEL[k as keyof typeof EN_OBJECT_LABEL] ?? k : OBJECT_LABEL[k as keyof typeof OBJECT_LABEL] ?? k;
}
export function typeLabel(lang: "zh-CN" | "en", k: string) {
  return lang === "en" ? EN_PROMOTION_LABEL[k as keyof typeof EN_PROMOTION_LABEL] ?? k : PROMOTION_LABEL[k as keyof typeof PROMOTION_LABEL] ?? k;
}
export function planLabelLang(lang: "zh-CN" | "en", v?: string | null) {
  if (!v) return null;
  const labels = lang === "en" ? EN_PLAN_KIND_LABEL : PLAN_KIND_LABEL;
  return (labels as Record<string, string>)[v] ?? v;
}
export function claimLabelLang(lang: "zh-CN" | "en", v?: string | null) {
  if (!v) return lang === "en" ? EN_CLAIM_LABEL.unknown : CLAIM_LABEL.unknown;
  const labels = lang === "en" ? EN_CLAIM_LABEL : CLAIM_LABEL;
  return (labels as Record<string, string>)[v] ?? v;
}

/**
 * 将数据层的撤回备注转换为读者能直接理解的原因。
 * 原备注可能包含 offerKey、sourceId 或 amendments 的处理过程，不能直接展示。
 */
export function publicWithdrawalReason(reason: string, lang: "zh-CN" | "en") {
  if (lang === "en") {
    if (/规则页原文取代/.test(reason)) return "The official rules page was updated; this entry was replaced by a later version.";
    if (/同一活动的完整记录/.test(reason)) return "The same deal was replaced with a complete version including its validity window and official rules.";
    if (/同义反复|类型错误/.test(reason)) return "The original entry did not match the source's deal type and was replaced with a corrected version.";
    if (/页面只给封顶口径/.test(reason)) return "The source only stated a maximum saving and did not provide comparable plan pricing.";
    return "This deal was withdrawn; see the source page for details.";
  }
  if (/规则页原文取代/.test(reason)) return "官方规则页已有更新，已使用后续版本。";
  if (/同一活动的完整记录/.test(reason)) return "同一活动已补充完整活动窗口与规则出处，并使用后续版本。";
  if (/同义反复|类型错误/.test(reason)) return "原记录的优惠类型与来源规则不一致，已按正确口径重新记录。";
  if (/页面只给封顶口径/.test(reason)) return "来源只给出封顶金额，缺少可核对的套餐价格，暂不计入当前优惠。";
  return "该优惠已撤回，具体原因以来源页面为准。";
}

/** 按 planKind 分组，只保留有内容的组。 */
export function groupByPlan(items: Offer[]) {
  return PLAN_KIND_ORDER.map((k) => ({
    kind: k,
    label: (PLAN_KIND_LABEL as Record<string, string>)[k],
    items: items.filter((o) => o.planKind === k),
  })).filter((g) => g.items.length);
}

export function countBy(items: Offer[], key: "appliesTo" | "promotionType") {
  const c: Record<string, number> = {};
  for (const o of items) {
    const vals = key === "appliesTo" ? (o.appliesTo ?? []) : [o.promotionType ?? ""];
    for (const v of vals) if (v) c[v] = (c[v] ?? 0) + 1;
  }
  return c;
}



export function claimLabel(v?: string | null) {
  if (!v) return "来源未说明";
  return (CLAIM_LABEL as Record<string, string>)[v] ?? "来源未说明";
}

export function deals(): Offer[] {
  try {
    return read<Offer[]>("index/deals.json");
  } catch {
    return [];
  }
}

export function expired(): Offer[] {
  return safeRead("index/expired.json");
}

export function stats() {
  try {
    return read<{ live: number; deals: number; expiringIn72h: number; pending: number }>(
      "index/stats.json",
    );
  } catch {
    return { live: 0, deals: 0, expiringIn72h: 0, pending: 0 };
  }
}

export function corroboration() {
  try {
    return read<{ checked: number; corroborated: number; rate: number }>(
      "index/corroboration.json",
    );
  } catch {
    return { checked: 0, corroborated: 0, rate: 0 };
  }
}

/** 完整 offer（含 facts 与 corroboration）来自索引产物，前端不读 data/offers 原始文件。 */
export function findOffer(key: string): Offer | undefined {
  const pool: Offer[] = [...deals(), ...safeRead("index/offers.json"), ...safeRead("index/expired.json")];
  return pool.find((o) => o.offerKey === key || o.offerKey.startsWith(key));
}

function safeRead(rel: string): Offer[] {
  try {
    return read<Offer[]>(rel);
  } catch {
    return [];
  }
}

/** 剩余时间：只给到"几天几小时"，不显示秒，避免让人以为页面在实时刷新。 */
export function countdownParts(iso: string | null | undefined, now = new Date()) {
  if (!iso) return null;
  const ms = Date.parse(iso) - now.getTime();
  if (Number.isNaN(ms)) return null;
  if (ms <= 0) return { ended: true as const };
  return {
    ended: false as const,
    d: Math.floor(ms / 86_400_000),
    h: Math.floor((ms % 86_400_000) / 3_600_000),
    m: Math.floor(ms / 60_000),
  };
}

/** 中文口径的倒计时文案（旧调用与单测沿用）。 */
export function countdown(iso: string | null | undefined, now = new Date()) {
  const p = countdownParts(iso, now);
  if (!p) return null;
  if (p.ended) return "已结束";
  if (p.d >= 1) return `剩 ${p.d} 天${p.h ? ` ${p.h} 小时` : ""}`;
  if (p.h >= 1) return `剩 ${p.h} 小时`;
  return `剩 ${p.m} 分钟`;
}

/** 按语言出倒计时文案。 */
export function countdownText(lang: "zh-CN" | "en", iso: string | null | undefined, now = new Date()) {
  const p = countdownParts(iso, now);
  if (!p) return null;
  if (p.ended) return lang === "en" ? "Ended" : "已结束";
  if (p.d >= 1) return lang === "en" ? `${p.d}d ${p.h ? p.h + 'h left' : ''}` : `剩 ${p.d} 天${p.h ? ` ${p.h} 小时` : ""}`;
  if (p.h >= 1) return lang === "en" ? `${p.h}h left` : `剩 ${p.h} 小时`;
  return lang === "en" ? `${p.m}m left` : `剩 ${p.m} 分钟`;
}

export function urgency(iso: string | null | undefined, now = new Date()) {
  if (!iso) return "normal";
  const ms = Date.parse(iso) - now.getTime();
  if (Number.isNaN(ms) || ms <= 0) return "ended";
  return ms < 72 * 3_600_000 ? "soon" : "normal";
}

/** 临期优先，其次按结束时间与类型。 */
export function sortForList(items: Offer[]) {
  return [...items].sort((a, b) => {
    const ua = urgency(a.expiresAt) === "soon" ? 0 : 1;
    const ub = urgency(b.expiresAt) === "soon" ? 0 : 1;
    if (ua !== ub) return ua - ub;
    const ta = a.expiresAt ? Date.parse(a.expiresAt) : 8.64e15;
    const tb = b.expiresAt ? Date.parse(b.expiresAt) : 8.64e15;
    if (ta !== tb) return ta - tb;
    return TYPE_ORDER.indexOf(a.promotionType ?? "") - TYPE_ORDER.indexOf(b.promotionType ?? "");
  });
}

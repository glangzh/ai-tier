#!/usr/bin/env node
/**
 * 公共 data 协议检查：site 只依赖这些产物，不依赖 agent 的实现。
 * 这里必须检查事实链，而不只是检查 JSON 形状；否则 agent 写错数据仍能越过 site 边界。
 */
import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { join, relative, resolve } from "node:path";

import { allowanceErrors } from "../lib/allowance-contract.js";

const ROOT = resolve(import.meta.dirname, "..");
const DATA = process.env.AIRADAR_DATA_DIR || join(ROOT, "data");
const DATA_ROOT = resolve(DATA);
const read = async (rel) => JSON.parse(await readFile(join(DATA, rel), "utf8"));
const fail = (message) => { throw new Error(message); };
const norm = (value) => String(value).replace(/[\s　]/g, "").toLowerCase();
const ENUM = {
  category: ["creditsPromotion", "pricingChange", "modelRetirement", "capabilityChange", "releaseNotable"],
  promotionType: ["free", "reset", "discount", "trial", "newcomer", "referral", "bonus", "allowance"],
  appliesTo: ["model", "agent", "subscription", "apiCredit", "other"],
};

async function jsonFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true }).catch(() => [])) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await jsonFiles(path));
    else if (entry.name.endsWith(".json")) out.push(path);
  }
  return out;
}

const sources = new Map();
for (const path of await jsonFiles(join(DATA, "sources"))) {
  const source = JSON.parse(await readFile(path, "utf8"));
  if (source?.id) sources.set(source.id, source);
}

const snapshots = new Map();
const snapshotFor = async (raw) => {
  const rel = String(raw).replace(/^data\//, "");
  const absolute = resolve(DATA, rel);
  const safeRel = relative(DATA_ROOT, absolute);
  if (safeRel.startsWith("..") || safeRel.includes(`..${process.platform === "win32" ? "\\" : "/"}`))
    fail(`快照指针越出 data/：${raw}`);
  if (!existsSync(absolute)) return null;
  if (!snapshots.has(absolute)) snapshots.set(absolute, JSON.parse(await readFile(absolute, "utf8")));
  return snapshots.get(absolute);
};

const deals = await read("index/deals.json");
const offers = await read("index/offers.json");
const expired = await read("index/expired.json");
const stats = await read("index/stats.json");

if (!Array.isArray(deals) || !Array.isArray(offers) || !Array.isArray(expired))
  fail("data/index 的公开索引必须是数组");

const inspect = async (items, label, live) => {
  const keys = new Set();
  for (const offer of items) {
    if (!offer || typeof offer !== "object") fail(`${label} 含非对象记录`);
    if (typeof offer.offerKey !== "string" || !offer.offerKey) fail(`${label} 记录缺少 offerKey`);
    if (keys.has(offer.offerKey)) fail(`${label} 中 offerKey 重复：${offer.offerKey}`);
    keys.add(offer.offerKey);
    for (const field of ["vendor", "sourceId", "category"]) {
      if (typeof offer[field] !== "string" || !offer[field]) fail(`${offer.offerKey} 缺少 ${field}`);
    }
    if (!sources.has(offer.sourceId)) fail(`${offer.offerKey} 引用了不存在的 sourceId：${offer.sourceId}`);
    if (!ENUM.category.includes(offer.category)) fail(`${offer.offerKey} category 非法：${offer.category}`);
    if (offer.promotionType != null && !ENUM.promotionType.includes(offer.promotionType))
      fail(`${offer.offerKey} promotionType 非法：${offer.promotionType}`);
    if (offer.appliesTo != null && (!Array.isArray(offer.appliesTo) || offer.appliesTo.some((x) => !ENUM.appliesTo.includes(x))))
      fail(`${offer.offerKey} appliesTo 非法`);
    if (live && (offer.verification === "pending" || offer.verification === "rejected"))
      fail(`未确认记录进入公开索引：${offer.offerKey}`);
    if (live && offer.withdrawn) fail(`已撤回记录进入公开索引：${offer.offerKey}`);
    if (!Array.isArray(offer.facts) || offer.facts.length === 0)
      fail(`${offer.offerKey} 缺少 facts`);
    if (typeof offer.facts.find((fact) => typeof fact?.url === "string" && /^https?:\/\//i.test(fact.url))?.url !== "string")
      fail(`${offer.offerKey} 缺少可用的数据源链接`);

    for (const error of allowanceErrors(offer)) fail(`${offer.offerKey}: ${error}`);

    const source = sources.get(offer.sourceId);
    for (const [i, fact] of offer.facts.entries()) {
      if (!fact || typeof fact.quote !== "string" || !fact.quote || typeof fact.url !== "string" || typeof fact.snapshot !== "string")
        fail(`${offer.offerKey} 的 facts[${i}] 必须含 quote / url / snapshot`);
      let url;
      try { url = new URL(fact.url); } catch { fail(`${offer.offerKey} 的 facts[${i}] URL 非法`); }
      if (!/^https?:$/.test(url.protocol)) fail(`${offer.offerKey} 的 facts[${i}] 不是 HTTP(S) URL`);
      if (!(source.allowedHosts ?? []).some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`)))
        fail(`${offer.offerKey} 的 facts[${i}] host 不在 source 白名单：${url.hostname}`);
      const snapshot = await snapshotFor(fact.snapshot);
      if (!snapshot?.normText) fail(`${offer.offerKey} 引用的快照不存在或缺 normText：${fact.snapshot}`);
      if (!norm(snapshot.normText).includes(norm(fact.quote)))
        fail(`${offer.offerKey} 的 facts[${i}] quote 未在快照中逐字命中`);
    }
  }
  return keys;
};

const offerKeys = await inspect(offers, "offers", true);
const dealKeys = await inspect(deals, "deals", true);
const expiredKeys = await inspect(expired, "expired", false);
for (const key of dealKeys) {
  if (!offerKeys.has(key)) fail(`deals 中的记录不在 offers：${key}`);
  const deal = deals.find((item) => item.offerKey === key);
  if (deal.category !== "creditsPromotion") fail(`deals 中存在非 creditsPromotion：${key}`);
}
for (const key of expiredKeys) if (offerKeys.has(key)) fail(`记录同时出现在 live 与 expired：${key}`);

if (stats.deals !== deals.length) fail(`stats.deals=${stats.deals} 与 deals.length=${deals.length} 不一致`);
if (stats.live !== offers.length) fail(`stats.live=${stats.live} 与 offers.length=${offers.length} 不一致`);
if (typeof stats.pending !== "number" || stats.pending < 0) fail("stats.pending 必须是非负数字");

console.log(`data contract ok: deals=${deals.length}, live=${offers.length}, expired=${expired.length}`);

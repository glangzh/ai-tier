#!/usr/bin/env node
/**
 * 构建产物断言：/deals 只渲染已确认活动，未确认的不得出现；详情页必须带来源与官方原文。
 * 用法：node scripts/check.mjs（需 BASE 指向已 next start 的实例，通常由 serve-check.mjs 起）
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.BASE || "http://127.0.0.1:3111";
const deals = JSON.parse(readFileSync(join(process.cwd(), "data", "index", "deals.json"), "utf8"));
const expired = JSON.parse(readFileSync(join(process.cwd(), "data", "index", "expired.json"), "utf8"));
const newest = deals.slice().sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))[0];
const internalSourceIds = [...new Set([...deals, ...expired].map((o) => o.sourceId).filter(Boolean))];
/** 趣味层不得进入数据面：所有派生产物都要干净。 */
const artifactText = ["deals.json", "stats.json", "heat.json", "corroboration.json"]
  .map((f) => {
    try {
      return readFileSync(join(process.cwd(), "data", "index", f), "utf8");
    } catch {
      return "";
    }
  })
  .join("\n");

const fails = [];
const read = (p) => fetchSync(`${BASE}/${p.replace(/\.html$/, "").replace(/\/index\.html$/, "")}`);
function fetchSync(url) {
  try {
    return execFileSync("curl", ["-sS", "-f", url], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  } catch {
    fails.push(`取不到 ${url}`);
    return "";
  }
}

const visibleText = (html) => html
  .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
  .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/&amp;/g, "&")
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">")
  .replace(/\s+/g, " ");

const ZH = "zh-CN";
const home = read(`${ZH}/deals`);
if (!home) {
  console.error(fails.join("\n"));
  process.exit(1);
}

const expect = (label, ok, detail) =>
  ok ? console.log(`  ✓ ${label}`) : fails.push(label + (detail ? ` [${detail}]` : ""));

console.log("构建产物检查：");
expect(`首页含 slogan`, home.includes("记得薅羊毛，避免错过一个亿！"));
expect(`在列优惠数 = ${deals.length}`, home.includes(`<b>${deals.length}</b>`));
expect("首页显示覆盖厂商", home.includes("覆盖厂商"));
expect("首页显示优惠类型", home.includes("优惠类型"));
expect(
  `首页首屏使用最近发布活动 ${newest?.offerKey ?? "—"}`,
  Boolean(newest) && home.includes(`${newest.vendor} ·`) && home.includes(newest.publishedAt.replace("T", " ").slice(0, 16)),
);
for (const o of deals) {
  expect(`卡片 ${o.offerKey} 出现在列表`, home.includes(`/${ZH}/p/${o.offerKey}`));
  const sourceUrl = o.facts?.find((f) => /^https?:\/\//i.test(f.url ?? ""))?.url;
  expect(`卡片 ${o.offerKey} 有数据源链接图标`, !!sourceUrl && home.includes(`data-source-link`));
  if (sourceUrl) expect(`卡片 ${o.offerKey} 指向主数据源`, home.includes(`href="${sourceUrl.replace(/&/g, "&amp;")}"`));
  const page = read(`${ZH}/p/${o.offerKey}`);
  expect(`详情页 ${o.offerKey} 有官方原文区块`, page.includes("官方原文"));
  expect(`详情页 ${o.offerKey} 引用可跳转`, page.includes("noopener noreferrer nofollow"));
  const pageText = visibleText(page);
  expect(`详情页 ${o.offerKey} 不显示内部记录 ID`, !pageText.includes(o.offerKey));
  expect(`详情页 ${o.offerKey} 不显示快照文件名`, !/快照 [^<\s]+\.json/.test(pageText));
  if (o.amount) expect(`详情页 ${o.offerKey} 显示金额原文`, page.includes(o.amount.replace(/&/g, "&amp;")));
  if (o.promotionType === "discount") {
    expect(`折扣 ${o.offerKey} 必须有原价/标准参照`, !!o.baseline);
    if (o.baseline) expect(`详情页 ${o.offerKey} 渲染原价 ${o.baseline}`, page.includes(o.baseline));
  }
}
expect("每张在列卡片只有一个数据源入口", (home.match(/<a[^>]*data-source-link/g) ?? []).length === deals.length);
expect("卡片数据源只显示图标", !home.includes(">数据源<") && !home.includes(">Source<"));

// 两级标签：一级对象（路由）+ 二级类型（页内筛选）
const OBJECT_LABELS = { model: "模型", agent: "Agent", subscription: "订阅", apiCredit: "API 额度" };
const TYPE_LABELS = {
  free: "免费",
  reset: "限额重置",
  discount: "折扣",
  trial: "试用",
  newcomer: "新人优惠",
  referral: "邀请返利",
  bonus: "充值返赠",
};
expect("一级标签行存在", home.includes('aria-label="一级：对象"'));
expect("二级标签行存在", home.includes('aria-label="二级：优惠类型"'));
expect("额度阈值行存在", home.includes('aria-label="额度阈值"'));
expect("卡片带可比额度", (home.match(/data-qty="/g) ?? []).length >= 10);
for (const [k, v] of Object.entries(OBJECT_LABELS)) {
  expect(`一级 ${v} 链到 /o/${k}`, home.includes(`href="/${ZH}/o/${k}"`));
}
const typesPresent = [...new Set(deals.flatMap((o) => o.promotionType ?? []))];
for (const t of typesPresent) {
  expect(`二级 ${TYPE_LABELS[t]} 出现在标签行`, home.includes(TYPE_LABELS[t]));
}
for (const o of deals) {
  expect(`卡片 ${o.offerKey} 带 data-type`, home.includes(`data-type="${o.promotionType}"`));
}
expect("卡片不再把 entity 伪装成选中标签", !/class="chip on"[^>]*>[a-z0-9-]+<\/span>/.test(home));
const nav = home.slice(home.indexOf("<header"), home.indexOf("</header>"));
expect("顶部导航不再重复一级对象", !/\/o\/(model|agent|subscription)/.test(nav));

// 排行榜：外部测算面的移植页，样式表只随它自己加载
const rank = read(`${ZH}/ranking`);
const rankEn = read("en/ranking");
const combo = read(`${ZH}/combo`);
const comboEn = read("en/combo");
const navOf = (h) => h.slice(h.indexOf("<nav"), h.indexOf("</nav>"));
expect("导航含排行榜与优惠两项", navOf(home).includes("/ranking") && navOf(home).includes("/deals"));
expect("排行榜入口排在优惠左侧", navOf(home).indexOf("/ranking") < navOf(home).indexOf("/deals"));
expect("组合策略是导航第三项", navOf(home).indexOf("/deals") < navOf(home).indexOf("/combo"));
expect("组合页中英预渲染且当前项高亮", combo.includes("高低搭配，找到合适的模型")
  && comboEn.includes("Pair models for the job") && /<a[^>]*class="on"[^>]*aria-current="page"[^>]*href="\/zh-CN\/combo"/.test(navOf(combo)));
expect("组合页标出 AA 快照与无重复缓存折扣", combo.includes("Artificial Analysis")
  && combo.includes("2026-09-30") && combo.includes("不叠加缓存折扣") && !combo.includes("缓存命中率"));
expect("当前页在导航里标 aria-current", /aria-current="page"/.test(home) && /aria-current="page"/.test(rank));
expect("导航当前项有常驻高亮类", /<a[^>]*class="on"[^>]*aria-current="page"/.test(navOf(home)) && /<a[^>]*class="on"[^>]*aria-current="page"/.test(navOf(rank)));
expect("榜页 SSR 有标题区", rank.includes("梯队榜"));
// 变化条目随每周测算而变，不能钉死某一周的公司名；这里只锁结构、下限与被禁标签。
const tierChanges = [...rank.matchAll(/（T\d）→[^（\n]{0,12}（T\d）/g)];
expect(
  "榜页只显示梯队变化结果",
  !rank.includes("最近更新")
    && !rank.includes(">梯队变化<")
    && tierChanges.length >= 3,
  `梯队变化 ${tierChanges.length} 条`,
);
expect("榜页移除站内说明", !rank.includes("不参与优惠口径的采集与校验") && !rankEn.includes("AIRadar only presents it"));
const cssOf = (h) => [...new Set(h.match(/\/_next\/static\/css\/[a-z0-9]+\.css/g) ?? [])];
expect("榜样式表不随优惠页加载", cssOf(rank).length > cssOf(home).length, `${cssOf(home).length} vs ${cssOf(rank).length}`);

// 双语路由：前缀页 + 308 + 英文界面词 + 事实原文不翻译
expect("无前缀路径 308 到默认语言", (await fetch(`${BASE}/deals`, { redirect: "manual" })).status === 308
  && (await fetch(`${BASE}/deals`, { redirect: "manual" })).headers.get("location") === `/${ZH}/deals`);
const en = read("en/deals");
expect("英文界面出英文词", en.includes("What you get") && en.includes("Who qualifies") && en.includes("Live deals"));
const vendorAmount = deals.find((o) => typeof o.amount === "string" && /[\u4e00-\u9fff]/.test(o.amount))?.amount;
expect("英文页保留厂商原文", !!vendorAmount && en.includes(vendorAmount.replace(/&/g, "&amp;")));
expect("英文页保留厂商原文说明", en.includes("Vendor text stays in its original form"));
expect("英文页无中文界面词", !en.includes("能拿多少") && !en.includes("谁能领"));
expect("导航带语言切换", home.includes("/en") && en.includes("/zh-CN"));
expect("html lang 随路由", en.includes('<html lang="en"') && home.includes('<html lang="zh-CN"'));

// 深浅主题：两套令牌都在，偏好脚本在首屏前跑
const baseCss = fetchSync(`${BASE}${cssOf(home)[0]}`);
// 压缩后的属性选择器会去掉引号，两种写法都要认
expect("样式表含深浅两套主题令牌", /\[data-theme\s*=\s*["']?light["']?\]/.test(baseCss) && /:root:not\(\[data-theme\s*=\s*["']?light["']?\]\)/.test(baseCss));
expect("主题偏好脚本随 HTML 首屏前执行", home.includes("airadar-theme"));
expect("顶栏有主题切换", home.includes("theme-toggle"));
expect(
  "语言与主题控制并列且各自独立圆形",
  home.includes("locale-controls")
    && home.includes("lang-switch")
    && /\.control-icon\{[^}]*border-radius:50%/.test(baseCss),
);
expect("主题按钮只渲染图标", home.includes("theme-icon") && !home.includes("☀ 浅色") && !home.includes("☾ 深色"));
if (process.env.NEXT_PUBLIC_INTERACTIONS_ENABLED !== "0")
  expect("宠物入口使用简短计数", home.includes("pet-corner") && !home.includes("宠物池 · 今日") && /今日\d+次/.test(home));
expect("页面使用获取时间", !home.includes("抓取时间"));
expect("热力图渲染一年格数", (home.match(/heat-cell/g) ?? []).length > 360);
expect("热力图每格带日期与条数", /（UTC）：\d+ 条活动/.test(home));

// 订阅子轴：工具订阅 / 账号订阅 / Coding plan / Token plan
const PLAN_LABELS = {
  toolPlan: "工具订阅",
  accountPlan: "账号订阅",
  codingPlan: "Coding plan",
  tokenPlan: "Token plan",
};
const subPage = read(`${ZH}/o/subscription`);
const subEn = read("en/o/subscription");
expect("订阅页有读者说明", subPage.includes("方便比较"));
const subTypeStart = subPage.indexOf('aria-label="二级：优惠类型"');
const subQtyStart = subPage.indexOf('aria-label="额度阈值"');
const subTypeRow = subPage.slice(subTypeStart, subQtyStart);
const subDeals = deals.filter((o) => (o.appliesTo ?? []).includes("subscription"));
const resetDeals = subDeals.filter((o) => o.promotionType === "reset");
expect("订阅页含限额重置筛选", subTypeRow.includes("限额重置") && subTypeRow.includes(`>${resetDeals.length}</b>`));
expect("订阅页全部数量按卡片计数", subTypeRow.includes(`>${subDeals.length}</b>`) && !subTypeRow.includes(`>${subDeals.length + resetDeals.length}</b>`));
expect("订阅页不显示限额重置专列入口", !subPage.includes("/zh-CN/reset"));
expect("订阅页只呈现真实限额重置记录", (subPage.match(/data-type="reset"/g) ?? []).length === resetDeals.length);
expect(
  "限额重置卡片显示事件时间与重置内容",
  resetDeals.every((o) => {
    const at = o.occurredAt.includes("T") ? `${o.occurredAt.slice(0, 16).replace("T", " ")} UTC` : o.occurredAt;
    return subPage.includes(at) && (!o.amount || subPage.includes(o.amount));
  }),
);
expect("订阅页不把周期刷新当成限额重置", !subPage.includes("重置规则") && !subPage.includes("quotaReset"));
const resetPath = await fetch(`${BASE}/${ZH}/reset`, { redirect: "manual" });
expect("旧限额重置路径已删除", resetPath.status === 404);
for (const o of subDeals) {
  expect(`订阅卡片 ${o.offerKey} 带 planKind`, !!o.planKind && !!PLAN_LABELS[o.planKind]);
  expect(`订阅卡片 ${o.offerKey} 显示 ${PLAN_LABELS[o.planKind ?? ""]}`, subPage.includes(PLAN_LABELS[o.planKind ?? ""]));
}
for (const kind of [...new Set(subDeals.map((o) => o.planKind))]) {
  expect(`订阅页有 ${PLAN_LABELS[kind]} 分组`, subPage.includes(`data-group="${kind}"`));
}

// 分发与归档面
const rss = read("rss.xml");
expect("RSS 条目数 = 在列优惠数", (rss.match(/<item>/g) ?? []).length === deals.length);
expect("RSS 条目指向详情页", deals.every((o) => rss.includes(`/p/${o.offerKey}`))); // RSS 仍是历史口径，单独断言
expect("RSS 不显示内部 sourceId", internalSourceIds.every((id) => !rss.includes(`来源：${id}`)));
expect("RSS 含数据源链接", deals.every((o) => {
  const sourceUrl = o.facts?.find((f) => /^https?:\/\//i.test(f.url ?? ""))?.url;
  return !!sourceUrl && rss.includes(sourceUrl.replace(/&/g, "&amp;"));
}));
const sm = read("sitemap.xml");
expect("sitemap 覆盖全部详情页", deals.every((o) => sm.includes(`/${ZH}/p/${o.offerKey}`)));
expect("sitemap 覆盖组合策略双语页", sm.includes(`/${ZH}/combo`) && sm.includes("/en/combo"));
expect("robots 指向 sitemap", read("robots.txt").includes("Sitemap:"));
const expPage = read(`${ZH}/expired`);
const expEn = read("en/expired");
expect("归档页显示下架原因", expPage.includes("下架原因") && expPage.includes("官方规则页已有更新"));
expect("归档卡片都有数据源入口", (expPage.match(/<a[^>]*data-source-link/g) ?? []).length === expired.length);
expect("归档记录不显示内部 ID", expired.every((o) => !visibleText(expPage).includes(o.offerKey) && !visibleText(expPage).includes(o.sourceId)));
const firstDetail = read(`${ZH}/p/${deals[0].offerKey}`);
expect("详情页有专属 title", /<title>[^<]*· AIRadar<\/title>/.test(firstDetail)
  && !firstDetail.includes("<title>AIRadar · 记得薅羊毛"));

const publicListPages = [home, en, subPage, subEn, expPage, expEn].map(visibleText).join(" ");
// entity 只要在任一 offer 的厂商原文引证里逐字出现过，它就是公开产品名而非内部标识。
// 跨 offer 判：qwen3.8-max 是 A 条的 entity，却出现在 B 条的正文与引证里，按单条判会误报。
const evidenceQuotes = [...deals, ...expired].flatMap((o) => (o.facts ?? []).map((f) => String(f.quote ?? "")));
const internalEntityIds = [...new Set([...deals, ...expired]
  .filter((o) => {
    const e = o.entity;
    return e && e !== o.vendor && !evidenceQuotes.some((q) => q.includes(e));
  })
  .map((o) => o.entity))];
const publicPages = [publicListPages, rank, rankEn, firstDetail].map(visibleText).join(" ");
expect("列表页不显示内部实体标识", internalEntityIds.every((entity) => !publicListPages.includes(entity)));
expect("公开页不显示数据层路径", !/offers\/|amendments\/|读侧|原始记录|read side|raw records/i.test(publicPages));
expect("公开页不显示内部记录 ID", !/\b[a-f0-9]{16}\b/i.test(publicPages));
expect("排行榜不显示测算项目说明", !rank.includes("ai-tier") && !rankEn.includes("ai-tier"));

// 未确认与已过期的记录不得出现在任何公开页面
const all = [home, ...deals.map((o) => read(`p/${o.offerKey}`))].join("");
for (const secret of ["cc86de0abfd5744c", "d9694316b7a7ee49"]) {
  expect(`未确认记录 ${secret} 未出现在公开页`, !all.includes(secret));
}
expect("宠物状态未泄漏进数据产物", !/petFeeds|foodToken|pet\/state|fullness/.test(artifactText));
expect("RSS 不含趣味层文案", !/宠物|投喂/.test(rss));

if (process.env.NEXT_PUBLIC_INTERACTIONS_ENABLED !== "0") {
// 趣味层挂在卡片上
expect("每张卡片带打卡入口", (home.match(/我领到了/g) ?? []).length === deals.length);
expect("打卡入口不冒充官方确认", home.includes("AIRadar 不代领"));
expect("宠物角在页面上", home.includes("pet-corner"));

// 在线面：4 个接口跑一遍真实往返（本地与 CI 写 .data/ 文件，线上写 Redis；接口一致）
const post = async (path, obj) => {
  const r = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(obj),
  });
  return { status: r.status, json: await r.json().catch(() => ({})) };
};

const visit = await fetch(`${BASE}/api/visit`, { method: "POST" });
const visitJson = await visit.json().catch(() => ({}));
const visitCookie = visit.headers.get("set-cookie")?.split(";", 1)[0] ?? "";
expect("首次浏览自动获得一份食物", visit.status === 200 && visitJson.granted === true && !!visitJson.foodToken && visitCookie.startsWith("airadar-visit="));
const revisit = await fetch(`${BASE}/api/visit`, { method: "POST", headers: { cookie: visitCookie } });
const revisitJson = await revisit.json().catch(() => ({}));
expect("同一浏览会话不重复获得食物", revisit.status === 200 && revisitJson.granted === false && !revisitJson.foodToken);

const claim = await post("/api/claim", { offerKey: "probe-offer", session: `s-${Date.now()}` });
expect("打卡发放一次性 foodToken", claim.status === 200 && !!claim.json.foodToken);
const twice = await post("/api/claim", { offerKey: "probe-offer", session: "same-session" });
expect("重复打卡被拒", twice.status === 409);
const otherSession = await post("/api/claim", { offerKey: "probe-offer", session: "another-session" });
expect("同 IP 换会话也不能重复领同一条", otherSession.status === 409);
const noSession = await post("/api/claim", { offerKey: "probe-offer" });
expect("缺 session 会被拒", noSession.status === 400);
let minted = [claim, twice, otherSession].filter((r) => r.status === 200).length;
let capped = false;
for (let i = 0; i < 8; i++) {
  const r = await post("/api/claim", { offerKey: `cap-${i}`, session: `cap-${i}` });
  if (r.status === 200) minted++;
  else if (r.status === 429) capped = true;
}
expect("单 IP 每日打卡封顶 5 枚", minted === 5 && capped, `发出 ${minted} 枚，429=${capped}`);
const fed = await post("/api/feed", { foodToken: claim.json.foodToken, petId: "mo" });
expect("投喂指定宠物生效且计入成长", fed.status === 200 && fed.json.petId === "mo" && fed.json.counted === true);
const again = await post("/api/feed", { foodToken: claim.json.foodToken, petId: "mo" });
expect("同一份食物不能投两次", again.status === 409);
const badPet = await post("/api/feed", { foodToken: claim.json.foodToken, petId: "nobody" });
expect("池外 petId 被拒", badPet.status === 400);
const state = await (await fetch(`${BASE}/api/pet/state`)).json();
expect("宠物状态含 6 只且可聚合", state.pets?.length === 6 && state.pets.some((p) => p.feeds >= 1));
expect("宠物状态不返回个体信息", !JSON.stringify(state).match(/[0-9a-f]{32,}|@/));

} else {
  expect("展示模式不显示打卡入口", !home.includes("我领到了"));
  expect("展示模式不显示宠物角", !home.includes("pet-corner"));
  for (const [path, method] of [["/api/visit", "POST"], ["/api/claim", "POST"], ["/api/feed", "POST"], ["/api/pet/state", "GET"]]) {
    const response = await fetch(`${BASE}${path}`, { method });
    const json = await response.json().catch(() => ({}));
    expect(`展示模式 ${path} 不访问互动存储`, response.status === 503 && json.error === "互动暂未开放");
  }
}

if (fails.length) {
  console.error("\n失败：\n" + fails.map((f) => "  ✗ " + f).join("\n"));
  process.exit(1);
}
console.log("\n全部通过");

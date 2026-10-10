#!/usr/bin/env node
/**
 * 站点分发产物：只读仓库内 data，写入 public。
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const DATA = join(ROOT, "data");
const PUBLIC = join(ROOT, "public");
const SITE = (process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "https://airadar.example")).replace(/\/$/, "");
const read = async (rel: string) => JSON.parse(await readFile(join(DATA, rel), "utf8"));
const esc = (s: unknown) => String(s ?? "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] ?? c));
const TYPE_LABEL: Record<string, string> = {
  free: "免费", reset: "限额重置", discount: "折扣", trial: "试用",
  newcomer: "新人优惠", referral: "邀请返利", bonus: "充值返赠",
};

const deals = await read("index/deals.json");
const expired = await read("index/expired.json");
const objects = ["model", "agent", "subscription", "apiCredit"];
const now = new Date().toUTCString();

const items = deals
  .slice()
  .sort((a: any, b: any) => (b.publishedAt || "").localeCompare(a.publishedAt || ""))
  .map((o: any) => {
    const sourceUrl = o.facts?.find((f: any) => /^https?:\/\//i.test(f.url ?? ""))?.url;
    return `    <item>
      <title>${esc(`${o.vendor} · ${o.amount || "优惠"} · ${TYPE_LABEL[o.promotionType] || "优惠"}`)}</title>
      <link>${SITE}/p/${o.offerKey}</link>
      <guid isPermaLink="false">${o.offerKey}</guid>
      <pubDate>${new Date(o.publishedAt).toUTCString()}</pubDate>
      <category>${esc(TYPE_LABEL[o.promotionType] || o.promotionType)}</category>
      <description>${esc([o.eligibility, o.baseline && `原价/标准：${o.baseline}`, o.expiresAtText && `到什么时候：${o.expiresAtText}`, sourceUrl && `来源链接：${sourceUrl}`].filter(Boolean).join(" ｜ "))}</description>
    </item>`;
  })
  .join("\n");

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
  <title>AIRadar · 记得薅羊毛，避免错过一个亿！</title>
  <link>${SITE}/zh-CN/deals</link>
  <description>AI 厂商的免费额度、折扣、新人优惠、限额重置，准实时抓取与失效下架</description>
  <lastBuildDate>${now}</lastBuildDate>
  <generator>AIRadar data contract</generator>
${items}
  </channel></rss>
`;

const LANGS = ["zh-CN", "en"];
const alt = (u: string) => LANGS.map((l) => `      <xhtml:link rel="alternate" hreflang="${l}" href="${SITE}/${l}${u}" />`).join("\n");
const entry = (u: string) => LANGS.map((l) => `  <url>\n    <loc>${SITE}/${l}${u}</loc>\n${alt(u)}\n  </url>`).join("\n");
const urls = ["/deals", "/expired", "/ranking", "/combo", ...objects.map((o) => `/o/${o}`), ...deals.map((o: any) => `/p/${o.offerKey}`)].map(entry).join("\n");
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`;
const robots = `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`;

await mkdir(PUBLIC, { recursive: true });
for (const [name, body] of Object.entries({ "rss.xml": rss, "sitemap.xml": sitemap, "robots.txt": robots }))
  await writeFile(join(PUBLIC, name), body);
console.log(`feeds 已生成：${deals.length} 条 RSS 条目（另 ${expired.length} 条已归档）`);

#!/usr/bin/env node
/**
 * 起一次生产服务器跑产物断言：静态导出与 Route Handlers 互斥后，
 * 断言改为对 `next start` 的真实响应做检查。
 * 用法：node scripts/serve-check.mjs
 */
import { spawn } from "node:child_process";
import { mkdtemp } from "node:fs/promises";
import { createConnection } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";

const PORT = process.env.PORT || "3111";
const BASE = `http://127.0.0.1:${PORT}`;
const EVENTS_DIR = await mkdtemp(join(tmpdir(), "airadar-check-events-"));

// 端口若被别的实例占着，下面的就绪探测会被冒名满足（/deals 308 跟随后照样拿到 200），
// 整套断言就跑在了别人的旧构建上——先探测，占着就直接失败退出。
const portBusy = await new Promise((resolve) => {
  const s = createConnection({ host: "127.0.0.1", port: Number(PORT) });
  s.once("connect", () => { s.destroy(); resolve(true); });
  s.once("error", () => resolve(false));
  s.setTimeout(1500, () => { s.destroy(); resolve(false); });
});
if (portBusy) {
  console.error(`❌ 端口 ${PORT} 已被占用：断言会打到别人的实例上。换 PORT 或清理残留进程后重试。`);
  process.exit(1);
}

const server = spawn("npx", ["next", "start", "-p", PORT], {
  cwd: process.cwd(),
  stdio: ["ignore", "inherit", "inherit"],
  // 断言走临时文件后端：events.ts 在设了 REDIS_URL 时会忽略 EVENTS_DIR 直连生产 Redis，
  // 而打卡日上限与一次性 token 是共享状态，会让断言互相污染。
  env: { ...process.env, NODE_ENV: "production", EVENTS_DIR, REDIS_URL: "" },
});
let childExited = false;
server.once("exit", () => { childExited = true; });

const deadline = Date.now() + 90_000;
let ready = false;
while (!childExited && Date.now() < deadline) {
  try {
    const r = await fetch(`${BASE}/deals`);
    if (r.ok) { ready = true; break; }
  } catch {
    /* 还没起来 */
  }
  await new Promise((r) => setTimeout(r, 700));
}

if (!ready || childExited) {
  console.error(`❌ 生产服务器未能在 ${PORT} 启动；请使用未占用的 PORT 重试`);
  server.kill("SIGTERM");
  process.exit(1);
}

let code = 0;
try {
  const { execFileSync } = await import("node:child_process");
  execFileSync("node", ["scripts/check.mjs"], { cwd: process.cwd(), env: { ...process.env, BASE }, stdio: "inherit" });
} catch (e) {
  code = e.status ?? 1;
}

server.kill("SIGTERM");
await new Promise((r) => setTimeout(r, 500));
server.kill("SIGKILL");
process.exit(code);

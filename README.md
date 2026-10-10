# AIRadar 前端

本目录是独立 Git 项目，包含前端源码和构建所需公开数据，可单独托管 GitHub。
上级 AIRadar 项目只做本地 Git 管理，不属于此前端仓库，也不能上传 GitHub。

```sh
pnpm install --frozen-lockfile
npm run verify
pnpm start
```

`data/` 随前端版本提交，因此单独克隆本仓库即可构建，无需采集器、父目录或内部数据。
在本地完整工作区更新数据后，从根目录运行 `npm run data:export`：仅导出公开索引、已验证梯队、模型搭配，以及公开活动引用的官方来源和证据。抓取状态、待审记录和完整事实源不导出。

GitHub 目标为 [glangzh/ai-tier](https://github.com/glangzh/ai-tier)，remote 仅配置在本目录：`git -C site remote add origin https://github.com/glangzh/ai-tier.git`（在完整工作区根目录执行）。

当前前端以 `main` 为发布分支；旧 Vite 版本备份在 `backup/vite-main-2026-10-10`。

## Vercel

仓库根目录就是独立前端，无需设置 `site/` 为远端 Root Directory。
`vercel.json` 指定 Next.js、锁定依赖安装和 `.next` 产物，`package.json` 指定 Node.js 24。
构建先校验公开数据、生成 RSS/sitemap/robots，再运行 Next.js 构建；feeds 使用 `SITE_URL` 或 Vercel 的生产域名。

当前 Vercel 仅上线展示页面，构建时设置 `NEXT_PUBLIC_INTERACTIONS_ENABLED=0`，隐藏打卡、领取食物和投喂入口，互动 API 返回 503“互动暂未开放”。本地默认仍可运行互动功能。

后续恢复线上互动前，需要配置可从云端访问的 `REDIS_URL` 和 `EVENT_SALT`，再移除展示模式构建开关；凭据只放环境变量，不进 Git。

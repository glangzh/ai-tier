# Git 与数据发布边界

- 本目录是独立前端 Git 仓库，只有本仓库允许提交和推送 GitHub。
- 上级 AIRadar 根仓库、采集代码、完整事实源、内部状态只能本地 Git 管理，禁止推送。
- `data/` 是根仓库 `scripts/export-site-data.mjs` 生成的公开产物，不手工修改；不复制上级整个 `data/`。
- 前端构建、数据协议检查和 feeds 都只读取本仓库的 `data/`，不得依赖上级目录。
- 数据实质更新时，相关前端与公开数据可以同一提交；推送前运行 `npm run verify`。
- 凭据、`.env`、运行状态、采集缓存、内部分析、根仓库历史不得进入本仓库或 GitHub。
- 保留用户已有修改，排除无关改动。禁止强制推送。
- 唯一 GitHub 目标：`https://github.com/glangzh/ai-tier`。推送前核对 `origin`；等价 SSH 地址可用，其它目标禁止推送。
- 用户已授权将当前前端合并为 `main` 并部署 Vercel；旧 Vite 版本保留在 `backup/vite-main-2026-10-10`。
- 迁移完成后，校验通过的前端与公开数据推送 `main`，由既有 Vercel GitHub 集成部署；不得推送根项目。

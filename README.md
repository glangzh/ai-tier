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

GitHub remote 必须配置在本目录：`git -C site remote add origin <明确的前端仓库地址>`（在完整工作区根目录执行）。

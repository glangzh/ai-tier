# AI 梯队排行榜

「AI 大模型梯队排行」的网页前端：把 AI 公司与其旗舰模型相对前沿的差距（天数）
分档展示，支持切换历史快照、对比两个时点的变化、查看各家的追赶趋势。

- **概览**：公司梯队分布、完整数据
- **快照对比**：任选两个快照，看谁进谁退
- **追赶趋势**：各家的差距随时间的变化
- **公司对比**：任选参照公司，看其余公司相对它的位置
- **模型梯队**：各模型的分数分布与所属梯队

技术栈：React 18 + Vite + TypeScript，纯静态 SPA，无后端。
界面文案中英双语，支持浅色 / 深色主题。

## 本地运行

```bash
npm install
npm run dev      # 开发预览
npm run build    # 产出 dist/
npm run preview  # 预览构建产物
```

## 部署

仓库已含平台配置，导入后直接部署，无需额外填写构建参数。

阿里云 ESA Pages（`esa.jsonc`）：

| 项 | 值 |
|---|---|
| 安装命令 | `npm install` |
| 构建命令 | `npm run build` |
| 静态资源目录 | `./dist` |
| 未匹配路由 | `singlePageApplication` |

Vercel（`vercel.json`）：

| 项 | 值 |
|---|---|
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Framework | Vite |

`vite.config.ts` 使用相对路径（`base: './'`），可托管在任意子路径下。

## 许可

[MIT](LICENSE)

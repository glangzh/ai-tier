import type { NextConfig } from "next";

// 10 个在线接口是 Route Handler，与 output: 'export' 互斥：公开页仍走构建期预渲染（SSG）。
// 双语路由前缀：/zh-CN/** 与 /en/** 各出一份静态页；无前缀的旧路径 308 到默认语言，
// 已发布出去的 RSS / 详情页链接不断。/api/** 不参与。
const legacy = ["/deals", "/expired", "/ranking", "/combo"];
const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },
  // 仓库内 data/ 是从本地事实源导出的公开构建数据。
  async redirects() {
    return [
      { source: "/", destination: "/zh-CN", permanent: true },
      ...legacy.map((p) => ({ source: p, destination: `/zh-CN${p}`, permanent: true })),
      { source: "/o/:object", destination: "/zh-CN/o/:object", permanent: true },
      { source: "/p/:slug", destination: "/zh-CN/p/:slug", permanent: true },
    ];
  },
};

export default nextConfig;

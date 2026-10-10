"use client";

import { useEffect, useRef } from "react";
import { addFood } from "@/lib/client";

/** 页面首次加载时领取一份访客食物；服务端用会话 cookie 保证刷新不重复发放。 */
export function VisitFood() {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    let disposed = false;

    void fetch("/api/visit", { method: "POST", cache: "no-store" })
      .then(async (response) => {
        const result = await response.json().catch(() => ({}));
        if (!disposed && response.ok && typeof result.foodToken === "string") addFood(result.foodToken);
      })
      .catch(() => {
        /* 自动奖励失败不影响优惠浏览，下一次页面加载会重试。 */
      });

    return () => {
      disposed = true;
    };
  }, []);

  return null;
}

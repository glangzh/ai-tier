"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/components/LangProvider";
import type { Lang } from "@/lib/i18n/site";

/** 顶部导航：当前项常驻高亮（aria-current + .on）。语言与主题控制在 layout 的同一组里。 */
export function SiteNav({ lang }: { lang: Lang }) {
  const path = usePathname() || "";
  const tr = useT();
  // 路由带 [lang] 前缀后，路径形如 /zh-CN/deals；把它换成另一种语言前缀就是切换链接
  const stripped = path.replace(/^\/(zh-CN|en)(?=\/|$)/, "") || "/";
  const on = (href: string) => {
    const p = `/${lang}${href === "/deals" ? "" : href}`;
    if (href === "/deals") return stripped === "/deals" || /^\/(o|p|expired)\b/.test(stripped);
    return stripped === href || stripped.startsWith(`${href}/`) || p === path;
  };
  return (
    <nav className="nav">
      <Link href={`/${lang}/ranking`} className={on("/ranking") ? "on" : undefined} aria-current={on("/ranking") ? "page" : undefined}>
        {tr("nav.ranking")}
      </Link>
      <Link href={`/${lang}/deals`} className={on("/deals") ? "on" : undefined} aria-current={on("/deals") ? "page" : undefined}>
        {tr("nav.deals")}
      </Link>
      <Link href={`/${lang}/combo`} className={on("/combo") ? "on" : undefined} aria-current={on("/combo") ? "page" : undefined}>
        {tr("nav.combo")}
      </Link>
    </nav>
  );
}

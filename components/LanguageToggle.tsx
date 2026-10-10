"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/components/LangProvider";
import { otherLang, type Lang } from "@/lib/i18n/site";

/** 在保持当前路径的前提下切换站内语言；与主题按钮并列放在同一控制组。 */
export function LanguageToggle({ lang }: { lang: Lang }) {
  const path = usePathname() || "";
  const tr = useT();
  const stripped = path.replace(/^\/(zh-CN|en)(?=\/|$)/, "") || "/";
  return (
    <Link
      className="control-icon lang-switch"
      href={`/${otherLang(lang)}${stripped}`}
      aria-label={tr("lang.toggle")}
      title={tr("lang.toggle")}
    >
      {tr("lang.toggle")}
    </Link>
  );
}

import type { Metadata } from "next";
import ComboLab from "@/components/ComboLab";
import { isLang, t, type Lang } from "@/lib/i18n/site";
import "../../combo.css";

export function generateStaticParams() {
  return [{ lang: "zh-CN" }, { lang: "en" }];
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang: raw } = await params;
  const lang: Lang = isLang(raw) ? raw : "zh-CN";
  return {
    title: t(lang, "combo.metaTitle"),
    description: t(lang, "combo.metaNote"),
    alternates: { canonical: `/${lang}/combo`, languages: { "zh-CN": "/zh-CN/combo", en: "/en/combo" } },
  };
}

export default function ComboPage() {
  return <ComboLab />;
}

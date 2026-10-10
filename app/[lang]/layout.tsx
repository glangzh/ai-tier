import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PetCorner } from "@/components/PetCorner";
import { VisitFood } from "@/components/VisitFood";
import { SiteNav } from "@/components/SiteNav";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LangProvider } from "@/components/LangProvider";
import { LANGS, isLang, t, type Lang } from "@/lib/i18n/site";
import { INTERACTIONS_ENABLED } from "@/lib/deployment";
import "../globals.css";

/**
 * 首屏前定主题：只认用户显式选过的值，没选过留空由 CSS 落到深色。
 * 属性由脚本写、不由 React 渲染，否则水合时会比对出 data-theme 不一致。
 */
const THEME_BOOT = `try{var t=localStorage.getItem('airadar-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`;

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang: raw } = await params;
  const lang: Lang = isLang(raw) ? raw : "zh-CN";
  return {
    title: lang === "en" ? "AIRadar · Professional deal hunting" : "AIRadar · 记得薅羊毛，避免错过一个亿！",
    description: t(lang, "footer.disclaimer"),
    alternates: {
      canonical: `/${lang}`,
      languages: { "zh-CN": "/zh-CN", en: "/en" },
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang: raw } = await params;
  if (!isLang(raw)) notFound();
  const lang: Lang = raw;

  return (
    <html lang={lang === "en" ? "en" : "zh-CN"} suppressHydrationWarning>
      <head>
        {/* THEME_BOOT 是模块内的常量字符串，无用户输入：只为在首屏前落定主题 */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      </head>
      <body>
        <LangProvider lang={lang}>
          <header className="topbar">
            <a className="brand" href={`/${lang}/deals`}>
              <span className="brand-mark">AR</span>
              <span className="brand-name">AIRadar</span>
            </a>
            <SiteNav lang={lang} />
            <p className="tagline">{t(lang, "tagline")}</p>
            <div className="locale-controls" aria-label={t(lang, "nav.controlsAria")}>
              <LanguageToggle lang={lang} />
              <ThemeToggle />
            </div>
          </header>
          <main className="wrap">{children}</main>
          <footer className="foot">
            <p>{t(lang, "footer.disclaimer")}</p>
            <p className="foot-links">
              <a href="/rss.xml">RSS</a>
              <a href={`/${lang}/deals`}>{t(lang, "footer.links.deals")}</a>
              <a href={`/${lang}/combo`}>{t(lang, "footer.links.combo")}</a>
              <a href={`/${lang}/expired`}>{t(lang, "footer.links.expired")}</a>
            </p>
          </footer>
          {INTERACTIONS_ENABLED && <VisitFood />}
          {INTERACTIONS_ENABLED && <PetCorner />}
        </LangProvider>
      </body>
    </html>
  );
}

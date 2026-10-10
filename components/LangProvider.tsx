"use client";

import { createContext, useContext, type ReactNode } from "react";
import { DEFAULT_LANG, type Lang, type UIKey, t as translate } from "@/lib/i18n/site";

const Ctx = createContext<Lang>(DEFAULT_LANG);

export function LangProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  return <Ctx.Provider value={lang}>{children}</Ctx.Provider>;
}

/** 客户端组件取当前语言与译文；服务端组件直接用 t(lang, …)。 */
export function useLang(): Lang {
  return useContext(Ctx);
}

export function useT(): (key: UIKey, vars?: Record<string, string | number>) => string {
  const lang = useContext(Ctx);
  return (key, vars) => translate(lang, key, vars);
}

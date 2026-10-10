"use client";

import { useT } from "@/components/LangProvider";
/** 深浅色切换：只写 data-theme 与偏好，图标由 CSS 按主题显隐，避免水合前后不一致。 */
export function ThemeToggle() {
  const tr = useT();
  function toggle() {
    const root = document.documentElement;
    const next = root.dataset.theme === "light" ? "dark" : "light";
    root.dataset.theme = next;
    localStorage.setItem("airadar-theme", next);
  }
  return (
    <button className="control-icon theme-toggle" type="button" onClick={toggle} aria-label={tr("theme.toggle")} title={tr("theme.toggle")}>
      <svg className="theme-icon only-dark" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>
      <svg className="theme-icon only-light" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M20.5 15.2A8.5 8.5 0 0 1 8.8 3.5 8.5 8.5 0 1 0 20.5 15.2Z" />
      </svg>
    </button>
  );
}

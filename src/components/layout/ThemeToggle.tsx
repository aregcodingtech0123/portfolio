"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "@/components/providers/ThemeProvider";

export function ThemeToggle() {
  const { mode, setMode } = useTheme();
  const [mounted, setMounted] = useState(false);
  const t = useTranslations("Nav");
  const locale = useLocale();

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  const isDark = mode === "dark";
  const label = isDark ? t("themeLight") : t("themeDark");
  const shortLabel =
    locale === "tr" ? (isDark ? "Açık" : "Koyu") : isDark ? "Light" : "Dark";

  return (
    <button
      type="button"
      onClick={() => setMode(isDark ? "light" : "dark")}
      className="inline-flex h-8 w-8 touch-manipulation items-center justify-center rounded-sm border border-border bg-surface font-mono text-[10px] text-muted transition-colors duration-150 hover:border-accent hover:text-accent minimal:h-auto minimal:w-auto minimal:rounded-none minimal:border-0 minimal:bg-transparent minimal:px-0 minimal:py-0.5 minimal:font-body minimal:text-xs minimal:font-normal minimal:normal-case minimal:tracking-normal minimal:text-muted minimal:hover:border-0 minimal:hover:text-foreground"
      aria-label={label}
      title={label}
    >
      <span className="minimal:hidden">
        {!mounted ? (
          <span className="h-3.5 w-3.5" />
        ) : isDark ? (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            aria-hidden
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
          </svg>
        ) : (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            aria-hidden
          >
            <path d="M21 14.5A8.5 8.5 0 0112.5 6a8.45 8.45 0 00-1.33 8.5A8.5 8.5 0 0021 14.5z" />
          </svg>
        )}
      </span>
      <span className="hidden minimal:inline">{mounted ? shortLabel : "…"}</span>
    </button>
  );
}

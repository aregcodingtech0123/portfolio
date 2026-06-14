"use client";

import { useLocale } from "next-intl";
import { useLayoutEffect, useRef, useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { motion } from "framer-motion";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const scrollRestoreY = useRef<number | null>(null);

  useLayoutEffect(() => {
    if (scrollRestoreY.current == null) return;
    const y = scrollRestoreY.current;
    scrollRestoreY.current = null;
    window.scrollTo({ top: y, left: 0, behavior: "auto" });
  }, [locale]);

  function switchTo(next: (typeof routing.locales)[number]) {
    if (next === locale) return;
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    scrollRestoreY.current = window.scrollY;
    startTransition(() => {
      router.replace(`${pathname}${hash}`, {
        locale: next,
        scroll: false,
      });
    });
  }

  return (
    <div
      className="relative flex touch-manipulation items-center gap-0.5 rounded-full border border-slate-300/80 bg-white/55 p-1 backdrop-blur-md dark:border-slate-500/25 dark:bg-slate-950/50"
      role="group"
      aria-label="Language"
    >
      {routing.locales.map((code) => {
        const active = code === locale;
        return (
          <button
            key={code}
            type="button"
            onClick={() => switchTo(code)}
            disabled={pending}
            className={`relative z-10 min-h-[36px] min-w-[36px] touch-manipulation rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
              active
                ? "text-white dark:text-slate-50"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {active && (
              <motion.span
                layoutId="lang-pill"
                className="absolute inset-0 z-[-1] rounded-full bg-gradient-to-r from-sky-500/90 to-cyan-400/80 shadow-[0_0_24px_rgba(56,189,248,0.35)]"
                transition={{ type: "spring", stiffness: 400, damping: 34 }}
              />
            )}
            <span className="relative">{code}</span>
          </button>
        );
      })}
    </div>
  );
}

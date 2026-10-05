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
      className="relative flex touch-manipulation items-center gap-0.5 rounded-md border border-border/80 bg-surface/55 p-1   "
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
            className={`relative z-10 min-h-[36px] min-w-[36px] touch-manipulation rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
              active
                ? "text-on-accent"
                : "text-muted hover:text-foreground  "
            }`}
          >
            {active && (
              <motion.span
                layoutId="lang-pill"
                className="absolute inset-0 z-[-1] rounded-sm bg-accent    "
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

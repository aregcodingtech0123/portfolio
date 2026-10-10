"use client";

import { useLocale } from "next-intl";
import { useLayoutEffect, useRef, useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

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
      className="flex touch-manipulation items-stretch overflow-hidden rounded-sm border border-border bg-surface minimal:gap-2 minimal:overflow-visible minimal:rounded-none minimal:border-0 minimal:bg-transparent"
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
            className={`min-h-8 min-w-8 touch-manipulation px-2 font-mono text-[10px] font-medium uppercase tracking-wider transition-colors duration-150 minimal:min-h-0 minimal:min-w-0 minimal:px-0 minimal:py-0.5 minimal:font-body minimal:text-xs minimal:font-normal minimal:tracking-normal ${
              active
                ? "bg-accent text-on-accent minimal:bg-transparent minimal:text-foreground minimal:underline minimal:underline-offset-[0.22em]"
                : "text-muted hover:text-foreground"
            }`}
          >
            {code}
          </button>
        );
      })}
    </div>
  );
}

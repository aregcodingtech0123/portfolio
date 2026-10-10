"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { useSiteContent } from "@/components/providers/SiteContentProvider";
import { sections as sectionConfig } from "@/config/sections";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { SkinSwitcher } from "./SkinSwitcher";
import {
  SocialExternalLinks,
  socialIconLinkClass,
  socialIconLinkClassNav,
} from "@/components/ui/SocialIcons";

function padIndex(n: number) {
  return String(n).padStart(2, "0");
}

function NavToggleGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-stretch gap-1">
      <span
        className="text-center font-mono text-[10px] uppercase tracking-[0.2em] text-accent/70 minimal:hidden"
        aria-hidden
      >
        {label}
      </span>
      {children}
    </div>
  );
}

export function Navbar() {
  const t = useTranslations("Nav");
  const s = useTranslations("Social");
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("home");
  const content = useSiteContent();
  const navSections = sectionConfig
    .filter((section) => section.inNav && section.isVisible(content))
    .map(({ id, navKey }, index) => ({
      id,
      key: navKey,
      num: padIndex(index + 1),
    }));
  const navSectionsRef = useRef(navSections);
  navSectionsRef.current = navSections;

  useEffect(() => {
    const atBottom = () =>
      window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - 2;

    const onScroll = () => {
      setScrolled(window.scrollY > 16);
      // The last section can be shorter than the mid-viewport band the
      // IntersectionObserver below watches, so it may never cross it before
      // the page bottoms out. Force the last visible nav section active
      // once scrolling can't go any further.
      if (atBottom()) {
        const sections = navSectionsRef.current;
        const last = sections[sections.length - 1];
        if (last) setActive(last.id);
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        if (
          window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight - 2
        ) {
          return;
        }
        for (const e of entries) {
          if (e.isIntersecting && e.target.id) {
            setActive(e.target.id);
          }
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    sectionConfig.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 min-w-0 transition-colors duration-200 ${
        scrolled
          ? "border-b border-border bg-surface/90 minimal:hairline-b minimal:border-border minimal:bg-background/95"
          : "border-b border-border/60 bg-background/80 minimal:hairline-b minimal:border-border/80 minimal:bg-background/90"
      }`}
    >
      <nav className="mx-auto flex min-h-[80px] min-w-0 w-full max-w-[1400px] items-center justify-between gap-3 px-4 py-5 md:px-8 minimal:min-h-14 minimal:max-w-content minimal:gap-4 minimal:px-5 minimal:py-4 sm:minimal:px-6">
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-1.5 font-mono text-xs tracking-wide text-muted transition-colors hover:text-accent minimal:font-heading minimal:text-base minimal:font-normal minimal:tracking-tight minimal:text-foreground minimal:hover:text-foreground"
        >
          <span className="decor text-accent">~/</span>
          <span className="whitespace-nowrap text-foreground group-hover:text-accent minimal:group-hover:text-foreground">
            <span className="minimal:hidden">_arda-ege-tunc</span>
            <span className="hidden minimal:inline">{content.siteName}</span>
          </span>
        </Link>

        <div className="hidden min-w-0 flex-1 items-center justify-end gap-2 lg:flex minimal:gap-3">
          <div className="flex flex-nowrap items-center justify-end gap-0.5 minimal:gap-x-4">
            {navSections.map(({ id, key, num }) => {
              const isActive = active === id;
              return (
                <Link
                  key={id}
                  href={`/#${id}`}
                  className={`relative whitespace-nowrap px-1.5 py-1.5 font-mono text-[11px] tracking-wide transition-colors duration-150 sm:px-2 minimal:px-0 minimal:py-1 minimal:font-body minimal:text-sm minimal:tracking-normal ${
                    isActive
                      ? "text-foreground minimal:underline minimal:decoration-foreground minimal:underline-offset-[0.28em]"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  <span className="decor mr-1 text-accent/80">{num}</span>
                  <span className="lowercase minimal:normal-case">{t(key)}</span>
                  {isActive && (
                    <span
                      className="absolute inset-x-1.5 -bottom-px h-px bg-accent sm:inset-x-2 minimal:hidden"
                      aria-hidden
                    />
                  )}
                </Link>
              );
            })}
          </div>

          <div className="ml-1 flex shrink-0 items-end gap-3 border-l border-border pl-2 sm:ml-2 sm:gap-4 sm:pl-2.5 minimal:ml-4 minimal:items-center minimal:gap-3 minimal:border-0 minimal:pl-0">
            <NavToggleGroup label={t("toggleMode")}>
              <ThemeToggle />
            </NavToggleGroup>
            <NavToggleGroup label={t("toggleLang")}>
              <LanguageSwitcher />
            </NavToggleGroup>
            <NavToggleGroup label={t("toggleStyle")}>
              <SkinSwitcher />
            </NavToggleGroup>

            <SocialExternalLinks
              ariaGithub={s("githubAria")}
              ariaLinkedin={s("linkedinAria")}
              className="mb-0.5 flex items-center gap-1 minimal:mb-0 minimal:gap-2"
              iconClassName="h-3.5 w-3.5"
              linkClassName={`${socialIconLinkClassNav} minimal:h-auto minimal:w-auto minimal:rounded-none minimal:border-0 minimal:bg-transparent minimal:p-0 minimal:text-muted minimal:hover:border-0 minimal:hover:text-foreground`}
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 lg:hidden minimal:gap-2">
          <ThemeToggle />
          <LanguageSwitcher />
          <SkinSwitcher />
          <button
            type="button"
            className="inline-flex h-8 w-8 touch-manipulation items-center justify-center rounded-sm border border-border bg-surface text-foreground minimal:h-8 minimal:w-8 minimal:rounded-none minimal:border-0 minimal:bg-transparent"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? t("closeMenu") : t("openMenu")}
            onClick={() => setOpen((v) => !v)}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              aria-hidden
            >
              {open ? (
                <path
                  strokeWidth="1.75"
                  strokeLinecap="square"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeWidth="1.75"
                  strokeLinecap="square"
                  d="M4 7h16M4 12h16M4 17h16"
                />
              )}
            </svg>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            id="mobile-nav"
            className="border-b border-border bg-surface lg:hidden minimal:border-border/60 minimal:bg-background"
          >
            <div className="mx-auto flex w-full max-w-content flex-col px-4 py-3 minimal:px-5 sm:minimal:px-6">
              {navSections.map(({ id, key, num }) => {
                const isActive = active === id;
                return (
                  <Link
                    key={id}
                    href={`/#${id}`}
                    onClick={() => setOpen(false)}
                    className={`flex touch-manipulation items-center gap-3 border-b border-border/60 px-1 py-3 font-mono text-sm last:border-b-0 minimal:border-border/40 minimal:px-0 minimal:py-3 minimal:font-body minimal:text-base ${
                      isActive
                        ? "text-accent minimal:text-foreground minimal:underline minimal:underline-offset-[0.22em]"
                        : "text-foreground hover:text-accent minimal:hover:text-foreground"
                    }`}
                  >
                    <span className="decor w-6 text-[11px] text-muted">{num}</span>
                    <span className="lowercase minimal:normal-case">{t(key)}</span>
                  </Link>
                );
              })}
              <div className="mt-3 flex items-center gap-3 border-t border-border pt-3 minimal:border-border/40">
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted minimal:font-body minimal:normal-case minimal:tracking-normal">
                  {s("mobileHeading")}
                </p>
                <SocialExternalLinks
                  ariaGithub={s("githubAria")}
                  ariaLinkedin={s("linkedinAria")}
                  className="flex items-center gap-2"
                  iconClassName="h-4 w-4"
                  linkClassName={`${socialIconLinkClass} minimal:h-auto minimal:w-auto minimal:rounded-none minimal:border-0 minimal:p-0`}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

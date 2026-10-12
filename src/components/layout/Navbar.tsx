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
  useEffect(() => {
    navSectionsRef.current = navSections;
  }, [navSections]);

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
          ? "border-b border-border bg-surface minimal:hairline-b minimal:border-border minimal:bg-background"
          : "border-b border-border/60 bg-background/80 minimal:hairline-b minimal:border-border/80 minimal:bg-background/90"
      }`}
    >
      <nav className="mx-auto flex min-h-[5.75rem] w-full max-w-full items-center justify-between gap-4 px-5 py-3.5 sm:gap-6 sm:px-6 lg:gap-3 lg:px-6 xl:gap-4 xl:px-8 minimal:min-h-[4.5rem] minimal:py-3">
        {/* Left: brand */}
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

        {/* Center: section links (desktop). justify-center-safe falls back to
            start alignment when the links overflow, so neither the first nor
            the last is pushed out of the (hidden-scrollbar) scrollport and
            clipped -- the bug plain justify-center caused. */}
        <div className="hidden min-w-0 flex-1 items-center justify-center-safe overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] lg:flex [&::-webkit-scrollbar]:hidden">
          <div className="flex flex-nowrap items-center justify-center-safe gap-1 xl:gap-2 2xl:gap-3">
            {navSections.map(({ id, key, num }) => {
              const isActive = active === id;
              return (
                <Link
                  key={id}
                  href={`/#${id}`}
                  className={`relative shrink-0 whitespace-nowrap px-0.5 py-1.5 font-mono text-[11px] tracking-wide transition-colors duration-150 xl:px-1.5 xl:text-xs minimal:px-0 minimal:py-1 minimal:font-body minimal:text-[13px] minimal:tracking-normal xl:minimal:text-sm ${
                    isActive
                      ? "text-foreground minimal:underline minimal:decoration-foreground minimal:underline-offset-[0.28em]"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className="decor mr-1 hidden text-accent-subtle 2xl:inline"
                  >
                    {num}
                  </span>
                  <span>{t(key)}</span>
                  {isActive && (
                    <span
                      className="absolute inset-x-1 -bottom-px h-px bg-accent xl:inset-x-1.5 minimal:hidden"
                      aria-hidden
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right: selectors + social (desktop) */}
        <div className="hidden shrink-0 items-center gap-2 lg:flex xl:gap-2.5">
          {/* Micro-labels from xl up; below that the controls are compact so
              the dense nav fits narrower desktop widths without clipping. */}
          <div className="flex items-end gap-1 xl:gap-2">
            <LanguageSwitcher labelFromXl />
            <ThemeToggle labelFromXl />
            <SkinSwitcher labelFromXl />
          </div>

          <SocialExternalLinks
            ariaGithub={s("githubAria")}
            ariaLinkedin={s("linkedinAria")}
            className="flex items-center gap-1 self-end pb-0.5 xl:gap-1.5"
            iconClassName="h-3.5 w-3.5"
            linkClassName={`${socialIconLinkClassNav} minimal:h-auto minimal:w-auto minimal:rounded-none minimal:border-0 minimal:bg-transparent minimal:p-0 minimal:text-muted minimal:hover:border-0 minimal:hover:text-foreground`}
          />
        </div>

        {/* Right: compact controls + menu (mobile / tablet) */}
        <div className="flex shrink-0 items-center gap-1.5 lg:hidden minimal:gap-2">
          <LanguageSwitcher showLabel={false} />
          <ThemeToggle showLabel={false} />
          <SkinSwitcher showLabel={false} />
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
                    <span>{t(key)}</span>
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

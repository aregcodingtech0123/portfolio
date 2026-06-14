"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import {
  SocialExternalLinks,
  socialIconLinkClass,
  socialIconLinkClassNav,
} from "@/components/ui/SocialIcons";

const sections = [
  { id: "home", key: "home" as const },
  { id: "about", key: "about" as const },
  { id: "projects", key: "projects" as const },
  { id: "certificates", key: "certificates" as const },
  { id: "skills", key: "skills" as const },
  { id: "ctf", key: "ctf" as const },
  { id: "experience", key: "experience" as const },
  { id: "contact", key: "contact" as const },
];

export function Navbar() {
  const t = useTranslations("Nav");
  const s = useTranslations("Social");
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("home");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.target.id) {
            setActive(e.target.id);
          }
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  const navShell =
    scrolled
      ? "border-b border-slate-200/70 bg-white/75 py-3 shadow-[0_8px_32px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-slate-700/40 dark:bg-slate-950/75 dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
      : "border-b border-transparent bg-transparent py-4 dark:py-5";

  return (
    <header className={`fixed inset-x-0 top-0 z-50 min-w-0 transition-all duration-300 ${navShell}`}>
      <nav className="mx-auto flex min-w-0 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group flex items-center gap-2 font-semibold tracking-tight text-slate-900 dark:text-slate-50"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-400 text-sm font-bold text-slate-950 shadow-[0_0_28px_rgba(56,189,248,0.45)]">
            AE
          </span>
          <span className="hidden text-sm uppercase tracking-[0.2em] text-slate-500 transition group-hover:text-sky-600 dark:text-slate-400 dark:group-hover:text-sky-300 sm:inline">
            Arda Ege
          </span>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {sections.map(({ id, key }) => (
            <Link
              key={id}
              href={`/#${id}`}
              className={`relative rounded-full px-3 py-2 text-sm font-medium transition ${
                active === id
                  ? "text-sky-600 dark:text-sky-300"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              }`}
            >
              {active === id && (
                <motion.span
                  layoutId="nav-dot"
                  className="absolute inset-x-2 -bottom-0.5 mx-auto h-0.5 rounded-full bg-gradient-to-r from-sky-400 to-cyan-400"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              {t(key)}
            </Link>
          ))}
          <div className="ml-3 flex items-center gap-2 border-l border-slate-200/90 pl-3 dark:border-slate-700/60">
            <ThemeToggle />
            <LanguageSwitcher />
            <SocialExternalLinks
              ariaGithub={s("githubAria")}
              ariaLinkedin={s("linkedinAria")}
              className="flex items-center gap-1.5"
              iconClassName="h-[18px] w-[18px]"
              linkClassName={socialIconLinkClassNav}
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 lg:hidden">
          <ThemeToggle />
          <LanguageSwitcher />
          <SocialExternalLinks
            ariaGithub={s("githubAria")}
            ariaLinkedin={s("linkedinAria")}
            className="flex items-center gap-0.5"
            iconClassName="h-[17px] w-[17px]"
            linkClassName={socialIconLinkClassNav}
          />
          <button
            type="button"
            className="inline-flex h-10 w-10 touch-manipulation items-center justify-center rounded-xl border border-slate-300/90 bg-white/70 text-slate-800 backdrop-blur-md dark:border-slate-600/50 dark:bg-slate-900/60 dark:text-slate-100"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? t("closeMenu") : t("openMenu")}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">{open ? t("closeMenu") : t("openMenu")}</span>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              {open ? (
                <path
                  strokeWidth="2"
                  strokeLinecap="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeWidth="2"
                  strokeLinecap="round"
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
            transition={{ duration: 0.22 }}
            id="mobile-nav"
            className="border-b border-slate-200/80 bg-white/95 backdrop-blur-xl dark:border-slate-700/40 dark:bg-slate-950/95 lg:hidden"
          >
            <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4">
              {sections.map(({ id, key }) => (
                <Link
                  key={id}
                  href={`/#${id}`}
                  onClick={() => setOpen(false)}
                  className={`touch-manipulation rounded-xl px-4 py-3 text-base font-medium ${
                    active === id
                      ? "bg-sky-500/15 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300"
                      : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60"
                  }`}
                >
                  {t(key)}
                </Link>
              ))}
              <div className="mt-3 border-t border-slate-200/80 pt-4 dark:border-slate-700/50">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {s("mobileHeading")}
                </p>
                <SocialExternalLinks
                  ariaGithub={s("githubAria")}
                  ariaLinkedin={s("linkedinAria")}
                  className="flex items-center gap-3 px-1"
                  iconClassName="h-5 w-5"
                  linkClassName={socialIconLinkClass}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

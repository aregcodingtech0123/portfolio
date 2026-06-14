"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "next-intl";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";
import { Link } from "@/i18n/navigation";
import { useSiteContent } from "@/components/providers/SiteContentProvider";

function TypingLine({
  text,
  onComplete,
}: {
  text: string;
  onComplete: () => void;
}) {
  const [display, setDisplay] = useState("");

  useEffect(() => {
    let i = 0;
    const timeouts: number[] = [];
    const tick = () => {
      i += 1;
      setDisplay(text.slice(0, i));
      if (i < text.length) {
        timeouts.push(window.setTimeout(tick, 38 + Math.random() * 28));
      } else {
        const pauseMs = Math.min(2600, 1500 + text.length * 28);
        timeouts.push(window.setTimeout(onComplete, pauseMs));
      }
    };
    timeouts.push(window.setTimeout(tick, 320));
    return () => timeouts.forEach((id) => clearTimeout(id));
  }, [text, onComplete]);

  return (
    <>
      {display}
      <span className="inline-block w-2 animate-pulse align-baseline text-sky-500 dark:text-sky-400">
        ▍
      </span>
    </>
  );
}

function HeroRoleTyping({ roles }: { roles: string[] }) {
  const [roleIndex, setRoleIndex] = useState(0);
  const advance = useCallback(() => {
    setRoleIndex((p) => (p + 1) % roles.length);
  }, [roles.length]);

  return (
    <TypingLine
      key={roleIndex}
      text={roles[roleIndex]}
      onComplete={advance}
    />
  );
}

export function Hero() {
  const { hero } = useSiteContent();
  const locale = useLocale();
  const reduceMotion = useReducedMotion();
  const roles = hero.typingRoles;

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const spotlight = useMotionTemplate`radial-gradient(520px circle at ${mx}px ${my}px, rgba(56,189,248,0.14), transparent 52%)`;

  return (
    <div
      id="home"
      className="relative isolate min-w-0 overflow-x-clip pt-[5.25rem] pb-12 sm:pt-[5.4rem] sm:pb-14 lg:pb-16"
      onMouseMove={(e) => {
        if (reduceMotion) return;
        const r = e.currentTarget.getBoundingClientRect();
        mx.set(e.clientX - r.left);
        my.set(e.clientY - r.top);
      }}
    >
      <div className="pointer-events-none absolute inset-0 grid-overlay opacity-50 dark:opacity-60" />
      {reduceMotion ? (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(520px_circle_at_50%_40%,rgba(56,189,248,0.1),transparent_55%)] opacity-60 dark:opacity-70" />
      ) : (
        <motion.div
          className="pointer-events-none absolute -inset-24 opacity-70 dark:opacity-80"
          style={{ background: spotlight }}
        />
      )}
      <div className="pointer-events-none absolute -right-24 top-12 h-56 w-56 rounded-full bg-cyan-400/15 blur-3xl dark:bg-cyan-500/20" />
      <div className="pointer-events-none absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-sky-400/12 blur-3xl dark:bg-sky-500/15" />

      <div className="relative z-10 mx-auto flex min-w-0 max-w-6xl flex-col gap-8 px-4 sm:gap-10 sm:px-6 lg:flex-row lg:items-center lg:gap-12 lg:px-8">
        <div className="min-w-0 flex-1">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm font-semibold uppercase tracking-[0.35em] text-sky-600 dark:text-sky-300/90"
          >
            {hero.greeting}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 }}
            className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-surface sm:text-4xl lg:text-5xl"
          >
            <span className="text-gradient">{hero.name}</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="mt-4 max-w-xl text-base leading-relaxed text-slate-600 break-words dark:text-slate-400 sm:text-lg"
          >
            <span className="text-slate-700 dark:text-slate-300">{hero.rolePrefix}</span>{" "}
            <span className="inline-block min-w-0 max-w-full font-semibold break-words text-sky-600 dark:text-sky-300">
              <HeroRoleTyping key={locale} roles={roles} />
            </span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Link
              href="/#projects"
              className="group relative inline-flex touch-manipulation items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 px-6 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_0_40px_rgba(56,189,248,0.35)] transition hover:shadow-[0_0_56px_rgba(34,211,238,0.45)]"
            >
              <span className="relative z-10">{hero.ctaProjects}</span>
              <motion.span
                className="absolute inset-0 bg-white/25"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.45 }}
              />
            </Link>
            <Link
              href="/#contact"
              className="touch-manipulation rounded-xl border border-slate-300/90 bg-white/50 px-6 py-2.5 text-sm font-semibold text-slate-800 backdrop-blur-md transition hover:border-sky-400/55 hover:text-sky-700 dark:border-slate-600/60 dark:bg-slate-900/40 dark:text-slate-100 dark:hover:border-sky-500/50 dark:hover:text-sky-200"
            >
              {hero.ctaContact}
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.28 }}
            className="mt-8 flex flex-wrap gap-2 sm:gap-3"
          >
            {[hero.badges.ai, hero.badges.fullstack, hero.badges.security].map(
              (label, i) => (
                <span
                  key={label}
                  className="motion-safe:animate-float glass-panel max-w-full rounded-full px-3 py-1.5 text-xs font-medium text-slate-700 break-words dark:text-slate-200 sm:px-4 sm:py-2"
                  style={{ animationDelay: `${i * 0.2}s` }}
                >
                  {label}
                </span>
              ),
            )}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.12, duration: 0.45 }}
          className="relative mx-auto flex w-full max-w-[280px] min-w-0 shrink-0 flex-1 justify-center lg:mx-0 lg:max-w-[300px] lg:justify-end"
        >
          <div className="relative w-full min-w-0">
            <div className="absolute -inset-3 rounded-[1.75rem] bg-gradient-to-br from-sky-400/35 via-cyan-400/25 to-transparent blur-xl dark:from-sky-500/40 dark:via-cyan-400/30" />
            <div className="glass-panel relative aspect-square w-full overflow-hidden rounded-[1.75rem] p-1 ring-1 ring-slate-200/60 dark:ring-transparent">
              <div className="flex h-full w-full flex-col items-center justify-center rounded-[1.6rem] bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-cyan-400 text-2xl font-bold text-slate-950 shadow-[0_0_40px_rgba(56,189,248,0.35)] sm:h-28 sm:w-28 sm:text-3xl">
                  AE
                </div>
                <p className="mt-5 max-w-[14rem] text-center text-xs font-medium text-slate-600 dark:text-slate-400 sm:text-sm">
                  {hero.profileTagline}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

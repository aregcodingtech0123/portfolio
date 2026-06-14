"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Lock, Shield, CalendarDays } from "lucide-react";
import { Section } from "@/components/ui/Section";
import type { CtfDisplay, CtfDifficulty } from "@/sanity/types";

const difficultyStyles: Record<
  CtfDifficulty,
  { badge: string; glow: string; labelKey: CtfDifficulty }
> = {
  easy: {
    badge:
      "border-emerald-500/45 bg-emerald-500/12 text-emerald-800 dark:text-emerald-200",
    glow: "from-emerald-500/20 via-transparent to-transparent",
    labelKey: "easy",
  },
  medium: {
    badge:
      "border-amber-500/45 bg-amber-500/12 text-amber-900 dark:text-amber-200",
    glow: "from-amber-500/20 via-transparent to-transparent",
    labelKey: "medium",
  },
  hard: {
    badge:
      "border-orange-500/45 bg-orange-500/12 text-orange-900 dark:text-orange-200",
    glow: "from-orange-500/25 via-transparent to-transparent",
    labelKey: "hard",
  },
  insane: {
    badge:
      "border-rose-500/50 bg-rose-500/12 text-rose-900 dark:text-rose-200",
    glow: "from-rose-500/25 via-transparent to-transparent",
    labelKey: "insane",
  },
};

function formatSolvedDate(date: string, locale: string): string {
  try {
    return new Date(date).toLocaleDateString(locale === "tr" ? "tr-TR" : "en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return date;
  }
}

function CtfCard({ entry, index }: { entry: CtfDisplay; index: number }) {
  const t = useTranslations("CTF");
  const locale = useLocale();
  const style = difficultyStyles[entry.difficulty] ?? difficultyStyles.medium;

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white/95 shadow-[0_12px_40px_rgba(15,23,42,0.06)] transition duration-300 hover:border-rose-400/35 hover:shadow-[0_20px_50px_rgba(244,63,94,0.12)] dark:border-slate-700/60 dark:bg-slate-950/80 dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)] dark:hover:border-rose-500/30"
    >
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br opacity-0 transition duration-500 group-hover:opacity-100 ${style.glow}`}
      />

      <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-rose-950/40">
        {entry.imageUrl ? (
          <Image
            src={entry.imageUrl}
            alt={entry.imageAlt || entry.title}
            fill
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 grid-overlay opacity-30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
        <div className="absolute left-4 top-4 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-100 backdrop-blur-md">
            <Shield className="h-3.5 w-3.5 text-rose-300" aria-hidden />
            {entry.platform}
          </span>
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-lg font-bold tracking-tight text-white sm:text-xl">
            {entry.title}
          </h3>
        </div>
      </div>

      <div className="relative flex flex-1 flex-col gap-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${style.badge}`}
          >
            {t(`difficulty.${style.labelKey}`)}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden />
            {formatSolvedDate(entry.dateSolved, locale)}
          </span>
          {entry.hasWriteup && (
            <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-300">
              {t("writeupAvailable")}
            </span>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            {t("toolsLabel")}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {entry.tools.map((tool) => (
              <span
                key={tool}
                className="rounded-lg border border-slate-200/90 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 dark:border-slate-700/70 dark:bg-slate-900/80 dark:text-slate-200"
              >
                {tool}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.article>
  );
}

type CtfProps = {
  ctfs: CtfDisplay[];
};

export function Ctf({ ctfs }: CtfProps) {
  const t = useTranslations("CTF");

  if (!ctfs.length) return null;

  return (
    <Section id="ctf" className="py-16 sm:py-24">
      <div className="mx-auto min-w-0 max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-rose-600 dark:text-rose-400/90">
            <Lock className="h-3.5 w-3.5" aria-hidden strokeWidth={2} />
            {t("title")}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-surface sm:text-4xl">
            {t("subtitle")}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-400">
            {t("intro")}
          </p>
        </div>

        <div className="mt-12 grid min-w-0 gap-6 sm:gap-8 md:grid-cols-2 xl:grid-cols-3">
          {ctfs.map((entry, index) => (
            <CtfCard key={entry.id} entry={entry} index={index} />
          ))}
        </div>
      </div>
    </Section>
  );
}

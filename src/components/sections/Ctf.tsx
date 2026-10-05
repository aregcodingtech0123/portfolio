"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Lock, Shield, CalendarDays } from "lucide-react";
import { Section } from "@/components/ui/Section";
import type { CtfDisplay, CtfDifficulty } from "@/sanity/types";

const difficultyStyles: Record<
  CtfDifficulty,
  { badge: string; labelKey: CtfDifficulty }
> = {
  easy: {
    badge: "border-difficulty-easy text-difficulty-easy",
    labelKey: "easy",
  },
  medium: {
    badge: "border-difficulty-medium text-difficulty-medium",
    labelKey: "medium",
  },
  hard: {
    badge: "border-difficulty-hard text-difficulty-hard",
    labelKey: "hard",
  },
  insane: {
    badge: "border-difficulty-insane text-difficulty-insane",
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
      className="group relative flex h-full flex-col overflow-hidden rounded-md border border-border/90 bg-surface/95  transition duration-300 hover:border-danger/35     "
    >

      <div className="relative aspect-[16/10] w-full overflow-hidden bg-tag">
        {entry.imageUrl ? (
          <Image
            src={entry.imageUrl}
            alt={entry.imageAlt || entry.title}
            fill
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 bg-tag" />
        )}
        <div className="absolute inset-0 bg-scrim" />
        <div className="absolute left-4 top-4 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border/15 bg-scrim px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-on-media ">
            <Shield className="h-3.5 w-3.5 text-danger" aria-hidden />
            {entry.platform}
          </span>
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-lg font-bold tracking-tight text-on-media sm:text-xl">
            {entry.title}
          </h3>
        </div>
      </div>

      <div className="relative flex flex-1 flex-col gap-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-md border px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${style.badge}`}
          >
            {t(`difficulty.${style.labelKey}`)}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-muted ">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden />
            {formatSolvedDate(entry.dateSolved, locale)}
          </span>
          {entry.hasWriteup && (
            <span className="rounded-md border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent ">
              {t("writeupAvailable")}
            </span>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            {t("toolsLabel")}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {entry.tools.map((tool) => (
              <span
                key={tool}
                className="rounded-md border border-border/90 bg-surface px-2.5 py-1 text-xs font-medium text-foreground   "
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
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-danger ">
            <Lock className="h-3.5 w-3.5" aria-hidden strokeWidth={2} />
            {t("title")}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground  sm:text-4xl">
            {t("subtitle")}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted ">
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

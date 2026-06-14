"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Section } from "@/components/ui/Section";
import type { ExperienceItem } from "@/types/content";

export function Experience({ items }: { items: ExperienceItem[] }) {
  const t = useTranslations("Experience");

  return (
    <Section id="experience" className="py-16 sm:py-24">
      <div className="mx-auto min-w-0 max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="min-w-0 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-600 dark:text-sky-400/90">
            {t("title")}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-surface sm:text-4xl">
            {t("subtitle")}
          </h2>
        </div>

        <div className="relative mx-auto mt-16 min-w-0 max-w-3xl">
          {items.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300/80 bg-slate-50/80 px-6 py-8 text-center text-sm text-slate-600 dark:border-slate-600/60 dark:bg-slate-900/40 dark:text-slate-400">
              {t("emptyBody")}
            </p>
          ) : (
          <>
          <div className="pointer-events-none absolute left-[11px] top-2 bottom-4 w-px bg-gradient-to-b from-sky-500/80 via-sky-400/40 to-transparent md:left-4" />
          <ul className="space-y-12">
            {items.map((item, i) => (
              <motion.li
                key={`${item.company}-${item.period}`}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="relative pl-10 md:pl-14"
              >
                <span className="absolute left-0 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white ring-2 ring-sky-400/70 dark:bg-slate-950 md:left-1">
                  <span className="h-2 w-2 rounded-full bg-gradient-to-br from-sky-400 to-cyan-300 shadow-[0_0_12px_rgba(56,189,248,0.9)]" />
                </span>
                <div className="glass-panel min-w-0 rounded-2xl p-6 md:p-8">
                  <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wider text-sky-600 break-words dark:text-sky-300/90">
                        {item.company}
                      </p>
                      <p className="mt-1 text-lg font-semibold break-words text-slate-900 dark:text-slate-50">
                        {item.role}
                      </p>
                    </div>
                    <span className="inline-flex w-fit rounded-full border border-slate-300/90 bg-slate-100/90 px-3 py-1 text-xs font-mono text-slate-600 dark:border-slate-600/60 dark:bg-slate-900/60 dark:text-slate-300">
                      {item.period}
                    </span>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed break-words text-slate-600 dark:text-slate-400">
                    {item.detail}
                  </p>
                </div>
              </motion.li>
            ))}
          </ul>
          </>
          )}
        </div>
      </div>
    </Section>
  );
}

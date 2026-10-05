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
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent ">
            {t("title")}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground  sm:text-4xl">
            {t("subtitle")}
          </h2>
        </div>

        <div className="relative mx-auto mt-16 min-w-0 max-w-3xl">
          {items.length === 0 ? (
            <p className="rounded-md border border-dashed border-border/80 bg-surface/80 px-6 py-8 text-center text-sm text-muted   ">
              {t("emptyBody")}
            </p>
          ) : (
          <>
          <div className="pointer-events-none absolute left-[11px] top-2 bottom-4 w-px bg-border md:left-4" />
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
                <span className="absolute left-0 top-2 flex h-6 w-6 items-center justify-center rounded-sm border border-accent bg-background md:left-1">
                  <span className="h-2 w-2 rounded-sm bg-accent" />
                </span>
                <div className="bg-surface border border-border min-w-0 rounded-md p-6 md:p-8">
                  <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wider text-accent break-words ">
                        {item.company}
                      </p>
                      <p className="mt-1 text-lg font-semibold break-words text-foreground ">
                        {item.role}
                      </p>
                    </div>
                    <span className="inline-flex w-fit rounded-md border border-border/90 bg-surface/90 px-3 py-1 text-xs font-mono text-muted   ">
                      {item.period}
                    </span>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed break-words text-muted ">
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

"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Section } from "@/components/ui/Section";
import {
  skillCategories as defaultSkillCategories,
  type SkillCategoryId,
  type SkillTierId,
} from "@/data/skills";
import type { SkillCategoryDisplay } from "@/sanity/fetch";

type SkillsProps = {
  categories?: SkillCategoryDisplay[];
};

function IconFor({ id }: { id: SkillCategoryId }) {
  const common =
    "h-6 w-6 text-sky-600 dark:text-sky-300";
  switch (id) {
    case "ai":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            strokeWidth="1.6"
            strokeLinecap="round"
            d="M12 3v3m0 12v3M4.5 7.5l2.6 1.5m10 5.8l2.6 1.5M3 12h3m12 0h3M4.5 16.5l2.6-1.5m10-5.8l2.6-1.5"
          />
          <circle cx="12" cy="12" r="3.2" strokeWidth="1.6" />
        </svg>
      );
    case "frontend":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeWidth="1.6" d="M4 6h16v12H4z" />
          <path strokeWidth="1.6" strokeLinecap="round" d="M8 10h8M8 14h5" />
        </svg>
      );
    case "backend":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <ellipse cx="12" cy="5" rx="4" ry="2" strokeWidth="1.6" />
          <path strokeWidth="1.6" d="M8 5v14m8-14v14" />
          <ellipse cx="12" cy="19" rx="4" ry="2" strokeWidth="1.6" />
        </svg>
      );
    case "security":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            strokeWidth="1.6"
            strokeLinejoin="round"
            d="M12 3l8 4v6c0 5-3.5 9.2-8 10-4.5-.8-8-5-8-10V7l8-4z"
          />
          <path strokeWidth="1.6" strokeLinecap="round" d="M9.5 12.5l2 2 3.5-4" />
        </svg>
      );
    default:
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeWidth="1.6" strokeLinecap="round" d="M7 8h10M7 12h6M7 16h10" />
          <rect x="4" y="5" width="16" height="14" rx="2" strokeWidth="1.6" />
        </svg>
      );
  }
}

const tierStyles: Record<
  SkillTierId,
  { badge: string }
> = {
  expertise: {
    badge:
      "border-teal-500/55 bg-teal-500/12 text-teal-900 dark:text-teal-100 shadow-[0_0_20px_rgba(20,184,166,0.12)]",
  },
  comfortable: {
    badge:
      "border-sky-500/50 bg-sky-500/10 text-sky-900 dark:text-sky-100 shadow-[0_0_18px_rgba(56,189,248,0.1)]",
  },
  learning: {
    badge:
      "border-violet-500/45 bg-violet-500/10 text-violet-900 dark:text-violet-100 shadow-[0_0_18px_rgba(139,92,246,0.1)]",
  },
};

export function Skills({ categories }: SkillsProps) {
  const t = useTranslations("Skills");
  const skillCategories = categories ?? defaultSkillCategories.map((cat) => ({
    id: cat.id,
    label: "",
    groups: cat.groups,
  }));

  return (
    <Section id="skills" className="py-16 sm:py-24">
      <div className="mx-auto min-w-0 max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-600 dark:text-sky-400/90">
            {t("title")}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-surface sm:text-4xl">
            {t("subtitle")}
          </h2>
        </div>

        <div className="mt-12 grid min-w-0 gap-6 sm:gap-8 lg:grid-cols-2">
          {skillCategories.map((cat, ci) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: ci * 0.06 }}
              className="glass-panel group min-w-0 rounded-3xl p-6 sm:p-8 transition hover:border-sky-500/25"
            >
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-500/10 ring-1 ring-sky-500/25 transition group-hover:bg-sky-500/15 dark:bg-sky-500/10">
                  <IconFor id={cat.id} />
                </div>
                <h3 className="min-w-0 flex-1 text-lg font-semibold break-words text-slate-900 dark:text-slate-50">
                  {cat.label || t(`categories.${cat.id}`)}
                </h3>
              </div>

              <div className="mt-8 space-y-7">
                <div className="flex flex-wrap gap-2">
                  {cat.groups.flatMap((group) =>
                    group.skills.map((skill) => (
                      <span
                        key={`${group.tier}-${skill}`}
                        className={`max-w-full rounded-lg border px-3 py-1.5 text-xs font-semibold break-words transition ${tierStyles[group.tier].badge}`}
                      >
                        {skill}
                      </span>
                    )),
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}

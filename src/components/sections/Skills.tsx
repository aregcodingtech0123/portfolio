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
    "h-6 w-6 text-accent ";
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
    badge: "border-tier-expert text-tier-expert",
  },
  comfortable: {
    badge: "border-tier-comfortable text-tier-comfortable",
  },
  learning: {
    badge: "border-dashed border-tier-learning text-tier-learning",
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
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent ">
            {t("title")}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground  sm:text-4xl">
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
              className="bg-surface border border-border group min-w-0 rounded-md p-6 sm:p-8 transition hover:border-accent/25"
            >
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-accent/10   transition group-hover:bg-accent/15 ">
                  <IconFor id={cat.id} />
                </div>
                <h3 className="min-w-0 flex-1 text-lg font-semibold break-words text-foreground ">
                  {cat.label || t(`categories.${cat.id}`)}
                </h3>
              </div>

              <div className="mt-8 space-y-7">
                <div className="flex flex-wrap gap-2">
                  {cat.groups.flatMap((group) =>
                    group.skills.map((skill) => (
                      <span
                        key={`${group.tier}-${skill}`}
                        className={`max-w-full rounded-md border px-3 py-1.5 text-xs font-semibold break-words transition ${tierStyles[group.tier].badge}`}
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

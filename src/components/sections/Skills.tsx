"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Section } from "@/components/ui/Section";
import type { SkillCategoryDisplay } from "@/sanity/fetch";
import type { SkillCategoryId, SkillDisplay, SkillLevel } from "@/sanity/types";

type SkillsProps = {
  categories: SkillCategoryDisplay[];
};

/** CLI path segment for each skill category. */
const CATEGORY_PATH: Record<SkillCategoryId, string> = {
  ai: "ai-ml",
  frontend: "frontend",
  backend: "backend",
  security: "security",
  languages: "languages",
};

const LEVEL_KEY = {
  daily: "daily",
  "used-in-project": "usedInProject",
  learning: "learning",
} as const satisfies Record<SkillLevel, string>;

function flattenSkills(cat: SkillCategoryDisplay): SkillDisplay[] {
  return cat.groups.flatMap((group) => group.skills);
}

/** Terminal: panel styled as `$ cat skills/<path>.txt` output. */
function TerminalSkillPanel({
  categoryId,
  label,
  skills,
}: {
  categoryId: SkillCategoryId;
  label: string;
  skills: SkillDisplay[];
}) {
  if (skills.length === 0) return null;

  const path = CATEGORY_PATH[categoryId] ?? categoryId;

  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-md border border-border bg-surface">
      <div className="flex items-center gap-1.5 border-b border-border px-3 py-2">
        <span className="h-2 w-2 shrink-0 rounded-sm bg-danger" aria-hidden />
        <span className="h-2 w-2 shrink-0 rounded-sm bg-warning" aria-hidden />
        <span className="h-2 w-2 shrink-0 rounded-sm bg-accent" aria-hidden />
        <span className="ml-2 truncate font-mono text-[10px] tracking-wide text-muted">
          ~/skills/{path}.txt
        </span>
      </div>

      <div className="flex flex-1 flex-col px-3 py-3 sm:px-4 sm:py-4">
        <p className="font-mono text-[11px] text-muted">
          <span className="text-accent">$</span>
          {" cat skills/"}
          {path}
          {".txt"}
        </p>
        <p className="mt-2 font-mono text-[10px] tracking-wide text-muted">
          {"# "}
          {label}
        </p>

        <ul className="mt-3 flex flex-wrap gap-1.5">
          {skills.map((skill) => (
            <li key={skill.name}>
              <span className="inline-flex max-w-full items-center rounded-sm border border-border bg-background px-2 py-1 font-mono text-[11px] break-words text-foreground transition-colors hover:border-accent hover:text-accent">
                <span className="mr-1.5 text-accent" aria-hidden>
                  ›
                </span>
                {skill.name}
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-auto pt-4 font-mono text-[10px] text-muted">
          <span className="text-accent">{skills.length}</span>
          {" entries listed"}
        </p>
      </div>
    </article>
  );
}

function EssaySkillList({
  label,
  skills,
  levelLabel,
  noEvidence,
}: {
  label: string;
  skills: SkillDisplay[];
  levelLabel: (level?: SkillLevel) => string | null;
  noEvidence: string;
}) {
  if (skills.length === 0) return null;

  return (
    <div className="min-w-0">
      <h3 className="font-heading text-xl font-normal tracking-tight text-foreground sm:text-2xl">
        {label}
      </h3>
      <dl className="mt-4 space-y-3">
        {skills.map((skill) => {
          const level = levelLabel(skill.level);
          const evidence =
            skill.evidenceHref && skill.evidenceTitle ? (
              <Link
                href={`/#${skill.evidenceHref.replace(/^#/, "")}`}
                className="essay-link text-sm text-foreground"
              >
                {skill.evidenceTitle}
              </Link>
            ) : skill.evidenceTitle ? (
              <span className="text-sm text-muted">{skill.evidenceTitle}</span>
            ) : null;

          return (
            <div
              key={skill.name}
              className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1 text-base"
            >
              <dt className="text-foreground">{skill.name}</dt>
              {level && (
                <dd className="text-sm italic text-muted">{level}</dd>
              )}
              {evidence && <dd>{evidence}</dd>}
              {!skill.level && !skill.evidenceTitle && (
                <dd className="sr-only">{noEvidence}</dd>
              )}
            </div>
          );
        })}
      </dl>
    </div>
  );
}

export function Skills({ categories }: SkillsProps) {
  const t = useTranslations("Skills");

  const levelLabel = (level?: SkillLevel) => {
    if (!level) return null;
    return t(`levels.${LEVEL_KEY[level]}`);
  };

  return (
    <Section id="skills" className="py-16 sm:py-24">
      <div className="mx-auto min-w-0 max-w-content px-4 sm:px-6 lg:px-8 minimal:max-w-content-wide minimal:px-5 sm:minimal:px-6">
        <div className="max-w-2xl minimal:max-w-none">
          <p className="decor font-mono text-xs tracking-wide text-accent">
            {t("sectionLabel")}
          </p>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl minimal:mt-0 minimal:text-3xl minimal:font-normal">
            {t("subtitle")}
          </h2>
        </div>

        {/* Terminal: CLI catalog panels */}
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 minimal:hidden">
          {categories.map((cat) => {
            const skills = flattenSkills(cat);
            const label = cat.label || t(`categories.${cat.id}`);

            return (
              <TerminalSkillPanel
                key={cat.id}
                categoryId={cat.id}
                label={label}
                skills={skills}
              />
            );
          })}
        </div>

        {/* Minimal: quiet definition lists */}
        <div className="mt-12 hidden space-y-12 minimal:block">
          {categories.map((cat) => {
            const skills = flattenSkills(cat);
            const label = cat.label || t(`categories.${cat.id}`);

            return (
              <EssaySkillList
                key={cat.id}
                label={label}
                skills={skills}
                levelLabel={levelLabel}
                noEvidence={t("noEvidence")}
              />
            );
          })}
        </div>
      </div>
    </Section>
  );
}
